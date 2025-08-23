import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Email específico para el administrador
  const ADMIN_EMAIL = 'jiji@gmail.com';

  // Verificar si hay un token guardado al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verificar si el token es válido haciendo una petición al servidor
      checkAuthStatus(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatus = async (token) => {
    try {
      console.log('AuthContext: Verificando estado de autenticación con token:', token);
  const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: Datos del usuario obtenidos:', userData);
        
        setUser(userData.user); // Establecer solo userData.user, no userData completo
        setIsAuthenticated(true);
        
        // Debug detallado para verificar el email
        console.log('AuthContext: Email del usuario recibido:', `"${userData.user.email}"`);
        console.log('AuthContext: ADMIN_EMAIL configurado:', `"${ADMIN_EMAIL}"`);
        console.log('AuthContext: is_staff del usuario:', userData.user.is_staff);
        
        // Verificación temporal: cualquier usuario con is_staff=True es admin
        const isAdminUser = userData.user.email === ADMIN_EMAIL || userData.user.is_staff;
        setIsAdmin(isAdminUser);
        console.log('AuthContext: Usuario es admin (verificación temporal)?', isAdminUser);
      } else {
        // Token inválido, eliminarlo
        console.log('AuthContext: Token inválido, eliminando...');
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Intentando login con email:', email);
  const response = await fetch(`${import.meta.env.VITE_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('AuthContext: Respuesta del servidor:', data);

      if (response.ok) {
        console.log('AuthContext: Login exitoso, guardando token:', data.token);
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Debug detallado para verificar el email
        console.log('AuthContext: Email del usuario recibido:', `"${data.user.email}"`);
        console.log('AuthContext: ADMIN_EMAIL configurado:', `"${ADMIN_EMAIL}"`);
        console.log('AuthContext: Comparación exacta:', data.user.email === ADMIN_EMAIL);
        
        // Verificación temporal: cualquier usuario con is_staff=True es admin
        const isAdminUser = data.user.email === ADMIN_EMAIL || data.user.is_staff;
        setIsAdmin(isAdminUser);
        console.log('AuthContext: Usuario es admin (verificación temporal)?', isAdminUser);
        console.log('AuthContext: is_staff del usuario:', data.user.is_staff);
        
        return { success: true, isAdmin: isAdminUser };
      } else {
        console.log('AuthContext: Error en login:', data);
        return { 
          success: false, 
          error: data.error || 'Error al iniciar sesión' 
        };
      }
    } catch (error) {
      console.error('AuthContext: Error en login:', error);
      return { 
        success: false, 
        error: 'Error de conexión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      
  const response = await fetch(`${import.meta.env.VITE_API_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setIsAdmin(data.user.email === ADMIN_EMAIL);
        return { success: true };
      } else {
        console.error('Registration failed:', data);
        return { 
          success: false, 
          error: data.error || JSON.stringify(data) || 'Error al registrarse' 
        };
      }
    } catch (error) {
      console.error('Error during registration:', error);
      return { 
        success: false, 
        error: 'Error de conexión. Verifica que el servidor esté funcionando.' 
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
  await fetch(`${import.meta.env.VITE_API_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
