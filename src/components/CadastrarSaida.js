import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-ST.png";
import "../css/CadastroSaida.css";
import axios from "axios";

function CadastrarSaida() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [idSelecionado, setIdSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [estoqueAtual, setEstoqueAtual] = useState(0);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/remedios")
      .then((res) => setMedicamentos(res.data))
      .catch((err) => console.error("Erro ao buscar remédios:", err));
  }, []);

  useEffect(() => {
    if (idSelecionado) {
      const remedio = medicamentos.find(
        (m) => m.ID_Remedio === parseInt(idSelecionado)
      );
      if (remedio) {
        setEstoqueAtual(remedio.Quantidade);
        setErro("");
      }
    }
  }, [idSelecionado, medicamentos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idSelecionado || !quantidade) {
      setErro("Selecione um produto e informe a quantidade.");
      return;
    }

    if (parseInt(quantidade) > estoqueAtual) {
      setErro("Quantidade solicitada excede o estoque disponível.");
      return;
    }

    try {
      await axios.post("http://localhost:3001/saidas", {
        ID_Remedio: idSelecionado,
        Quantidade: quantidade,
      });

      setMensagem("Saída registrada com sucesso!");
      setErro("");
      setQuantidade("");
      setIdSelecionado("");
    } catch (err) {
      console.error("Erro ao registrar saída:", err);
      setErro("Erro ao registrar saída.");
    }
  };

  return (
    <>
      <header className="main-header" onClick={() => navigate("/main")}>
        <img src={logo} alt="Logo Stock Tracer" className="logo-img-main" />
      </header>

      <div className="main-container">
        <button
          className="toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <h2>Registrar Saída de Produto</h2>

          <form className="form-cadastro" onSubmit={handleSubmit}>
            <label>Selecionar Produto</label>
            <select
              value={idSelecionado}
              onChange={(e) => setIdSelecionado(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {medicamentos.map((m) => (
                <option key={m.ID_Remedio} value={m.ID_Remedio}>
                  {m.Nome} (Estoque: {m.Quantidade})
                </option>
              ))}
            </select>

            <label>Quantidade para saída</label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
            />

            {erro && <p className="erro">{erro}</p>}
            {mensagem && <p className="sucesso">{mensagem}</p>}

            <button type="submit">Confirmar Saída</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default CadastrarSaida;
