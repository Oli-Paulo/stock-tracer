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

// Conexão banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stock_tracer",
});

db.connect((err) => {
  if (err) console.error("❌ Erro ao conectar com o banco:", err.message);
  else console.log("✅ Conectado ao banco de dados stock_tracer");
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

// Leitura serial com verificação duplicidade
function iniciarLeituraSerial() {
  const port = new SerialPort.SerialPort({ path: "COM4", baudRate: 115200, autoOpen: false });

  port.open((err) => {
    if (err) return console.warn("⚠️ Porta serial não disponível:", err.message);
    console.log("🔌 Porta serial aberta em COM4");

    const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
    parser.on("data", async (data) => {
      const trimmed = data.trim();
      const parts = trimmed.split(":");
      if (parts.length !== 2) return;

      const uid = parts[0].trim().toUpperCase();
      const idCaixa = parseInt(parts[1], 10);
      if (!uid || isNaN(idCaixa)) return;

      console.log(`📡 UID: ${uid}, Caixa: ${idCaixa}`);

      try {
        const [etiquetas] = await db.promise().query("SELECT * FROM etiqueta_rfid WHERE Codigo_RFID = ?", [uid]);
        let idEtiquetaRFID;

        if (etiquetas.length === 0) {
          const [result] = await db.promise().query("INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, 'ativo')", [uid]);
          idEtiquetaRFID = result.insertId;
          broadcast({ tipo: "redirecionarCadastro", uid });
          return;
        } else {
          idEtiquetaRFID = etiquetas[0].ID_Etiqueta_RFID;
        }

        // Verifica duplicidade em 5 segundos
        const [ultimasLeituras] = await db.promise().query(
          `SELECT * FROM leitura_rfid WHERE ID_Etiqueta_RFID = ? AND ID_Caixa = ?
           ORDER BY Data_Hora DESC LIMIT 1`, [idEtiquetaRFID, idCaixa]
        );

        if (ultimasLeituras.length > 0) {
          const ultimaLeitura = new Date(ultimasLeituras[0].Data_Hora);
          const agora = new Date();
          const diff = (agora - ultimaLeitura) / 1000;
          if (diff < 5) return console.log("⏱️ Leitura ignorada por duplicidade");
        }

        // Inserir leitura
        await db.promise().query("INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa) VALUES (NOW(), ?, ?)", [idEtiquetaRFID, idCaixa]);

        // Atualizar quantidade de remédio
        const [remedios] = await db.promise().query("SELECT * FROM remedio WHERE ID_Etiqueta_RFID = ?", [idEtiquetaRFID]);

        if (remedios.length === 0) return broadcast({ tipo: "redirecionarCadastro", uid });

        const remedio = remedios[0];
        const novaQuantidade = (remedio.Quantidade || 0) + 1;

        await db.promise().query("UPDATE remedio SET Quantidade = ? WHERE ID_Remedio = ?", [novaQuantidade, remedio.ID_Remedio]);
        await db.promise().query(
          `INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
           VALUES (?, ?, ?, NOW(), ?)`,
          [remedio.ID_Remedio, 1, "entrada", 1]
        );

        let nomeLocalizacao = "Desconhecida";
        if (remedio.ID_Localizacao) {
          const [locs] = await db.promise().query("SELECT Nome FROM localizacao WHERE ID_Localizacao = ?", [remedio.ID_Localizacao]);
          if (locs.length > 0) nomeLocalizacao = locs[0].Nome;
        }

        broadcast({ tipo: "entradaRegistrada", remedio: { ...remedio, Quantidade: novaQuantidade }, localizacao: nomeLocalizacao });
      } catch (err) {
        console.error("❌ Erro ao processar UID:", err);
      }
    });
  });

  port.on("error", (err) => console.error("❌ Erro na porta serial:", err.message));
}

iniciarLeituraSerial();

// ROTAS

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Login e senha obrigatórios" });
  db.query("SELECT * FROM usuario WHERE Login = ? AND Senha = ?", [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno" });
    if (results.length > 0) return res.json({ success: true });
    res.status(401).json({ error: "Credenciais inválidas" });
  });
});

// CRUD Remédios

