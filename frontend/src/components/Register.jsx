import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    dni: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    const result = await register({
      email: formData.email,
      password: formData.password,
      password_confirm: formData.confirmPassword,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      dni: formData.dni
    });
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px',
      backgroundColor: '#F0FFF0',
      padding: '20px',
      borderRadius: '10px',
      border: '2px solid #228B22'
    }}>
      <h2 style={{ textAlign: 'center', color: '#228B22', fontWeight: 'bold' }}>
         Registrarse
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
        type="text"
        name="nombres"
        placeholder="Nombres"
        value={formData.nombres}
        onChange={handleChange}
        required
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
      />
      
      <input
        type="text"
        name="apellidos"
        placeholder="Apellidos"
        value={formData.apellidos}
        onChange={handleChange}
        required
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
      />
      
      <input
        type="text"
        name="dni"
        placeholder="DNI"
        value={formData.dni}
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

      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirmar Contraseña"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
      />

      <button 
        type="submit"
        style={{ 
          padding: '12px', 
          backgroundColor: '#228B22', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
       Registrarse
      </button>
    </form>
  );
};

export default Register;
