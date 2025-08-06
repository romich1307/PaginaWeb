import './Sidebar.css';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar-container">
      
      <div className="logo-area">
        <div className="logo">
          <img src="/LogoPagina.png" alt="Logo" />
        </div>
      </div>
      
      <div className="sidebar">
        <h3 className="menu-title">MENU</h3>
        <ul className="menu-list">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/mis-cursos">Mis cursos</Link></li>
          <li><Link to="/examenes">Exámenes disponibles</Link></li>
          <li><Link to="/soporte">Soporte</Link></li>
          <li><Link to="/logout">Cerrar sesión</Link></li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;