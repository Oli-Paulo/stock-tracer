import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../css/Location.css";
import axios from "axios";

function Location() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dados, setDados] = useState([]);
  const [ultimaLocalizacao, setUltimaLocalizacao] = useState(null);
  const navigate = useNavigate();

  // Buscar lista de remédios com localizações
  useEffect(() => {
    axios
      .get("http://localhost:3001/remedios") // rota que traz remédios com ID_Localizacao
      .then(async (res) => {
        const remedios = res.data;

        // Para cada remédio, buscar nome da localização para mostrar no front
        // Se quiser otimizar, pode fazer join no backend e criar rota específica
        const promises = remedios.map(async (remedio) => {
          if (remedio.ID_Localizacao) {
            const locRes = await axios.get(`http://localhost:3001/localizacoes`);
            const localizacao = locRes.data.find(loc => loc.ID_Localizacao === remedio.ID_Localizacao);
            return {
              ...remedio,
              NomeLocalizacao: localizacao ? localizacao.Nome : "Não alocado",
              Descricao: localizacao ? localizacao.Descricao : "",
              NomeRemedio: remedio.Nome,
            };
          } else {
            return {
              ...remedio,
              NomeLocalizacao: "Não alocado",
              Descricao: "",
              NomeRemedio: remedio.Nome,
            };
          }
        });

        const remediosComLocalizacao = await Promise.all(promises);
        setDados(remediosComLocalizacao);
      })
      .catch((err) => console.error("Erro ao buscar dados de localizações:", err));
  }, []);

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onmessage = (event) => {
      const mensagem = JSON.parse(event.data);
      // Ajuste aqui para capturar a atualização que o backend envia
      if (mensagem.tipo === "entradaRegistrada") {
        setUltimaLocalizacao(mensagem.localizacao);
        setTimeout(() => setUltimaLocalizacao(null), 5000);
        // Opcional: atualizar a lista puxando dados frescos, ou atualizar localmente
      }
      if (mensagem.tipo === "redirecionarCadastro") {
        // Você pode implementar redirecionamento ou notificação aqui
        console.log("Novo UID detectado:", mensagem.uid);
      }
    };

    return () => socket.close();
  }, []);

  const resultadosFiltrados = dados.filter((item) =>
    item.NomeRemedio.toLowerCase().includes(search.toLowerCase()) ||
    (item.NomeLocalizacao && item.NomeLocalizacao.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <header className="main-header" onClick={() => navigate("/main")}>
        <h1 className="main-header-title">Stock Tracer</h1>
      </header>

      <div className="main-container">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <h2>Localização dos Remédios</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por remédio ou local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <table className="location-table">
            <thead>
              <tr>
                <th>Remédio</th>
                <th>Localização</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.length > 0 ? (
                resultadosFiltrados.map((item, index) => (
                  <tr
                    key={index}
                    className={item.NomeLocalizacao === ultimaLocalizacao ? "highlighted-row" : ""}
                  >
                    <td>{item.NomeRemedio}</td>
                    <td>{item.NomeLocalizacao || "Não alocado"}</td>
                    <td>{item.Descricao || "Sem descrição"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>
                    Nenhum dado encontrado.
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
