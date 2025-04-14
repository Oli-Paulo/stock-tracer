import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Stock.css";

function Stock() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [menuAbertoIndex, setMenuAbertoIndex] = useState(null);

  const navigate = useNavigate();

  const toggleMenu = (index) => {
    setMenuAbertoIndex(menuAbertoIndex === index ? null : index);
  };

  const modificarMedicamento = (index) => {
    console.log("Modificar:", medicamentos[index]);
    setMenuAbertoIndex(null);
  };

  const excluirMedicamento = (index) => {
    console.log("Excluir:", medicamentos[index]);
    setMenuAbertoIndex(null);
  };

  // Dados estáticos de exemplo
  const medicamentos = [
    {
      nome: "Paracetamol",
      unidade: "Caixa",
      quantidade: 50,
      valor: "R$ 10,00",
    },
    {
      nome: "Ibuprofeno",
      unidade: "Frasco",
      quantidade: 30,
      valor: "R$ 15,00",
    },
  ];

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
            <button className="add-button">+</button>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th>Quantidade</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {medicamentos.map((med, index) => (
                <tr key={index} className="stock-row">
                  <td>{med.nome}</td>
                  <td>{med.unidade}</td>
                  <td>{med.quantidade}</td>
                  <td>
                    {med.valor}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Stock;
