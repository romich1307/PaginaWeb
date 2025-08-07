import './Sidebar.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await logout();
    }
  };

  return (
    <div className="sidebar-container">
      
      <div className="logo-area">
        <div className="logo">
          <img src="/LogoPagina.png" alt="Logo" />
        </div>
      </div>
      
      <div className="sidebar">
        <div className="user-info">
          <p className="user-name">{user?.nombres} {user?.apellidos}</p>
          <p className="user-email">{user?.email}</p>
        </div>
        
        <h3 className="menu-title">MENU</h3>
        <ul className="menu-list">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/mis-cursos">Mis cursos</Link></li>
          <li><Link to="/examenes">Exámenes disponibles</Link></li>
          <li><Link to="/soporte">Soporte</Link></li>
          <li>
            <button onClick={handleLogout} className="logout-button">
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;