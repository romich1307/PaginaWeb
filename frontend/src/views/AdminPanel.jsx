import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

function AdminPanel() {
  const { logout, user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormularioCurso, setMostrarFormularioCurso] = useState(false);
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    descripcion: '',
    instructor: '',
    ubicacion: '',
    horario: '',
    precio: '',
    duracion_semanas: '',
    nivel: 'basico',
    activo: true
  });

  const API_BASE_URL = 'http://localhost:8000/api';

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken'); // Cambiar de 'token' a 'authToken'
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        ...options.headers,
      },
    });
  };

  // Cargar datos reales del backend
  useEffect(() => {
    console.log('AdminPanel: Estado de autenticación:', {
      isAuthenticated,
      isAdmin,
      isLoading,
      user
    });

    if (isLoading) {
      console.log('AdminPanel: Esperando carga de autenticación...');
      return;
    }

    if (!isAuthenticated) {
      console.log('AdminPanel: Usuario no autenticado');
      setError('No estás logueado. Por favor inicia sesión primero.');
      return;
    }

    if (!isAdmin) {
      console.log('AdminPanel: Usuario no es administrador');
      setError('No tienes permisos de administrador.');
      return;
    }
    
    console.log('AdminPanel: Usuario autenticado y es admin, cargando datos...');
    loadData();
  }, [isAuthenticated, isAdmin, isLoading]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken'); // Usar 'authToken' consistentemente
      console.log('Token:', token);
      
      if (!token) {
        setError('No estás logueado. Por favor inicia sesión primero.');
        return;
      }
      
      // Primero verificar si el token es válido obteniendo el perfil del usuario
      const profileResponse = await fetchWithAuth(`${API_BASE_URL}/profile/`);
      console.log('Profile response status:', profileResponse.status);
      
      if (profileResponse.status === 401 || profileResponse.status === 403) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('authToken'); // Cambiar de 'token' a 'authToken'
        return;
      }
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.log('Profile response error:', errorText);
        setError(`Error de autenticación: ${profileResponse.status}`);
        return;
      }
      
      const profileData = await profileResponse.json();
      console.log('User profile:', profileData);
      
      // Verificar si es admin
      const adminResponse = await fetchWithAuth(`${API_BASE_URL}/admin/is-admin/`);
      console.log('Admin response status:', adminResponse.status);
      
      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.log('Admin response error:', errorText);
        setError(`Error verificando permisos: ${adminResponse.status}`);
        return;
      }
      
      const adminData = await adminResponse.json();
      console.log('Admin data:', adminData);
      
      if (!adminData.is_admin) {
        setError(`No tienes permisos de administrador. Email actual: ${profileData.user?.email || 'No disponible'}. Se requiere: jiji@gmail.com`);
        return;
      }

      // Cargar estudiantes
      const estudiantesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/estudiantes/`);
      if (estudiantesResponse.ok) {
        const estudiantesData = await estudiantesResponse.json();
        setEstudiantes(estudiantesData);
      }

      // Cargar cursos
      const cursosResponse = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/`);
      if (cursosResponse.ok) {
        const cursosData = await cursosResponse.json();
        setCursos(cursosData);
      }

      // Cargar inscripciones
      const inscripcionesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/`);
      if (inscripcionesResponse.ok) {
        const inscripcionesData = await inscripcionesResponse.json();
        setInscripciones(inscripcionesData);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de pago
  const actualizarEstadoPago = async (inscripcionId, nuevoEstado) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${inscripcionId}/`, {
        method: 'PUT',
        body: JSON.stringify({ estado_pago: nuevoEstado }),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Estado de pago actualizado correctamente');
      } else {
        setError('Error al actualizar el estado de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar el estado de pago');
    }
  };

  // Función para manejar el envío del formulario de nuevo curso
  const handleCrearCurso = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!nuevoCurso.nombre || !nuevoCurso.descripcion || !nuevoCurso.precio) {
      alert('Por favor completa al menos el nombre, descripción y precio del curso');
      return;
    }

    const exito = await crearCurso(nuevoCurso);
    if (exito) {
      // Limpiar el formulario
      setNuevoCurso({
        nombre: '',
        descripcion: '',
        instructor: '',
        ubicacion: '',
        horario: '',
        precio: '',
        duracion_semanas: '',
        nivel: 'basico',
        activo: true
      });
      setMostrarFormularioCurso(false);
    }
  };

  // Función para crear un nuevo curso
  const crearCurso = async (datosNuevoCurso) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/`, {
        method: 'POST',
        body: JSON.stringify(datosNuevoCurso),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Curso creado exitosamente');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Error al crear curso:', errorData);
        setError(`Error al crear curso: ${JSON.stringify(errorData)}`);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear el curso');
      return false;
    }
  };

  // Función para actualizar información del curso
  const actualizarCurso = async (cursoId, campo, valor) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/${cursoId}/`, {
        method: 'PUT',
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Curso actualizado correctamente');
      } else {
        setError('Error al actualizar el curso');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar el curso');
    }
  };

  // Función para actualizar fechas de inscripción
  const actualizarFechasInscripcion = async (inscripcionId, fechas) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${inscripcionId}/`, {
        method: 'PUT',
        body: JSON.stringify(fechas),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Fechas actualizadas correctamente');
      } else {
        setError('Error al actualizar las fechas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar las fechas');
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Verificando autenticación...</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Cargando panel de administración...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Panel de Administración</h1>
          <div className="error-message" style={{color: 'red', padding: '20px', textAlign: 'center'}}>
            {error}
            <br />
            <div style={{marginTop: '15px'}}>
              <button 
                onClick={loadData} 
                style={{marginRight: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Reintentar
              </button>
              <button 
                onClick={() => window.location.href = '/login'} 
                style={{padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Ir a Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderEstudiantes = () => (
    <div className="tab-content">
      <h2>Gestión de Estudiantes</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>DNI</th>
              <th>Fecha de Registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map(estudiante => (
              <tr key={estudiante.id}>
                <td>{estudiante.nombres} {estudiante.apellidos}</td>
                <td>{estudiante.email}</td>
                <td>{estudiante.dni}</td>
                <td>{new Date(estudiante.date_joined).toLocaleDateString()}</td>
                <td>
                  <span className={`status ${estudiante.is_active ? 'active' : 'inactive'}`}>
                    {estudiante.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInscripciones = () => (
    <div className="tab-content">
      <h2>Gestión de Inscripciones y Pagos</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Curso</th>
              <th>Método de Pago</th>
              <th>Estado de Pago</th>
              <th>Fecha de Inscripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map(inscripcion => (
              <tr key={inscripcion.id}>
                <td>
                  {inscripcion.usuario_info ? 
                    `${inscripcion.usuario_info.nombres} ${inscripcion.usuario_info.apellidos}` : 
                    'Usuario no encontrado'
                  }
                </td>
                <td>
                  {inscripcion.curso_info ? 
                    inscripcion.curso_info.nombre : 
                    'Curso no encontrado'
                  }
                </td>
                <td>{inscripcion.metodo_pago}</td>
                <td>
                  <select 
                    value={inscripcion.estado_pago} 
                    onChange={(e) => actualizarEstadoPago(inscripcion.id, e.target.value)}
                    className={`status-select ${inscripcion.estado_pago}`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="verificado">Verificado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </td>
                <td>{new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        const fechaInicio = prompt('Fecha de inicio (YYYY-MM-DD):', inscripcion.fecha_inicio || '');
                        const fechaExamenTeorico = prompt('Fecha examen teórico (YYYY-MM-DD):', inscripcion.fecha_examen_teorico || '');
                        const fechaExamenPractico = prompt('Fecha examen práctico (YYYY-MM-DD):', inscripcion.fecha_examen_practico || '');
                        
                        if (fechaInicio || fechaExamenTeorico || fechaExamenPractico) {
                          const fechas = {};
                          if (fechaInicio) fechas.fecha_inicio = fechaInicio;
                          if (fechaExamenTeorico) fechas.fecha_examen_teorico = fechaExamenTeorico;
                          if (fechaExamenPractico) fechas.fecha_examen_practico = fechaExamenPractico;
                          
                          actualizarFechasInscripcion(inscripcion.id, fechas);
                        }
                      }}
                    >
                      Editar Fechas
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCursos = () => (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestión de Cursos</h2>
        <button 
          onClick={() => setMostrarFormularioCurso(!mostrarFormularioCurso)}
          className="btn-agregar-curso"
        >
          {mostrarFormularioCurso ? 'Cancelar' : '+ Agregar Nuevo Curso'}
        </button>
      </div>

      {/* Formulario para crear nuevo curso */}
      {mostrarFormularioCurso && (
        <div className="form-crear-curso">
          <h3>Crear Nuevo Curso</h3>
          <form onSubmit={handleCrearCurso}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre del Curso *</label>
                <input
                  type="text"
                  value={nuevoCurso.nombre}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  required
                  placeholder="Ej: Curso de Soldadura Básica"
                />
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <input
                  type="text"
                  value={nuevoCurso.instructor}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, instructor: e.target.value })}
                  placeholder="Nombre del instructor"
                />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  value={nuevoCurso.ubicacion}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, ubicacion: e.target.value })}
                  placeholder="Ej: Aula 201, Centro de Capacitación"
                />
              </div>
              <div className="form-group">
                <label>Horario</label>
                <input
                  type="text"
                  value={nuevoCurso.horario}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, horario: e.target.value })}
                  placeholder="Ej: Lunes a Viernes 9:00-17:00"
                />
              </div>
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCurso.precio}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })}
                  required
                  placeholder="Ej: 1500"
                />
              </div>
              <div className="form-group">
                <label>Duración (semanas)</label>
                <input
                  type="number"
                  value={nuevoCurso.duracion_semanas}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, duracion_semanas: e.target.value })}
                  placeholder="Ej: 12"
                />
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <select
                  value={nuevoCurso.nivel}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nivel: e.target.value })}
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={nuevoCurso.activo}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, activo: e.target.value === 'true' })}
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                value={nuevoCurso.descripcion}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                required
                rows="3"
                placeholder="Descripción detallada del curso..."
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-crear">
                Crear Curso
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormularioCurso(false)}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre del Curso</th>
              <th>Instructor</th>
              <th>Ubicación</th>
              <th>Horario</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map(curso => (
              <tr key={curso.id}>
                <td>{curso.nombre}</td>
                <td>
                  <input 
                    type="text" 
                    value={curso.instructor || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    className="inline-edit"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.ubicacion || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    className="inline-edit"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.horario || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    className="inline-edit"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={curso.precio || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value))}
                    onBlur={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value))}
                    className="inline-edit"
                  />
                </td>
                <td>
                  <select 
                    value={curso.activo} 
                    onChange={(e) => actualizarCurso(curso.id, 'activo', e.target.value === 'true')}
                    className="status-select"
                  >
                    <option value={true}>Activo</option>
                    <option value={false}>Inactivo</option>
                  </select>
                </td>
                <td>
                  <button 
                    className="btn-view"
                    onClick={() => alert(`Detalles del curso:\n\nDescripción: ${curso.descripcion}\nDuración: ${curso.duracion_semanas} semanas\nNivel: ${curso.nivel}`)}
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="logo-section">
          <img src="/logo-certifikt.png" alt="CertifiKT" className="admin-logo" />
          <h1>Panel de Administración</h1>
        </div>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'estudiantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('estudiantes')}
        >
          Estudiantes
        </button>
        <button 
          className={`tab-button ${activeTab === 'inscripciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('inscripciones')}
        >
          Inscripciones y Pagos
        </button>
        <button 
          className={`tab-button ${activeTab === 'cursos' ? 'active' : ''}`}
          onClick={() => setActiveTab('cursos')}
        >
          Gestión de Cursos
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'estudiantes' && renderEstudiantes()}
        {activeTab === 'inscripciones' && renderInscripciones()}
        {activeTab === 'cursos' && renderCursos()}
      </div>
    </div>
  );
}

export default AdminPanel;
