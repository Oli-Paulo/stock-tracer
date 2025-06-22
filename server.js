const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const SerialPort = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Conexão com o banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stock_tracer",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar com o banco:", err.message);
  } else {
    console.log("✅ Conectado ao banco de dados stock_tracer");
  }
});

// WebSocket + HTTP Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("🟢 Cliente WebSocket conectado");

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log("🔴 Cliente WebSocket desconectado");
  });
});

function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Leitura Serial
function iniciarLeituraSerial() {
  const port = new SerialPort.SerialPort({
    path: "COM4", // ajuste conforme sua porta serial
    baudRate: 115200,
    autoOpen: false,
  });

  port.open((err) => {
    if (err) {
      console.warn("⚠️ Porta serial não disponível:", err.message);
      return;
    }

    console.log("🔌 Porta serial aberta em COM4");

    const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    parser.on("data", async (data) => {
      const trimmed = data.trim();

      // Espera dados no formato UID:IDCaixa (ex: ABCD1234:1)
      const parts = trimmed.split(":");
      if (parts.length !== 2) {
        console.warn("⚠️ Dado da serial inválido (esperado UID:IDCaixa):", trimmed);
        return;
      }

      const uid = parts[0];
      const idCaixa = parseInt(parts[1], 10);

      if (!uid || isNaN(idCaixa)) {
        console.warn("⚠️ UID ou ID da caixa inválido:", trimmed);
        return;
      }

      console.log(`📡 UID: ${uid}, Caixa: ${idCaixa}`);

      try {
        // Verifica se a etiqueta já existe
        const [etiquetas] = await db.promise().query(
          "SELECT * FROM etiqueta_rfid WHERE Codigo_RFID = ?",
          [uid]
        );

        let idEtiquetaRFID;

        if (etiquetas.length === 0) {
          // Insere etiqueta nova
          const [result] = await db.promise().query(
            "INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, 'ativo')",
            [uid]
          );
          idEtiquetaRFID = result.insertId;

          // Redireciona para cadastro
          broadcast({ tipo: "redirecionarCadastro", uid });
        } else {
          idEtiquetaRFID = etiquetas[0].ID_Etiqueta_RFID;
        }

        // Registra leitura na tabela leitura_rfid
        await db.promise().query(
          "INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa) VALUES (NOW(), ?, ?)",
          [idEtiquetaRFID, idCaixa]
        );

        // Verifica se já existe remédio cadastrado para essa etiqueta
        const [remedios] = await db.promise().query(
          "SELECT * FROM remedio WHERE ID_Etiqueta_RFID = ?",
          [idEtiquetaRFID]
        );

        if (remedios.length === 0) {
          // Redireciona para cadastro pois não existe remédio vinculado
          broadcast({ tipo: "redirecionarCadastro", uid });
          return;
        }

        const remedio = remedios[0];
        const novaQuantidade = (remedio.Quantidade || 0) + 1;

        // Atualiza quantidade do remédio
        await db.promise().query(
          "UPDATE remedio SET Quantidade = ? WHERE ID_Remedio = ?",
          [novaQuantidade, remedio.ID_Remedio]
        );

        // Registra movimentação de entrada
        const tipo = "entrada";
        const idUsuario = 1; // Ajuste conforme seu sistema real
        await db.promise().query(
          `INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
           VALUES (?, ?, ?, NOW(), ?)
          `,
          [remedio.ID_Remedio, idUsuario, tipo, 1]
        );

        // Busca nome da localização para envio no broadcast
        let nomeLocalizacao = "Desconhecida";
        if (remedio.ID_Localizacao) {
          const [locs] = await db.promise().query(
            "SELECT Nome FROM localizacao WHERE ID_Localizacao = ?",
            [remedio.ID_Localizacao]
          );
          if (locs.length > 0) {
            nomeLocalizacao = locs[0].Nome;
          }
        }

        // Envia atualização via WebSocket
        broadcast({
          tipo: "entradaRegistrada",
          remedio: {
            idRemedio: remedio.ID_Remedio,
            nome: remedio.Nome,
            quantidade: novaQuantidade,
            unidade: remedio.Unidade,
            idLocalizacao: remedio.ID_Localizacao,
          },
          localizacao: nomeLocalizacao,
        });
      } catch (err) {
        console.error("❌ Erro ao processar UID:", err);
      }
    });
  });

  port.on("error", (err) => {
    console.error("❌ Erro na porta serial:", err.message);
  });
}

iniciarLeituraSerial();

// ================= ROTAS =================

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Login e senha obrigatórios" });

  db.query(
    "SELECT * FROM usuario WHERE Login = ? AND Senha = ?",
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Erro interno" });
      if (results.length > 0) return res.json({ success: true });
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  );
});

