import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => {
    console.log('Cambiando a registro');
    setIsLogin(false);
  };
  
  const switchToLogin = () => {
    console.log('Cambiando a login');
    setIsLogin(true);
  };

  console.log('Estado actual - isLogin:', isLogin);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className={`form-container ${isLogin ? 'show-login' : 'show-register'}`}>
          {/* Panel de Login */}
          <div className="form-panel login-panel">
            <div className="welcome-section">
              <h2>¡Holaaaa!</h2>
              <p>Para mantenaerte conectado con nosotros, por favor inicia sesión con tu información personal</p>
              <button 
                className="switch-btn"
                onClick={switchToRegister}
              >
                REGISTRARSE
              </button>
            </div>
            <div className="form-section">
              <Login onSwitchToRegister={switchToRegister} />
            </div>
          </div>

          {/* Panel de Register */}
          <div className="form-panel register-panel">
            <div className="form-section">
              <Register onSwitchToLogin={switchToLogin} />
            </div>
            <div className="welcome-section">
              <h2>¡Hola, Amigo!</h2>
              <p>Ingresa tus datos personales y comienza tu viaje con nosotros</p>
              <button 
                className="switch-btn"
                onClick={switchToLogin}
              >
                INICIAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;