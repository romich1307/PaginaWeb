
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/dashboard';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<h1>Bienvenido - Inicio</h1>} />
            <Route path="/mis-cursos" element={<Dashboard />} />
            <Route path="/examenes" element={<h1>Exámenes Disponibles</h1>} />
            <Route path="/soporte" element={<h1>Soporte</h1>} />
            <Route path="/logout" element={<h1>Cerrar Sesión</h1>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;