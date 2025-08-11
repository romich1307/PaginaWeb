import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:8000/api';

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Verificar si es admin
      const adminResponse = await fetchWithAuth(`${API_BASE_URL}/admin/is-admin/`);
      const adminData = await adminResponse.json();
      
      if (!adminData.is_admin) {
        setError('No tienes permisos de administrador');
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
      <h2>Gestión de Cursos</h2>
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
