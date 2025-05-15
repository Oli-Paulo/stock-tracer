import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Main from './components/Main';
import Stock from './components/Stock';
import Location from './components/Location';
import CadastrarRemedio from './components/CadastroRemedio';

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
      </Routes>
    </Router>
  );
}

export default App;