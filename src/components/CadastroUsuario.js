import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-ST.png";
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
  const { id } = useParams();

  const isIdNumerico = (valor) => /^\d+$/.test(valor);

  useEffect(() => {
    if (isIdNumerico(id)) {
      fetch(`http://localhost:3001/usuarios/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Usuário não encontrado");
          return res.json();
        })
        .then((data) => {
          console.log("🔍 Dados recebidos:", data);
          setNome(data.Nome || "");
          setCargo(data.Cargo || "");
          setLogin(data.Login || "");
          setSenha("");
        })
        .catch((error) => {
          console.error("Erro ao buscar usuário:", error);
          setMensagemModal("Usuário não encontrado.");
          setErroCadastro(true);
          setModalAberto(true);
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isIdNumerico(id)
      ? `http://localhost:3001/usuarios/${id}`
      : "http://localhost:3001/usuarios";
    const metodo = isIdNumerico(id) ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cargo, login, senha }),
      });

      if (response.ok) {
        setMensagemModal(
          isIdNumerico(id)
            ? "Usuário atualizado com sucesso!"
            : "Usuário cadastrado com sucesso!"
        );
        setErroCadastro(false);
      } else {
        const erro = await response.json();
        setMensagemModal(erro.message || "Erro ao salvar usuário.");
        setErroCadastro(true);
      }
      setModalAberto(true);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      setMensagemModal("Erro de conexão com o servidor.");
      setErroCadastro(true);
      setModalAberto(true);
    }
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
          <h2>
            {isIdNumerico(id) ? "Modificar Usuário" : "Cadastrar Usuário"}
          </h2>
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

              <button type="submit">
                {isIdNumerico(id) ? "Salvar Alterações" : "Cadastrar"}
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

export default CadastrarUsuario;
