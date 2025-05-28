import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Stock.css";

function Stock() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuAbertoIndex, setMenuAbertoIndex] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [search, setSearch] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroModal, setErroModal] = useState(false);

  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [indiceParaExcluir, setIndiceParaExcluir] = useState(null);

  const navigate = useNavigate();

  const fetchMedicamentos = () => {
    fetch("http://localhost:3001/remedios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMedicamentos(data);
        } else {
          console.error("Resposta inesperada da API:", data);
          setMedicamentos([]);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar medicamentos:", err);
        setMedicamentos([]);
      });
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  const medicamentosFiltrados = medicamentos.filter((med) =>
    med.Nome.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMenu = (index) => {
    setMenuAbertoIndex(menuAbertoIndex === index ? null : index);
  };

  const abrirModal = (mensagem, erro = false) => {
    setMensagemModal(mensagem);
    setErroModal(erro);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const modificarMedicamento = (index) => {
    const remedioSelecionado = medicamentosFiltrados[index];
    navigate(`/cadastrar-remedio/${remedioSelecionado.ID_Remedio}`);
    setMenuAbertoIndex(null);
  };

  const confirmarExclusao = (index) => {
    const remedioSelecionado = medicamentosFiltrados[index];
    const indexOriginal = medicamentos.findIndex(
      (m) => m.ID_Remedio === remedioSelecionado.ID_Remedio
    );
    setIndiceParaExcluir(indexOriginal);
    setModalConfirmacao(true);
    setMenuAbertoIndex(null);
  };

  const excluirConfirmado = () => {
    const medicamento = medicamentos[indiceParaExcluir];
    fetch(`http://localhost:3001/remedios/${medicamento.ID_Remedio}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          abrirModal("Medicamento excluído com sucesso!");
          fetchMedicamentos();
        } else {
          abrirModal("Erro ao excluir o medicamento.", true);
        }
      })
      .catch((err) => {
        console.error("Erro ao excluir:", err);
        abrirModal("Erro ao excluir o medicamento.", true);
      });

    setModalConfirmacao(false);
    setIndiceParaExcluir(null);
  };

  return (
    <>
      <header className="main-header" onClick={() => navigate("/main")}>
        <h1 className="main-header-title">Stock Tracer</h1>
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
          <div className="stock-header">
            <h2>Estoque de Medicamentos</h2>
            <button
              className="add-button"
              onClick={() => navigate("/cadastrar-remedio")}
            >
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {medicamentosFiltrados.length > 0 ? (
                medicamentosFiltrados.map((med, index) => (
                  <tr key={index} className="stock-row">
                    <td>{med.Nome}</td>
                    <td>{med.Lote}</td>
                    <td>{new Date(med.Validade).toLocaleDateString()}</td>
                    <td>{med.Fabricante}</td>
                    <td>{med.Quantidade}</td>
                    <td>{med.Unidade}</td>
                    <td>
                      <button
                        className="gear-btn"
                        onClick={() => toggleMenu(index)}
                      >
                        ⚙️
                      </button>
                      {menuAbertoIndex === index && (
                        <div className="menu-opcoes">
                          <button onClick={() => modificarMedicamento(index)}>
                            ✏️ Modificar
                          </button>
                          <button onClick={() => confirmarExclusao(index)}>
                            🗑️ Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Nenhum medicamento encontrado.</td>
                </tr>
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
              <strong>
                {medicamentos[indiceParaExcluir]?.Nome || "este medicamento"}
              </strong>
              ?
            </p>
            <div className="botoes-confirmacao">
              <button
                onClick={excluirConfirmado}
                className="btn-confirmar"
              >
                Sim
              </button>
              <button
                onClick={() => {
                  setModalConfirmacao(false);
                  setIndiceParaExcluir(null);
                }}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Stock;
