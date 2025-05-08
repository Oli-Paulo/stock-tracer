import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../css/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Usuário e senha são obrigatórios.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        navigate('/main');
      } else {
        setError(data.error || 'Login inválido');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor.');
      console.error('Erro no login:', error);
    }
  };
  

  return (
    <div className="login-container">
      <h1>Stock Tracer</h1>
      {error && <p className="error-message">{error}</p>}
      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}

export default Login;
