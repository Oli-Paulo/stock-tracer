import React from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar({ isOpen }) {
  const navigate = useNavigate();

  const handleNavigateToStock = () => {
    navigate('/stock');
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <ul>
        <li onClick={handleNavigateToStock}>📦 Estoque</li>
        <li onClick={() => navigate('/location')}>📍 Localização</li>
        <li onClick={handleLogout}>🚪 Sair</li>
      </ul>
    </div>
  );
}

export default Sidebar;
