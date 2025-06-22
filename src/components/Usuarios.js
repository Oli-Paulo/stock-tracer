import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import logo from "../assets/Logo-ST.png";
import "../css/Usuarios.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/usuarios")
      .then((response) => setUsuarios(response.data))
      .catch((error) => console.error("Erro ao buscar usuários:", error));
  }, []);

  const handleLogout = () => {
    navigate("/");
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

        <Sidebar isOpen={sidebarOpen} onLogout={handleLogout} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1>Usuários</h1>
            <button
              className="botao-circular"
              onClick={() => navigate("/cadastrar-usuario")}
            >
              +
            </button>
          </div>

          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Login</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.ID_Usuario}>
                  <td>{usuario.ID_Usuario}</td>
                  <td>{usuario.Nome}</td>
                  <td>{usuario.Cargo}</td>
                  <td>{usuario.Login}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Usuarios;