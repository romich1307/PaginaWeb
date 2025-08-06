import './Sidebar.css';

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
          <li>Inicio</li>
          <li>Mis cursos</li>
          <li>Exámenes disponibles</li>
          <li>Soporte</li>
          <li>Cerrar sesión</li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;