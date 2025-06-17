import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-ST.png";
import "../css/CadastroRemedio.css";

function CadastrarRemedio() {
  const [nome, setNome] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("");
  const [rfid, setRfid] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroCadastro, setErroCadastro] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // Busca os dados do remédio se estiver em modo edição
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:3001/remedios/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setNome(data.Nome);
          setLote(data.Lote);
          setValidade(data.Validade ? data.Validade.split("T")[0] : "");
          setFabricante(data.Fabricante);
          setQuantidade(data.Quantidade);
          setUnidade(data.Unidade);
          setRfid(data.Codigo_RFID || "");
        })
        .catch((error) => {
          console.error("Erro ao carregar dados do remédio:", error);
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const metodo = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost:3001/remedios/${id}`
      : "http://localhost:3001/remedios";

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          lote,
          validade,
          fabricante,
          quantidade: parseInt(quantidade),
          unidade,
          rfid,
        }),
      });

      if (response.ok) {
        setMensagemModal(
          id
            ? "Remédio atualizado com sucesso!"
            : "Remédio cadastrado com sucesso!"
        );
        setErroCadastro(false);
      } else {
        const erro = await response.json();
        setMensagemModal(erro.message || "Erro ao salvar remédio.");
        setErroCadastro(true);
      }

      setModalAberto(true);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setMensagemModal("Erro de conexão com o servidor.");
      setErroCadastro(true);
      setModalAberto(true);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    if (!erroCadastro) {
      navigate("/Stock");
    }
  };

  return (
    <>
      <header className="main-header" onClick={() => navigate('/main')}>
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
          <h2>{id ? "Modificar Remédio" : "Cadastrar Novo Remédio"}</h2>
          <div className="form-wrapper">
            <form className="form-cadastro" onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label>Nome</label>
                <input
                  type="text"
                  placeholder="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Lote</label>
                  <input
                    type="text"
                    placeholder="Lote"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label>Validade</label>
                  <input
                    type="date"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Fabricante</label>
                <input
                  type="text"
                  placeholder="Fabricante"
                  value={fabricante}
                  onChange={(e) => setFabricante(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantidade"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label>Unidade</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    required
                  >
                    <option value="">Selecione a unidade</option>
                    <option value="CAIXA">CAIXA</option>
                    <option value="UNIDADE">UNIDADE</option>
                    <option value="FRASCO">FRASCO</option>
                    <option value="AMPOLA">AMPOLA</option>
                    <option value="TUBO">TUBO</option>
                    <option value="COMPRIMIDO">COMPRIMIDO</option>
                    <option value="BISNAGA">BISNAGA</option>
                    <option value="GARRAFA">GARRAFA</option>
                    <option value="BLISTER">BLISTER</option>
                  </select>
                </div>
              </div>

              {/* Campo RFID */}
              <div className="form-group full-width">
                <label>RFID</label>
                <input
                  type="text"
                  placeholder="Código RFID"
                  value={rfid}
                  onChange={(e) => setRfid(e.target.value)}
                  required
                />
              </div>

              <button type="submit">
                {id ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{mensagemModal}</p>
            <button onClick={fecharModal}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}

export default CadastrarRemedio;
