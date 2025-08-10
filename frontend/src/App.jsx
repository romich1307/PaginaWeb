
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/dashboard';
import Auth from './components/Auth';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log("App Status:", { isAuthenticated, isLoading, user });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', fontSize: '24px', color: 'blue', textAlign: 'center' }}>
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={
              <div className="welcome-section">
                <h1>Bienvenido, {user?.nombres} {user?.apellidos}!</h1>
                <p>Email: {user?.email}</p>
                <p>DNI: {user?.dni}</p>
              </div>
            } />
            <Route path="/mis-cursos" element={<Dashboard />} />
            <Route path="/examenes" element={<h1>Exámenes Disponibles</h1>} />
            <Route path="/soporte" element={<h1>Soporte</h1>} />
          </Routes>
        </div>
      </div>
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