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
    <div className="auth-form">
      <h2 className="form-title">Crea tu cuenta</h2>
      
      <p className="form-subtitle">Completa tus datos para registrarte</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="nombres"
          placeholder="Nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
          className="form-input"
        />
        
        <input
          type="text"
          name="apellidos"
          placeholder="Apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          required
          className="form-input"
        />
        
        <input
          type="text"
          name="dni"
          placeholder="DNI"
          value={formData.dni}
          onChange={handleChange}
          required
          className="form-input"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
          className="form-input"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar Contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="form-input"
        />

        <button type="submit" className="submit-btn">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default Register;
