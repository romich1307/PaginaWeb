
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/dashboard';

function LoginRegisterForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    dni: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      const result = await register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni
      });
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </h2>

        {error && (
          <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />

        {!isLogin && (
          <>
            <input
              type="text"
              name="nombres"
              placeholder="Nombres"
              value={formData.nombres}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            <input
              type="text"
              name="apellidos"
              placeholder="Apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            <input
              type="text"
              name="dni"
              placeholder="DNI"
              value={formData.dni}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
          </>
        )}

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />

        {!isLogin && (
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar Contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          />
        )}

        <button 
          type="submit"
          style={{ 
            padding: '12px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>
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