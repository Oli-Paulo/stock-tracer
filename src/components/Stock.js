import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Stock.css";

function Stock() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuAbertoIndex, setMenuAbertoIndex] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);

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

  const toggleMenu = (index) => {
    setMenuAbertoIndex(menuAbertoIndex === index ? null : index);
  };

  const modificarMedicamento = (index) => {
    const remedioSelecionado = medicamentos[index];
    navigate(`/cadastrar-remedio/${remedioSelecionado.ID_Remedio}`);
    setMenuAbertoIndex(null);
  };

  const excluirMedicamento = (index) => {
    const medicamento = medicamentos[index];
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir "${medicamento.Nome}"?`
    );
    if (confirmacao) {
      fetch(`http://localhost:3001/remedios/${medicamento.ID_Remedio}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (res.ok) {
            alert("Medicamento excluído com sucesso!");
            fetchMedicamentos();
          } else {
            alert("Erro ao excluir o medicamento.");
          }
        })
        .catch((err) => {
          console.error("Erro ao excluir:", err);
          alert("Erro ao excluir o medicamento.");
        });
    }
    setMenuAbertoIndex(null);
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
              {Array.isArray(medicamentos) && medicamentos.length > 0 ? (
                medicamentos.map((med, index) => (
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
                          <div onClick={() => modificarMedicamento(index)}>
                            ✏️ Modificar
                          </div>
                          <div onClick={() => excluirMedicamento(index)}>
                            🗑️ Excluir
                          </div>
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
    </>
  );
}

export default Stock;
