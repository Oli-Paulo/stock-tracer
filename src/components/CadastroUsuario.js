import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/CadastroUsuario.css";

function CadastrarUsuario() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [erroCadastro, setErroCadastro] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cargo,
          login,
          senha,
        }),
      });

      if (response.ok) {
        setMensagemModal("Usuário cadastrado com sucesso!");
        setErroCadastro(false);
      } else {
        const erro = await response.json();
        setMensagemModal(erro.message || "Erro ao cadastrar usuário.");
        setErroCadastro(true);
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      setMensagemModal("Erro de conexão com o servidor.");
      setErroCadastro(true);
    }

    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    if (!erroCadastro) {
      navigate("/usuarios");
    }
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
          <h2>Cadastrar Usuário</h2>
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

              <div className="form-group full-width">
                <label>Cargo</label>
                <input
                  type="text"
                  placeholder="Cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Login</label>
                <input
                  type="text"
                  placeholder="Login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <button type="submit">Cadastrar</button>
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

export default CadastrarUsuario;
