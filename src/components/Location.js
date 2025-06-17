import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Location.css";
import logo from "../assets/Logo-ST.png";
import axios from "axios";

function Location() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localizacoes, setLocalizacoes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/localizacoes") // ✅ URL corrigida
      .then((res) => setLocalizacoes(res.data))
      .catch((err) => console.error("Erro ao buscar localizações:", err));
  }, []);

  // 🔍 Filtra os dados em tempo real
  const resultadosFiltrados = localizacoes.filter((loc) =>
    loc.Nome.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2>Localizações</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nome da localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <table className="location-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.length > 0 ? (
                resultadosFiltrados.map((loc, index) => (
                  <tr key={index}>
                    <td>{loc.Nome}</td>
                    <td>{loc.Descricao}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "1rem" }}>
                    Nenhuma localização encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Location;