app.get("/remedios", (req, res) => {
  db.query(
    `SELECT r.*, e.Codigo_RFID AS RFID FROM remedio r
     LEFT JOIN etiqueta_rfid e ON r.ID_Etiqueta_RFID = e.ID_Etiqueta_RFID`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

app.get("/remedios/:id", (req, res) => {
  db.query(
    `SELECT r.*, e.Codigo_RFID AS RFID FROM remedio r
     LEFT JOIN etiqueta_rfid e ON r.ID_Etiqueta_RFID = e.ID_Etiqueta_RFID
     WHERE r.ID_Remedio = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: "Remédio não encontrado" });
      res.json(results[0]);
    }
  );
});

app.post("/remedios", async (req, res) => {
  const {
    nome, lote, validade, fabricante,
    quantidade, unidade, idEtiquetaRFID, idLocalizacao,
  } = req.body;

  const conn = db.promise();

  try {
    const [etiquetas] = await conn.query(
      "SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?",
      [idEtiquetaRFID]
    );

    let idEtiqueta;
    if (etiquetas.length > 0) {
      idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;
    } else {
      const [resEtiqueta] = await conn.query(
        "INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, 'ATIVO')",
        [idEtiquetaRFID]
      );
      idEtiqueta = resEtiqueta.insertId;
    }

    const [resCaixa] = await conn.query(
      "INSERT INTO caixa_rfid (Localizacao, Status, Capacidade_Maxima) VALUES (?, ?, ?)",
      ["Estoque Central", "OCUPADA", 1]
    );
    const idCaixa = resCaixa.insertId;

    const [resRemedio] = await conn.query(
      `INSERT INTO remedio
        (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID, ID_Localizacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, lote, validade, fabricante,
        quantidade, unidade, idEtiqueta, idLocalizacao,
      ]
    );
    const idRemedio = resRemedio.insertId;

    await conn.query(
      `INSERT INTO movimentacao_estoque 
        (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
       VALUES (?, ?, ?, NOW(), ?)`,
      [idRemedio, null, "ENTRADA", quantidade]
    );

    await conn.query(
      `INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa)
       VALUES (NOW(), ?, ?)`,
      [idEtiqueta, idCaixa]
    );

    res.status(201).json({ success: true, message: "Remédio cadastrado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao cadastrar remédio:", err);
    res.status(500).json({ error: "Erro ao cadastrar remédio" });
  }
});

app.put("/remedios/:id", async (req, res) => {
  const {
    nome, lote, validade, fabricante,
    quantidade, unidade, idEtiquetaRFID, idLocalizacao,
  } = req.body;

  try {
    const conn = db.promise();

    const [etiquetas] = await conn.query(
      "SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?",
      [idEtiquetaRFID]
    );
    if (etiquetas.length === 0)
      return res.status(400).json({ error: "Etiqueta RFID não encontrada" });
    const idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;

    await conn.query(
      `UPDATE remedio SET Nome = ?, Lote = ?, Validade = ?, Fabricante = ?, Quantidade = ?, Unidade = ?, ID_Etiqueta_RFID = ?, ID_Localizacao = ? WHERE ID_Remedio = ?`,
      [
        nome, lote, validade, fabricante,
        quantidade, unidade, idEtiqueta, idLocalizacao, req.params.id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao atualizar remédio:", err);
    res.status(500).json({ error: "Erro ao atualizar o remédio" });
  }
});

app.delete("/remedios/:id", async (req, res) => {
  const idRemedio = req.params.id;

  try {
    const conn = db.promise();

    // Pega o ID_Etiqueta_RFID do remédio
    const [remedioRows] = await conn.query(
      "SELECT ID_Etiqueta_RFID FROM remedio WHERE ID_Remedio = ?",
      [idRemedio]
    );

    if (remedioRows.length === 0) {
      return res.status(404).json({ error: "Remédio não encontrado." });
    }

    const idEtiqueta = remedioRows[0].ID_Etiqueta_RFID;

    // Excluir movimentações de estoque
    await conn.query("DELETE FROM movimentacao_estoque WHERE ID_Remedio = ?", [idRemedio]);

    // Excluir leituras RFID da etiqueta
    if (idEtiqueta !== null) {
      await conn.query("DELETE FROM leitura_rfid WHERE ID_Etiqueta_RFID = ?", [idEtiqueta]);
    }

    // Excluir o remédio
    await conn.query("DELETE FROM remedio WHERE ID_Remedio = ?", [idRemedio]);

    // Apagar etiqueta RFID se não vinculada a outro remédio
    if (idEtiqueta !== null) {
      const [outros] = await conn.query(
        "SELECT 1 FROM remedio WHERE ID_Etiqueta_RFID = ? LIMIT 1",
        [idEtiqueta]
      );
      if (outros.length === 0) {
        await conn.query("DELETE FROM etiqueta_rfid WHERE ID_Etiqueta_RFID = ?", [idEtiqueta]);
      }
    }

    res.json({ success: true, message: "Remédio e dados relacionados excluídos com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir remédio:", error);
    res.status(500).json({ error: "Erro ao excluir remédio." });
  }
});

// Rota para registrar saída de medicamento
app.post("/saidas", async (req, res) => {
  const { ID_Remedio, Quantidade } = req.body;

  if (!ID_Remedio || !Quantidade)
    return res.status(400).json({ error: "ID_Remedio e Quantidade são obrigatórios" });

  try {
    const conn = db.promise();

    const [remedios] = await conn.query("SELECT Quantidade FROM remedio WHERE ID_Remedio = ?", [ID_Remedio]);
    if (remedios.length === 0)
      return res.status(404).json({ error: "Remédio não encontrado" });

    const estoqueAtual = remedios[0].Quantidade;
    const novaQuantidade = estoqueAtual - Quantidade;

    if (novaQuantidade < 0)
      return res.status(400).json({ error: "Quantidade insuficiente no estoque" });

    await conn.query("UPDATE remedio SET Quantidade = ? WHERE ID_Remedio = ?", [novaQuantidade, ID_Remedio]);

    await conn.query(
      `INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
       VALUES (?, ?, 'SAIDA', NOW(), ?)`,
      [ID_Remedio, 1, Quantidade] // Substitua 1 pelo ID do usuário real, se possível
    );

    res.json({ success: true, message: "Saída registrada com sucesso" });
  } catch (err) {
    console.error("Erro ao registrar saída:", err);
    res.status(500).json({ error: "Erro ao registrar saída" });
  }
});

// Outras tabelas

app.get("/localizacoes", (req, res) => {
  db.query("SELECT * FROM localizacao", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar localizações" });
    res.json(results);
  });
});

app.get("/caixas", (req, res) => {
  db.query("SELECT * FROM caixa_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/etiquetas", (req, res) => {
  db.query("SELECT * FROM etiqueta_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/leituras", (req, res) => {
  const { idEtiquetaRFID, idCaixa } = req.body;
  db.query("INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa) VALUES (NOW(), ?, ?)", [idEtiquetaRFID, idCaixa], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao registrar leitura" });
    res.status(201).json({ success: true });
  });
});

app.post("/movimentacoes", (req, res) => {
  const { idRemedio, idUsuario, tipo, quantidade } = req.body;
  db.query("INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade) VALUES (?, ?, ?, NOW(), ?)", [idRemedio, idUsuario, tipo, quantidade], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao registrar movimentação" });
    res.status(201).json({ success: true });
  });
});

// Usuários

app.get("/usuarios", (req, res) => {
  db.query("SELECT ID_Usuario, Nome, Cargo, Login FROM usuario", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar usuários" });
    res.json(results);
  });
});

app.get("/usuarios/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [resultado] = await db.promise().query("SELECT * FROM usuario WHERE ID_Usuario = ?", [id]);
    if (resultado.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.json(resultado[0]);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

app.post("/usuarios", (req, res) => {
  const { nome, cargo, login, senha } = req.body;
  if (!nome || !cargo || !login || !senha)
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  db.query("INSERT INTO usuario (Nome, Cargo, Login, Senha) VALUES (?, ?, ?, ?)", [nome, cargo, login, senha], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao cadastrar usuário" });
    res.status(201).json({ success: true });
  });
});

app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [movimentacoes] = await db.promise().query(
      "SELECT COUNT(*) AS total FROM movimentacao_estoque WHERE ID_Usuario = ?",
      [id]
    );

    if (movimentacoes[0].total > 0) {
      return res.status(400).json({
        error: "Não é possível excluir este usuário, pois ele possui movimentações registradas.",
      });
    }

    const [resultado] = await db.promise().query(
      "DELETE FROM usuario WHERE ID_Usuario = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ success: true, message: "Usuário excluído com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao excluir usuário:", err);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
});

// Rota nova: resumo semanal de movimentações (entrada/saída)
app.get("/movimentacoes/resumo-semanal", (req, res) => {
  const sql = `
    SELECT
      DAYNAME(Data_Hora) AS dia,
      SUM(CASE WHEN UPPER(Tipo) = 'ENTRADA' THEN Quantidade ELSE 0 END) AS total_entrada,
      SUM(CASE WHEN UPPER(Tipo) = 'SAIDA' THEN Quantidade ELSE 0 END) AS total_saida
    FROM movimentacao_estoque
    WHERE Data_Hora >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DAYNAME(Data_Hora)
    ORDER BY FIELD(DAYNAME(Data_Hora), 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar resumo semanal:", err);
      return res.status(500).json({ error: "Erro ao buscar dados" });
    }

    const nomesDias = {
      Monday: "Segunda",
      Tuesday: "Terça",
      Wednesday: "Quarta",
      Thursday: "Quinta",
      Friday: "Sexta",
      Saturday: "Sábado",
      Sunday: "Domingo",
    };

    const dadosFormatados = results.map(row => ({
      dia: nomesDias[row.dia] || row.dia,
      entrada: row.total_entrada || 0,
      saida: row.total_saida || 0,
    }));

    res.json(dadosFormatados);
  });
});
// Rota nova: movimentações completas detalhadas
app.get("/movimentacoes-completas", async (req, res) => {
  try {
    const [resultados] = await db.promise().query(`
      SELECT
        me.ID_Movimentacao,
        me.Tipo,
        me.Data_Hora,
        me.Quantidade,
        r.Nome AS NomeRemedio,
        u.Nome AS NomeUsuario
      FROM movimentacao_estoque me
      LEFT JOIN remedio r ON me.ID_Remedio = r.ID_Remedio
      LEFT JOIN usuario u ON me.ID_Usuario = u.ID_Usuario
      ORDER BY me.Data_Hora DESC
    `);
    res.json(resultados);
  } catch (err) {
    console.error("❌ Erro ao buscar movimentações completas:", err);
    res.status(500).json({ error: "Erro ao buscar movimentações completas" });
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});