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
    <div className="auth-form">
      <h2 className="form-title">Inicia Sesión</h2>
      
      <p className="form-subtitle">Ingresa tus datos para acceder</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
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
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="form-input"
        />

        <a href="#" className="forgot-password">Forgot your password?</a>

        <button type="submit" className="submit-btn">
          SIGN IN
        </button>
      </form>
    </div>
  );
};

export default Login;