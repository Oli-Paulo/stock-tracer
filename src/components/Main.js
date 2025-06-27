import React, { useState } from "react";
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

// Dados de exemplo do gráfico
const dadosEntrada = [
  { dia: "Segunda", Quantidade: 20 },
  { dia: "Terça", Quantidade: 35 },
  { dia: "Quarta", Quantidade: 25 },
  { dia: "Quinta", Quantidade: 40 },
  { dia: "Sexta", Quantidade: 30 },
];

const dadosSaida = [
  { dia: "Segunda", Quantidade: 10 },
  { dia: "Terça", Quantidade: 15 },
  { dia: "Quarta", Quantidade: 20 },
  { dia: "Quinta", Quantidade: 35 },
  { dia: "Sexta", Quantidade: 28 },
];

function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
