import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import logo from "../assets/Logo-ST.png";
import "../css/Usuarios.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuAbertoIndex, setMenuAbertoIndex] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroModal, setErroModal] = useState(false);
  const [indiceParaExcluir, setIndiceParaExcluir] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/usuarios")
      .then((response) => setUsuarios(response.data))
      .catch((error) => console.error("Erro ao buscar usuários:", error));
  }, []);

  useEffect(() => {
    const handleClickFora = (e) => {
      const menu = document.querySelector(".menu-opcoes");
      const engrenagem = document.querySelector(".gear-btn");
      if (menu && !menu.contains(e.target) && !engrenagem.contains(e.target)) {
        setMenuAbertoIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const toggleMenu = (index) => {
    setMenuAbertoIndex(menuAbertoIndex === index ? null : index);
  };

  const abrirModal = (msg, erro = false) => {
    setMensagemModal(msg);
    setErroModal(erro);
    setModalAberto(true);
  };

  const fecharModal = () => setModalAberto(false);

  const confirmarExclusao = (index) => {
    setIndiceParaExcluir(index);
    setMenuAbertoIndex(null);
  };

  const excluirConfirmado = () => {
    const usuario = usuarios[indiceParaExcluir];
    console.log("Tentando excluir usuário ID:", usuario.ID_Usuario);

    axios
      .delete(`http://localhost:3001/usuarios/${usuario.ID_Usuario}`)
      .then((response) => {
        console.log("Resposta da exclusão:", response.data);
        abrirModal("Usuário excluído com sucesso!");
        setUsuarios((prev) =>
          prev.filter((u) => u.ID_Usuario !== usuario.ID_Usuario)
        );
      })
      .catch((error) => {
        console.error("Erro ao excluir usuário:", error);
        abrirModal("Erro ao excluir usuário.", true);
      });

    setIndiceParaExcluir(null);
  };

  const modificarUsuario = (index) => {
    const usuario = usuarios[index];
    navigate(`/cadastrar-usuario/${usuario.ID_Usuario}`);
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

        <Sidebar isOpen={sidebarOpen} onLogout={() => navigate("/")} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h1>Usuários</h1>
            <button className="botao-circular" onClick={() => navigate("/cadastrar-usuario")}>
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario.ID_Usuario}>
                  <td>{usuario.ID_Usuario}</td>
                  <td>{usuario.Nome}</td>
                  <td>{usuario.Cargo}</td>
                  <td>{usuario.Login}</td>
                  <td>
                    <button className="gear-btn" onClick={() => toggleMenu(index)}>
                      ⚙️
                    </button>
                    {menuAbertoIndex === index && (
                      <div className="menu-opcoes">
                        <button onClick={() => modificarUsuario(index)}>✏️ Modificar</button>
                        <button onClick={() => confirmarExclusao(index)}>🗑️ Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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

      {indiceParaExcluir !== null && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>
              Tem certeza que deseja excluir{" "}
              <strong>{usuarios[indiceParaExcluir]?.Nome}</strong>?
            </p>
            <div className="botoes-confirmacao">
              <button onClick={excluirConfirmado} className="btn-confirmar">
                Sim
              </button>
              <button onClick={() => setIndiceParaExcluir(null)} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Usuarios;
