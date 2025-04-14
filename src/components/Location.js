import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Location.css";

const mockData = [
  {
    nome: "Paracetamol",
    caixa: "Caixa 12",
    setor: "Setor A",
    ultimaLocalizacao: "Entrada - 09/04/2025 15:30",
  },
  {
    nome: "Ibuprofeno",
    caixa: "Caixa 5",
    setor: "Setor C",
    ultimaLocalizacao: "Estoque Central - 09/04/2025 14:00",
  },
  {
    nome: "Dipirona",
    caixa: "Caixa 8",
    setor: "Setor B",
    ultimaLocalizacao: "Saída - 10/04/2025 09:45",
  },
];

function Location() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const navigate = useNavigate();

  const handleSearch = () => {
    const filtrado = mockData.filter((med) =>
      med.nome.toLowerCase().includes(search.toLowerCase())
    );
    setResultados(filtrado);
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
          <h2>Localização de Medicamentos</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Digite o nome do medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={handleSearch}>🔍</button>
          </div>

          <table className="location-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Caixa</th>
                <th>Setor</th>
                <th>Última Localização</th>
              </tr>
            </thead>
            <tbody>
              {(resultados.length > 0 ? resultados : mockData).map(
                (med, index) => (
                  <tr key={index}>
                    <td>{med.nome}</td>
                    <td>{med.caixa}</td>
                    <td>{med.setor}</td>
                    <td>{med.ultimaLocalizacao}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Location;
