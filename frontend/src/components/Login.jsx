import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    console.log('Iniciando login con:', formData.email);
    const result = await login(formData.email, formData.password);
    console.log('Resultado del login:', result);
    
    if (result.success) {
      console.log('Login exitoso, verificando token...');
      const savedToken = localStorage.getItem('authToken');
      console.log('Token guardado:', savedToken);
      
      // Redirección manual después del login exitoso
      if (result.isAdmin) {
        console.log('Usuario es admin, redirigiendo a admin panel...');
        window.location.href = '/admin-panel';
      } else {
        console.log('Usuario normal, redirigiendo a home...');
        window.location.href = '/';
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-form">
      <div className="logo-container">
        <img src="/LogoPagina.png" alt="Logo" className="auth-logo" />
      </div>
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

        <button type="submit" className="submit-btn">
          INICIAR SESIÓN
        </button>
      </form>
    </div>
  );
};

export default Login;