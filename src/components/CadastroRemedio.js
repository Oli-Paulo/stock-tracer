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
  const [quantidade, setQuantidade] = useState(1);
  const [unidade, setUnidade] = useState("");
  const [rfid, setRfid] = useState("");
  const [localizacoes, setLocalizacoes] = useState([]);
  const [idLocalizacao, setIdLocalizacao] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroCadastro, setErroCadastro] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // Função para identificar se o `id` é numérico
  const isIdNumerico = (valor) => /^\d+$/.test(valor);

  // Busca localizações para o select
  useEffect(() => {
    fetch("http://localhost:3001/localizacoes")
      .then((res) => res.json())
      .then(setLocalizacoes)
      .catch((err) => console.error("Erro ao buscar localizações:", err));
  }, []);

  // Se não tiver id, escuta WebSocket para redirecionar com UID
  useEffect(() => {
    if (!id) {
      const socket = new WebSocket("ws://localhost:3001");

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.tipo === "redirecionarCadastro") {
          const { uid } = data;
          console.log("🔁 Redirecionando para cadastro:", uid);
          navigate(`/cadastrar-remedio/${uid}`);
        }
      };

      socket.onerror = (error) => console.error("Erro WebSocket:", error);
      return () => socket.close();
    }
  }, [id, navigate]);

  // Se tiver id, busca remédio (se for numérico) ou apenas seta UID (se for string)
  useEffect(() => {
    if (id) {
      if (isIdNumerico(id)) {
        // ID numérico: busca dados para edição
        fetch(`http://localhost:3001/remedios/${id}`)
          .then((res) => {
            if (!res.ok) throw new Error("Remédio não encontrado");
            return res.json();
          })
          .then((data) => {
            setNome(data.Nome || "");
            setLote(data.Lote || "");
            setValidade(data.Validade?.split("T")[0] || "");
            setFabricante(data.Fabricante || "");
            setQuantidade(data.Quantidade || 1);
            setUnidade(data.Unidade || "");
            setRfid(data.RFID || "");
            setIdLocalizacao(data.ID_Localizacao || "");
          })
          .catch((error) => {
            console.error("Erro ao buscar remédio:", error);
            setMensagemModal("Remédio não encontrado.");
            setErroCadastro(true);
            setModalAberto(true);
          });
      } else {
        // UID: apenas seta RFID para cadastro novo
        setRfid(id);
        setQuantidade(1);
      }
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // No cadastro novo (UID), quantidade sempre inicia em 1
    const quantidadeEnvio = isIdNumerico(id) ? parseInt(quantidade) : 1;

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
          quantidade: quantidadeEnvio,
          unidade,
          idEtiquetaRFID: rfid,
          idLocalizacao,
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
    if (!erroCadastro) navigate("/Stock");
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
          aria-label="Toggle sidebar"
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
                    value={quantidade}
                    readOnly
                    style={{ backgroundColor: "#eee" }}
                  />
                </div>
                <div className="form-group half-width">
                  <label>Unidade</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
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

              <div className="form-group full-width">
                <label>Localização</label>
                <select
                  value={idLocalizacao}
                  onChange={(e) => setIdLocalizacao(e.target.value)}
                  required
                >
                  <option value="">Selecione a localização</option>
                  {localizacoes.map((loc) => (
                    <option key={loc.ID_Localizacao} value={loc.ID_Localizacao}>
                      {loc.Nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>RFID</label>
                <input
                  type="text"
                  value={rfid}
                  readOnly
                  style={{ backgroundColor: "#eee" }}
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
