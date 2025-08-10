import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px',
      backgroundColor: '#E6F3FF',
      padding: '20px',
      borderRadius: '10px',
      border: '2px solid #0066CC'
    }}>
      <h2 style={{ textAlign: 'center', color: '#0066CC', fontWeight: 'bold' }}>
         Iniciar Sesión
      </h2>

      {error && (
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
      />

      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        value={formData.password}
        onChange={handleChange}
        required
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
      />

      <button 
        type="submit"
        style={{ 
          padding: '12px', 
          backgroundColor: '#0066CC', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
         Iniciar Sesión
      </button>
    </form>
  );
};

export default Login;