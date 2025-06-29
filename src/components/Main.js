import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../css/Main.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-ST.png";

function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dadosEntrada, setDadosEntrada] = useState([]);
  const [dadosSaida, setDadosSaida] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/movimentacoes/resumo-semanal")
      .then((res) => res.json())
      .then((data) => {
        // data já vem com { dia, entrada, saida }
        // Para os gráficos, separar em dois arrays:
        const entradas = data.map((item) => ({
          dia: item.dia,
          Quantidade: item.entrada,
        }));
        const saidas = data.map((item) => ({
          dia: item.dia,
          Quantidade: item.saida,
        }));

        setDadosEntrada(entradas);
        setDadosSaida(saidas);
      })
      .catch((err) => {
        console.error("Erro ao buscar dados:", err);
        setDadosEntrada([]);
        setDadosSaida([]);
      });
  }, []);

  const handleLogout = () => {
    navigate("/");
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

        <Sidebar isOpen={sidebarOpen} onLogout={handleLogout} />

        <div className={`dashboard ${sidebarOpen ? "shrink" : "expand"}`}>
          <h2>Resumo de Movimentação</h2>

          <div className="grafico-box">
            <h3>Entradas de Medicamentos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dadosEntrada}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Quantidade"
                  stroke="#2E7D32"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-box">
            <h3>Saídas de Medicamentos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dadosSaida}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Quantidade"
                  stroke="#C62828"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
