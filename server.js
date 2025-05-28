const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
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
    console.error("❌ Erro ao conectar com o banco de dados:", err.message);
  } else {
    console.log("✅ Conectado ao banco de dados stock_tracer");
  }
});

// --- ROTAS ---

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Login e senha são obrigatórios" });
  }

  const query = "SELECT * FROM Usuario WHERE Login = ? AND Senha = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno do servidor" });
    if (results.length > 0) return res.status(200).json({ success: true });
    res.status(401).json({ error: "Usuário ou senha inválidos" });
  });
});

// Buscar todos os remédios
app.get("/remedios", (req, res) => {
  db.query("SELECT * FROM Remedio", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Buscar um remédio pelo ID
app.get("/remedios/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM Remedio WHERE ID_Remedio = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Remédio não encontrado" });
    res.json(results[0]);
  });
});

// Cadastrar novo remédio
app.post("/remedios", (req, res) => {
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID } = req.body;

  const query = `
    INSERT INTO Remedio (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao cadastrar remédio" });
    res.status(201).json({ success: true });
  });
});

// Atualizar remédio existente
app.put("/remedios/:id", (req, res) => {
  const { id } = req.params;
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID } = req.body;

  const query = `
    UPDATE Remedio
    SET Nome = ?, Lote = ?, Validade = ?, Fabricante = ?, Quantidade = ?, Unidade = ?, ID_Etiqueta_RFID = ?
    WHERE ID_Remedio = ?
  `;

  db.query(query, [nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID, id], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao atualizar o remédio" });
    res.json({ success: true });
  });
});

// Excluir remédio
app.delete("/remedios/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Remedio WHERE ID_Remedio = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erro ao excluir o remédio" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Remédio não encontrado" });
    res.json({ success: true });
  });
});

// Buscar localizações
app.get("/localizacoes", (req, res) => {
  db.query("SELECT * FROM Localizacao", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar localizações" });
    res.json(results);
  });
});

// Buscar caixas RFID
app.get("/caixas", (req, res) => {
  db.query("SELECT * FROM caixa_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Buscar etiquetas RFID
app.get("/etiquetas", (req, res) => {
  db.query("SELECT * FROM etiqueta_rfid", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Registrar leitura RFID
app.post("/leituras", (req, res) => {
  const { idEtiquetaRFID, idCaixa } = req.body;
  const dataHora = new Date();

  const query = `
    INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa)
    VALUES (?, ?, ?)
  `;

  db.query(query, [dataHora, idEtiquetaRFID, idCaixa], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao registrar leitura RFID" });
    res.status(201).json({ success: true });
  });
});

// Registrar movimentação de estoque
app.post("/movimentacoes", (req, res) => {
  const { idRemedio, idUsuario, tipo, quantidade } = req.body;
  const dataHora = new Date();

  const query = `
    INSERT INTO movimentacao_estoque (ID_Remedio, ID_Usuario, Tipo, Data_Hora, Quantidade)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [idRemedio, idUsuario, tipo, dataHora, quantidade], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao registrar movimentação" });
    res.status(201).json({ success: true });
  });
});

// Inicia servidor
app.listen(3001, () => {
  console.log("🚀 Servidor backend rodando na porta 3001");
});
