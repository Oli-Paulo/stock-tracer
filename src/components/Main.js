import React, { useState } from 'react';
import Sidebar from './Sidebar';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import '../css/Main.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo-ST.png';

// Dados de exemplo do gráfico
const data = [
  { name: 'Seg', qtd: 20 },
  { name: 'Ter', qtd: 35 },
  { name: 'Qua', qtd: 25 },
  { name: 'Qui', qtd: 40 },
  { name: 'Sex', qtd: 30 }
];

function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      <header className="main-header" onClick={() => navigate('/main')}>
        <img src={logo} alt="Logo Stock Tracer" className="logo-img-main" />
      </header>

      <div className="main-container">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>

        <Sidebar isOpen={sidebarOpen} onLogout={handleLogout} />

        <div className={`dashboard ${sidebarOpen ? 'shrink' : 'expand'}`}>
          <h2>Resumo de Movimentação</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="qtd" stroke="#3066BE" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default Main;
