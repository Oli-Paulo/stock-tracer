// server.js
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

// === Conexão com o banco de dados ===
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

// === WebSocket + HTTP Server ===
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

// === Leitura Serial com verificação de duplicidade ===
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

        broadcast({ tipo: "entradaRegistrada", remedio: { ...remedio, quantidade: novaQuantidade }, localizacao: nomeLocalizacao });
      } catch (err) {
        console.error("❌ Erro ao processar UID:", err);
      }
    });
  });

  port.on("error", (err) => console.error("❌ Erro na porta serial:", err.message));
}

iniciarLeituraSerial();

// === ROTAS ===

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

// === CRUD Remédios ===
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
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID, idLocalizacao } = req.body;
  try {
    const [etiquetas] = await db.promise().query("SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?", [idEtiquetaRFID]);
    let idEtiqueta = etiquetas.length ? etiquetas[0].ID_Etiqueta_RFID : (await db.promise().query("INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, 'ativo')", [idEtiquetaRFID]))[0].insertId;

    await db.promise().query(
      `INSERT INTO remedio (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID, ID_Localizacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, lote, validade, fabricante, quantidade, unidade, idEtiqueta, idLocalizacao]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao cadastrar remédio:", err);
    res.status(500).json({ error: "Erro ao cadastrar remédio" });
  }
});

app.put("/remedios/:id", async (req, res) => {
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID, idLocalizacao } = req.body;
  try {
    const [etiquetas] = await db.promise().query("SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?", [idEtiquetaRFID]);
    if (etiquetas.length === 0) return res.status(400).json({ error: "Etiqueta RFID não encontrada" });
    const idEtiqueta = etiquetas[0].ID_Etiqueta_RFID;

    await db.promise().query(
      `UPDATE remedio SET Nome = ?, Lote = ?, Validade = ?, Fabricante = ?, Quantidade = ?, Unidade = ?, ID_Etiqueta_RFID = ?, ID_Localizacao = ? WHERE ID_Remedio = ?`,
      [nome, lote, validade, fabricante, quantidade, unidade, idEtiqueta, idLocalizacao, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao atualizar remédio:", err);
    res.status(500).json({ error: "Erro ao atualizar o remédio" });
  }
});

app.delete("/remedios/:id", (req, res) => {
  db.query("DELETE FROM remedio WHERE ID_Remedio = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erro ao excluir" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
    res.json({ success: true });
  });
});

// === Outras tabelas ===
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

app.get("/usuarios", (req, res) => {
  db.query("SELECT ID_Usuario, Nome, Cargo, Login FROM usuario", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar usuários" });
    res.json(results);
  });
});

app.post("/usuarios", (req, res) => {
  const { nome, cargo, login, senha } = req.body;
  if (!nome || !cargo || !login || !senha) return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  db.query("INSERT INTO usuario (Nome, Cargo, Login, Senha) VALUES (?, ?, ?, ?)", [nome, cargo, login, senha], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao cadastrar usuário" });
    res.status(201).json({ success: true });
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});
