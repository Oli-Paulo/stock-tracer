import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-ST.png";
import "../css/Stock.css";

function Stock() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [search, setSearch] = useState("");
  const [menuAbertoIndex, setMenuAbertoIndex] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroModal, setErroModal] = useState(false);

  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [indiceParaExcluir, setIndiceParaExcluir] = useState(null);

  const navigate = useNavigate();

  // === Busca os remédios ===
  const fetchMedicamentos = () => {
    fetch("http://localhost:3001/remedios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMedicamentos(data);
        } else {
          setMedicamentos([]);
          console.error("Resposta inesperada da API:", data);
        }
      })
      .catch((err) => {
        setMedicamentos([]);
        console.error("Erro ao buscar medicamentos:", err);
      });
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  // === WebSocket: escuta eventos em tempo real ===
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("WebSocket conectado");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.tipo === "entradaRegistrada") {
          setMedicamentos((prev) => {
            const idx = prev.findIndex((m) => m.ID_Remedio === data.remedio.idRemedio);
            if (idx === -1) return prev;

            const atualizado = [...prev];
            atualizado[idx] = {
              ...atualizado[idx],
              Quantidade: data.remedio.quantidade,
              ID_Localizacao: data.remedio.idLocalizacao,
            };
            return atualizado;
          });
        }

        // 🚀 Redirecionamento automático para cadastro com UID novo
        else if (data.tipo === "redirecionarCadastro") {
          console.log("RFID detectado, redirecionando:", data.uid);
          navigate(`/cadastrar-remedio/${data.uid}`);
        }
      } catch (error) {
        console.error("Erro no WebSocket:", error);
      }
    };

    ws.onclose = () => console.log("WebSocket desconectado");
    ws.onerror = (error) => console.error("WebSocket erro:", error);

    return () => ws.close();
  }, [navigate]);

  // === Filtro ===
  const medicamentosFiltrados = medicamentos.filter((med) =>
    med.Nome.toLowerCase().includes(search.toLowerCase())
  );

  // === Controle de menus ===
  const toggleMenu = (index) => {
    setMenuAbertoIndex(menuAbertoIndex === index ? null : index);
  };

  // === Modal de feedback ===
  const abrirModal = (msg, erro = false) => {
    setMensagemModal(msg);
    setErroModal(erro);
    setModalAberto(true);
  };

  const fecharModal = () => setModalAberto(false);

  // === Exclusão ===
  const confirmarExclusao = (index) => {
    setIndiceParaExcluir(index);
    setModalConfirmacao(true);
    setMenuAbertoIndex(null);
  };

  const excluirConfirmado = () => {
    const medicamento = medicamentosFiltrados[indiceParaExcluir];
    fetch(`http://localhost:3001/remedios/${medicamento.ID_Remedio}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          abrirModal("Medicamento excluído com sucesso!");
          fetchMedicamentos();
        } else {
          abrirModal("Erro ao excluir medicamento.", true);
        }
      })
      .catch(() => abrirModal("Erro ao excluir medicamento.", true));

    setModalConfirmacao(false);
    setIndiceParaExcluir(null);
  };

  // === Modificar ===
  const modificarMedicamento = (index) => {
    const medicamento = medicamentosFiltrados[index];
    navigate(`/cadastrar-remedio/${medicamento.ID_Remedio}`);
    setMenuAbertoIndex(null);
  };

  return (
    <>
      <header className="main-header" onClick={() => navigate("/main")}>
        <img src={logo} alt="Logo Stock Tracer" className="logo-img-main" />
      </header>
      <div className="main-container">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <div className="stock-header">
            <h2>Estoque de Medicamentos</h2>
            <button className="add-button" onClick={() => navigate("/cadastrar-remedio")}>
              +
            </button>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nome do medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <table className="stock-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Lote</th>
                <th>Validade</th>
                <th>Fabricante</th>
                <th>Quantidade</th>
                <th>Unidade</th>
                <th>RFID</th>
                <th>Localização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {medicamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9">Nenhum medicamento encontrado.</td>
                </tr>
              ) : (
                medicamentosFiltrados.map((med, index) => (
                  <tr key={med.ID_Remedio}>
                    <td>{med.Nome}</td>
                    <td>{med.Lote}</td>
                    <td>{new Date(med.Validade).toLocaleDateString()}</td>
                    <td>{med.Fabricante}</td>
                    <td>{med.Quantidade}</td>
                    <td>{med.Unidade}</td>
                    <td>{med.RFID || "-"}</td>
                    <td>{med.ID_Localizacao || "-"}</td>
                    <td>
                      <button className="gear-btn" onClick={() => toggleMenu(index)}>⚙️</button>
                      {menuAbertoIndex === index && (
                        <div className="menu-opcoes">
                          <button onClick={() => modificarMedicamento(index)}>✏️ Modificar</button>
                          <button onClick={() => confirmarExclusao(index)}>🗑️ Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className={`modal-box ${erroModal ? "erro" : ""}`}>
            <p>{mensagemModal}</p>
            <button onClick={fecharModal}>OK</button>
          </div>
        </div>
      )}

      {modalConfirmacao && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>
              Tem certeza que deseja excluir{" "}
              <strong>{medicamentosFiltrados[indiceParaExcluir]?.Nome || "este medicamento"}</strong>?
            </p>
            <div className="botoes-confirmacao">
              <button onClick={excluirConfirmado} className="btn-confirmar">Sim</button>
              <button onClick={() => setModalConfirmacao(false)} className="btn-cancelar">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Stock;
