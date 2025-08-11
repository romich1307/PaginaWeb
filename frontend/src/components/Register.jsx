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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    if (result.success) {
      // Redirección después del registro exitoso (usuarios normales van al home)
      window.location.href = '/';
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-form">
      <div className="logo-container">
        <img src="/LogoPagina.png" alt="Logo" className="auth-logo" />
      </div>
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

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-input"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {showPassword ? (
                // Ojo cerrado
                <g>
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 2l20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ) : (
                // Ojo abierto
                <g>
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </svg>
          </button>
        </div>

        <div className="password-container">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmar Contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="form-input"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {showConfirmPassword ? (
                // Ojo cerrado
                <g>
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 2l20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ) : (
                // Ojo abierto
                <g>
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </svg>
          </button>
        </div>

        <button type="submit" className="submit-btn">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default Register;
