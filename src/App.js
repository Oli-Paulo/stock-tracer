import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Main from './components/Main';
import Stock from './components/Stock';
import Location from './components/Location';
import CadastrarRemedio from './components/CadastroRemedio';
import Usuarios from './components/Usuarios';
import CadastrarUsuario from './components/CadastroUsuario';
import CadastrarSaida from "./components/CadastrarSaida";
import Relatorio from './components/Relatorio';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/main" element={<Main />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/location" element={<Location />} />
        <Route path="/cadastrar-remedio" element={<CadastrarRemedio />} />
        <Route path="/cadastrar-remedio/:id" element={<CadastrarRemedio />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/cadastrar-usuario" element={<CadastrarUsuario />} />
        <Route path="/cadastrar-usuario/:id" element={<CadastrarUsuario />} />
        <Route path="/cadastrar-saida" element={<CadastrarSaida />} />

        {/* Rota para relatório */}
        <Route path="/relatorio" element={<Relatorio />} />
      </Routes>
    </Router>
  );
}


export default App;