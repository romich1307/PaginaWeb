
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Home from './views/Home';
import MisCursos from './views/MisCursos';
import MisCursosInscritos from './views/MisCursosInscritos';
import AdminPanel from './views/AdminPanel';
import Auth from './components/Auth';

function AppContent() {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();

  console.log("App Status:", { isAuthenticated, isLoading, isAdmin, user });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', fontSize: '24px', color: 'blue', textAlign: 'center' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login accesible siempre */}
        <Route path="/login" element={<Auth />} />
        
        {/* Rutas protegidas */}
        {!isAuthenticated ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : isAdmin ? (
          <>
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/admin-panel" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Home />
                </div>
              </div>
            } />
            <Route path="/mis-cursos-inscritos" element={
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <MisCursosInscritos />
                </div>
              </div>
            } />
            <Route path="/mis-cursos" element={
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <MisCursos />
                </div>
              </div>
            } />
            <Route path="/examenes" element={
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <h1>Exámenes Disponibles</h1>
                </div>
              </div>
            } />
            <Route path="/soporte" element={
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <h1>Soporte</h1>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;