// Listar remédios
app.get("/remedios", (req, res) => {
  db.query(
    `
    SELECT remedio.ID_Remedio, remedio.Nome, remedio.Lote, remedio.Validade,
           remedio.Fabricante, remedio.Quantidade, remedio.Unidade,
           etiqueta_rfid.Codigo_RFID AS RFID, remedio.ID_Localizacao
    FROM remedio
    LEFT JOIN etiqueta_rfid ON remedio.ID_Etiqueta_RFID = etiqueta_rfid.ID_Etiqueta_RFID
  `,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Buscar remédio por ID numérico
app.get("/remedios/:id", (req, res) => {
  db.query(
    `
    SELECT remedio.*, etiqueta_rfid.Codigo_RFID AS RFID
    FROM remedio
    LEFT JOIN etiqueta_rfid ON remedio.ID_Etiqueta_RFID = etiqueta_rfid.ID_Etiqueta_RFID
    WHERE remedio.ID_Remedio = ?
  `,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Remédio não encontrado" });
      res.json(results[0]);
    }
  );
});

// Nova rota: Buscar remédio pelo UID do RFID
app.get("/remedios/por-uid/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    // Busca o ID da etiqueta pelo UID
    const [etiquetas] = await db.promise().query(
      "SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?",
      [uid]
    );
    if (etiquetas.length === 0)
      return res.status(404).json({ error: "Etiqueta RFID não encontrada" });

    const idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;

    // Busca o remédio pelo ID da etiqueta
    const [remedios] = await db.promise().query(
      `SELECT remedio.*, etiqueta_rfid.Codigo_RFID AS RFID
       FROM remedio
       LEFT JOIN etiqueta_rfid ON remedio.ID_Etiqueta_RFID = etiqueta_rfid.ID_Etiqueta_RFID
       WHERE remedio.ID_Etiqueta_RFID = ?`,
      [idEtiqueta]
    );

    if (remedios.length === 0)
      return res.status(404).json({ error: "Remédio não encontrado" });

    res.json(remedios[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar remédio
app.post("/remedios", async (req, res) => {
  const {
    nome,
    lote,
    validade,
    fabricante,
    quantidade,
    unidade,
    idEtiquetaRFID,
    idLocalizacao,
  } = req.body;

  try {
    // Verifica se etiqueta RFID existe
    const [etiquetas] = await db
      .promise()
      .query("SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?", [
        idEtiquetaRFID,
      ]);

    let idEtiqueta = null;

    if (etiquetas.length === 0) {
      // Insere etiqueta RFID nova, caso não exista
      const [result] = await db
        .promise()
        .query("INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, 'ativo')", [
          idEtiquetaRFID,
        ]);
      idEtiqueta = result.insertId;
    } else {
      idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;
    }

    // Insere o remédio
    await db.promise().query(
      `
      INSERT INTO remedio (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID, ID_Localizacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [nome, lote, validade, fabricante, quantidade, unidade, idEtiqueta, idLocalizacao]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao cadastrar remédio:", err);
    res.status(500).json({ error: "Erro ao cadastrar remédio" });
  }
});

// Atualizar remédio
app.put("/remedios/:id", async (req, res) => {
  const {
    nome,
    lote,
    validade,
    fabricante,
    quantidade,
    unidade,
    idEtiquetaRFID,
    idLocalizacao,
  } = req.body;

  try {
    // Verifica se etiqueta RFID existe
    const [etiquetas] = await db
      .promise()
      .query("SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?", [
        idEtiquetaRFID,
      ]);

    if (etiquetas.length === 0) {
      return res.status(400).json({ error: "Etiqueta RFID não encontrada" });
    }

    const idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;

    await db.promise().query(
      `
      UPDATE remedio
      SET Nome = ?, Lote = ?, Validade = ?, Fabricante = ?, Quantidade = ?, Unidade = ?,
          ID_Etiqueta_RFID = ?, ID_Localizacao = ?
      WHERE ID_Remedio = ?
    `,
      [
        nome,
        lote,
        validade,
        fabricante,
        quantidade,
        unidade,
        idEtiqueta,
        idLocalizacao,
        req.params.id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao atualizar remédio:", err);
    res.status(500).json({ error: "Erro ao atualizar o remédio" });
  }
});

// Deletar remédio
app.delete("/remedios/:id", (req, res) => {
  db.query("DELETE FROM remedio WHERE ID_Remedio = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erro ao excluir" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
    res.json({ success: true });
  });
});

// Localizações
app.get("/localizacoes", (req, res) => {
  db.query("SELECT * FROM localizacao", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar localizações" });
    res.json(results);
  });
});

// Caixas
app.get("/caixas", (req, res) => {
  db.query("SELECT * FROM caixa_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Etiquetas RFID
app.get("/etiquetas", (req, res) => {
  db.query("SELECT * FROM etiqueta_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Leituras RFID
app.post("/leituras", (req, res) => {
  const { idEtiquetaRFID, idCaixa } = req.body;
  const dataHora = new Date();

  db.query(
    `
    INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa)
    VALUES (?, ?, ?)
  `,
    [dataHora, idEtiquetaRFID, idCaixa],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao registrar leitura" });
      res.status(201).json({ success: true });
    }
  );
});

// Movimentações manuais
app.post("/movimentacoes", (req, res) => {
  const { idRemedio, idUsuario, tipo, quantidade } = req.body;
  const dataHora = new Date();

  db.query(
    `
    INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
    VALUES (?, ?, ?, ?, ?)
  `,
    [idRemedio, idUsuario, tipo, dataHora, quantidade],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao registrar movimentação" });
      res.status(201).json({ success: true });
    }
  );
});

// Usuários
app.get("/usuarios", (req, res) => {
  db.query("SELECT ID_Usuario, Nome, Cargo, Login FROM usuario", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar usuários" });
    res.json(results);
  });
});

app.post("/usuarios", (req, res) => {
  const { nome, cargo, login, senha } = req.body;

  if (!nome || !cargo || !login || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  db.query(
    "INSERT INTO usuario (Nome, Cargo, Login, Senha) VALUES (?, ?, ?, ?)",
    [nome, cargo, login, senha],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao cadastrar usuário" });
      res.status(201).json({ success: true });
    }
  );
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});
