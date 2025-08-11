import React from 'react';
import './Home.css';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  // Función para determinar el saludo según el género
  const getSaludo = () => {
    if (user?.genero === 'femenino' || user?.genero === 'F' || user?.genero === 'Femenino') {
      return '¡Bienvenida de vuelta!';
    } else {
      return '¡Bienvenido de vuelta!';
    }
  };

  return (
    <div className="home-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <h1>{getSaludo()}</h1>
          <h2>{user?.nombres} {user?.apellidos}</h2>
          <p className="user-email">{user?.email}</p>
          <p className="welcome-message">
            Nos alegra tenerte aquí. Explora el menú lateral para acceder a todas las funcionalidades de la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
