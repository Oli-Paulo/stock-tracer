const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o banco
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stock_tracer",
});

// Testa conexão
db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar com o banco de dados:", err.message);
  } else {
    console.log("✅ Conectado ao banco de dados stock_tracer");
  }
});

// Login (exemplo)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Login e senha são obrigatórios" });
  }

  const query = "SELECT * FROM Usuario WHERE Login = ? AND Senha = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Erro na consulta SQL:", err.message);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    if (results.length > 0) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  });
});

// Buscar todos os remédios
app.get("/remedios", (req, res) => {
  db.query("SELECT * FROM Remedio", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Buscar um remédio pelo ID (útil para edição)
app.get("/remedios/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM Remedio WHERE ID_Remedio = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Remédio não encontrado" });
    res.json(results[0]);
  });
});

// Cadastrar um novo remédio
app.post("/remedios", (req, res) => {
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID } = req.body;

  const query = `
    INSERT INTO Remedio (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID], (err) => {
    if (err) {
      console.error("Erro ao inserir:", err);
      return res.status(500).json({ error: "Erro ao cadastrar remédio" });
    }

    res.status(201).json({ success: true });
  });
});

// Atualizar um remédio existente
app.put("/remedios/:id", (req, res) => {
  const { id } = req.params;
  const { nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID } = req.body;

  const query = `
    UPDATE Remedio 
    SET Nome = ?, Lote = ?, Validade = ?, Fabricante = ?, Quantidade = ?, Unidade = ?, ID_Etiqueta_RFID = ?
    WHERE ID_Remedio = ?
  `;

  db.query(query, [nome, lote, validade, fabricante, quantidade, unidade, idEtiquetaRFID, id], (err) => {
    if (err) {
      console.error("Erro ao atualizar:", err);
      return res.status(500).json({ error: "Erro ao atualizar o remédio" });
    }

    res.json({ success: true });
  });
});

// Excluir um remédio pelo ID
app.delete("/remedios/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Remedio WHERE ID_Remedio = ?", [id], (err, result) => {
    if (err) {
      console.error("Erro ao excluir:", err);
      return res.status(500).json({ error: "Erro ao excluir o remédio" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Remédio não encontrado" });
    }
    res.json({ success: true });
  });
});

// Servidor escutando
app.listen(3001, () => {
  console.log("Servidor backend rodando na porta 3001");
});
