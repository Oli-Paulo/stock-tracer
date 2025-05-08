const express = require("express");
const mysql = require("mysql");
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

// Tenta conectar com o banco de dados
db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar com o banco de dados:", err.message);
  } else {
    console.log("✅ Conectado ao banco de dados stock_tracer");
  }
});


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
  

app.listen(3001, () => {
  console.log("Servidor backend rodando na porta 3001");
});
