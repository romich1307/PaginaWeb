
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/dashboard';
import Login from './components/Login';
import Register from './components/Register';

function LoginRegisterForm() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '400px', 
      margin: '0 auto', 
      fontFamily: 'Arial',
      backgroundColor: '#FFD700',
      minHeight: '100vh',
      borderRadius: '10px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => setIsLogin(true)}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isLogin ? '#007bff' : '#f8f9fa',
            color: isLogin ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          style={{ 
            padding: '10px 20px',
            backgroundColor: !isLogin ? '#007bff' : '#f8f9fa',
            color: !isLogin ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Registro
        </button>
      </div>

      {isLogin ? <Login /> : <Register />}
    </div>
  );
}

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
    return <LoginRegisterForm />;
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