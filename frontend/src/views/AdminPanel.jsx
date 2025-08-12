import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

function AdminPanel() {
  const { logout, user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [subActiveTab, setSubActiveTab] = useState('examenes');
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [intentosExamen, setIntentosExamen] = useState([]);
  const [examenesPracticosPendientes, setExamenesPracticosPendientes] = useState([]);
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

      // Cargar exámenes
      const examenesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/examenes/`);
      if (examenesResponse.ok) {
        const examenesData = await examenesResponse.json();
        setExamenes(examenesData);
      }

      // Cargar preguntas
      const preguntasResponse = await fetchWithAuth(`${API_BASE_URL}/admin/preguntas/`);
      if (preguntasResponse.ok) {
        const preguntasData = await preguntasResponse.json();
        setPreguntas(preguntasData);
      }

      // Cargar intentos de examen
      const intentosResponse = await fetchWithAuth(`${API_BASE_URL}/admin/intentos-examen/`);
      if (intentosResponse.ok) {
        const intentosData = await intentosResponse.json();
        setIntentosExamen(intentosData);
      }

      // Cargar exámenes prácticos pendientes
      const practicosPendientesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/examenes-practicos/pendientes/`);
      if (practicosPendientesResponse.ok) {
        const practicosPendientesData = await practicosPendientesResponse.json();
        setExamenesPracticosPendientes(practicosPendientesData);
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
      // Validar que el valor no esté vacío para campos requeridos
      if (['nombre', 'precio'].includes(campo) && (!valor || valor.toString().trim() === '')) {
        alert(`El campo ${campo} no puede estar vacío`);
        loadData(); // Recargar para restaurar el valor original
        return;
      }

      // Actualizar localmente primero para mejor UX
      setCursos(prevCursos => 
        prevCursos.map(curso => 
          curso.id === cursoId 
            ? { ...curso, [campo]: valor }
            : curso
        )
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/${cursoId}/`, {
        method: 'PATCH', // Usar PATCH en lugar de PUT para actualizaciones parciales
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        console.log(`✅ Curso actualizado: ${campo} = ${valor}`);
        // Mostrar notificación sutil
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          z-index: 1000;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = `✅ ${campo} actualizado correctamente`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar curso:', errorData);
        setError(`Error al actualizar ${campo}: ${errorData.detail || 'Error desconocido'}`);
        loadData(); // Recargar para restaurar el valor original
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error de conexión al actualizar ${campo}`);
      loadData(); // Recargar para restaurar el valor original
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

  // Función para actualizar exámenes
  const actualizarExamen = async (examenId, campo, valor) => {
    try {
      // Actualizar localmente primero
      setExamenes(prevExamenes => 
        prevExamenes.map(examen => 
          examen.id === examenId 
            ? { ...examen, [campo]: valor }
            : examen
        )
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examenes/${examenId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        console.log(`✅ Examen actualizado: ${campo} = ${valor}`);
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          z-index: 1000;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = `✅ ${campo} del examen actualizado`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      } else {
        console.error('Error al actualizar examen');
        loadData(); // Recargar para restaurar
      }
    } catch (error) {
      console.error('Error:', error);
      loadData();
    }
  };

  // Función para actualizar preguntas
  const actualizarPregunta = async (preguntaId, campo, valor) => {
    try {
      // Actualizar localmente primero
      setPreguntas(prevPreguntas => 
        prevPreguntas.map(pregunta => 
          pregunta.id === preguntaId 
            ? { ...pregunta, [campo]: valor }
            : pregunta
        )
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/admin/preguntas/${preguntaId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        console.log(`✅ Pregunta actualizada: ${campo} = ${valor}`);
      } else {
        console.error('Error al actualizar pregunta');
        loadData();
      }
    } catch (error) {
      console.error('Error:', error);
      loadData();
    }
  };

  // Función para eliminar pregunta
  const eliminarPregunta = async (preguntaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/preguntas/${preguntaId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPreguntas(prevPreguntas => prevPreguntas.filter(p => p.id !== preguntaId));
        alert('Pregunta eliminada correctamente');
      } else {
        alert('Error al eliminar la pregunta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la pregunta');
    }
  };

  // Función para ver resultados del examen
  const verResultadosExamen = (examenId) => {
    // Buscar el examen en la estructura de cursos
    let examenEncontrado = null;
    let cursoNombre = '';
    
    for (const curso of examenes) {
      const examen = curso.examenes.find(e => e.id === examenId);
      if (examen) {
        examenEncontrado = examen;
        cursoNombre = curso.nombre;
        break;
      }
    }
    
    if (!examenEncontrado) {
      alert('Examen no encontrado');
      return;
    }

    const promedioCalificacion = examenEncontrado.intentos_completados > 0 
      ? 'Información detallada disponible en la pestaña "Intentos"' 
      : 'Sin intentos completados';

    const porcentajeFinalizacion = examenEncontrado.total_intentos > 0 
      ? ((examenEncontrado.intentos_completados / examenEncontrado.total_intentos) * 100).toFixed(1)
      : '0';

    alert(`📊 Resultados del Examen: ${examenEncontrado.titulo}
📚 Curso: ${cursoNombre}
    
📈 Total de intentos: ${examenEncontrado.total_intentos}
✅ Intentos completados: ${examenEncontrado.intentos_completados}
� Porcentaje de finalización: ${porcentajeFinalizacion}%
� Preguntas configuradas: ${examenEncontrado.numero_preguntas} de ${examenEncontrado.total_preguntas_creadas} disponibles
⏱️ Duración: ${examenEncontrado.duracion_minutos} minutos
🎯 Estado: ${examenEncontrado.activo ? 'Activo' : 'Inactivo'}

💡 Tip: Ve a la pestaña "Intentos" para ver detalles específicos de cada estudiante.`);
  };

  // Función para ver detalle del intento
  const verDetalleIntento = (intentoId) => {
    const intento = intentosExamen.find(i => i.id === intentoId);
    if (!intento) return;

    const duracion = intento.fecha_finalizacion && intento.fecha_inicio
      ? Math.round((new Date(intento.fecha_finalizacion) - new Date(intento.fecha_inicio)) / 60000)
      : 'N/A';

    alert(`📋 Detalle del Intento:

👤 Usuario: ${intento.usuario_nombre}
📝 Examen: ${intento.examen_titulo}
🕐 Inicio: ${new Date(intento.fecha_inicio).toLocaleString()}
🕐 Fin: ${intento.fecha_finalizacion ? new Date(intento.fecha_finalizacion).toLocaleString() : 'En progreso'}
⏱️ Duración: ${duracion} minutos
📊 Puntaje: ${intento.puntaje !== null ? intento.puntaje : 'Pendiente'}
❓ Preguntas: ${intento.preguntas_seleccionadas?.length || 0}
✅ Estado: ${intento.estado === 'completado' ? 'Completado' : 'En progreso'}`);
  };

  // Función para actualizar resultado de examen práctico
  const actualizarResultadoPractico = async (intentoId, resultado, observaciones = '', evaluador = '') => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examen-practico/resultado/${intentoId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          resultado_practico: resultado,
          observaciones_practico: observaciones,
          evaluador: evaluador
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar la lista de pendientes removiendo el item actualizado
        setExamenesPracticosPendientes(prev => prev.filter(item => item.id !== intentoId));
        
        // Actualizar la lista de exámenes para remover el intento evaluado
        setExamenes(prev => prev.map(curso => ({
          ...curso,
          examenes: curso.examenes.map(examen => ({
            ...examen,
            examenes_practicos_pendientes: examen.examenes_practicos_pendientes?.filter(
              intento => intento.id !== intentoId
            ) || []
          }))
        })));
        
        alert(`✅ Resultado actualizado: ${resultado.toUpperCase()}`);
      } else {
        console.error('Error al actualizar resultado práctico');
        alert('Error al actualizar el resultado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el resultado');
    }
  };

  // Función para manejar la evaluación práctica
  const evaluarExamenPractico = (intentoId, resultado) => {
    const evaluador = prompt(`Ingresa tu nombre como evaluador:`);
    if (!evaluador) return;

    const observaciones = prompt('Observaciones adicionales (opcional):') || '';
    
    actualizarResultadoPractico(intentoId, resultado, observaciones, evaluador);
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
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {mostrarFormularioCurso ? 'Cancelar' : '+ Agregar Nuevo Curso'}
        </button>
      </div>

      {/* Formulario para crear nuevo curso */}
      {mostrarFormularioCurso && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3>Crear Nuevo Curso</h3>
          <form onSubmit={handleCrearCurso}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre del Curso *</label>
                <input
                  type="text"
                  value={nuevoCurso.nombre}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Curso de Soldadura Básica"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Instructor</label>
                <input
                  type="text"
                  value={nuevoCurso.instructor}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, instructor: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Nombre del instructor"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ubicación</label>
                <input
                  type="text"
                  value={nuevoCurso.ubicacion}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, ubicacion: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Aula 201, Centro de Capacitación"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Horario</label>
                <input
                  type="text"
                  value={nuevoCurso.horario}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, horario: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Lunes a Viernes 9:00-17:00"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCurso.precio}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: 1500"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duración (semanas)</label>
                <input
                  type="number"
                  value={nuevoCurso.duracion_semanas}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, duracion_semanas: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: 12"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nivel</label>
                <select
                  value={nuevoCurso.nivel}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nivel: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Estado</label>
                <select
                  value={nuevoCurso.activo}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, activo: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción *</label>
              <textarea
                value={nuevoCurso.descripcion}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                required
                rows="3"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
                placeholder="Descripción detallada del curso..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Crear Curso
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormularioCurso(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
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
                <td>
                  <input 
                    type="text" 
                    value={curso.nombre || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'nombre', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'nombre', e.target.value)}
                    className="inline-edit"
                    style={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.instructor || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    className="inline-edit"
                    placeholder="Nombre del instructor"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.ubicacion || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    className="inline-edit"
                    placeholder="Ubicación del curso"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.horario || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    className="inline-edit"
                    placeholder="Ej: Lun-Vie 9:00-17:00"
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '5px', color: '#666' }}>$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={curso.precio || ''} 
                      onChange={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value) || 0)}
                      onBlur={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value) || 0)}
                      className="inline-edit"
                      placeholder="0.00"
                      style={{ textAlign: 'right' }}
                    />
                  </div>
                </td>
                <td>
                  <select 
                    value={curso.activo} 
                    onChange={(e) => actualizarCurso(curso.id, 'activo', e.target.value === 'true')}
                    className="status-select"
                    style={{ 
                      color: curso.activo ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}
                  >
                    <option value={true}>✅ Activo</option>
                    <option value={false}>❌ Inactivo</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-view"
                      onClick={() => alert(`📋 Detalles del curso:\n\n📝 Descripción: ${curso.descripcion || 'Sin descripción'}\n⏱️ Duración: ${curso.duracion_semanas || 'No especificada'} semanas\n📊 Nivel: ${curso.nivel || 'No especificado'}\n💰 Precio: $${curso.precio || 0}`)}
                      title="Ver detalles completos"
                    >
                      👁️ Ver
                    </button>
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        const nuevaDescripcion = prompt(`Editar descripción del curso "${curso.nombre}":`, curso.descripcion || '');
                        if (nuevaDescripcion !== null) {
                          actualizarCurso(curso.id, 'descripcion', nuevaDescripcion);
                        }
                      }}
                      title="Editar descripción"
                    >
                      ✏️ Desc
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

  const renderExamenes = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Gestión de Exámenes</h2>
      
      {/* Estadísticas de exámenes */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>� Cursos con Exámenes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{examenes.length}</p>
        </div>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>📝 Total Exámenes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {examenes.reduce((total, curso) => total + curso.total_examenes, 0)}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>� Estudiantes Inscritos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {examenes.reduce((total, curso) => total + curso.estudiantes_inscritos, 0)}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>📊 Total Intentos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {examenes.reduce((total, curso) => 
              total + curso.examenes.reduce((subTotal, examen) => subTotal + examen.total_intentos, 0), 0
            )}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff6b35' }}>🎯 Prácticos Pendientes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{examenesPracticosPendientes.length}</p>
        </div>
      </div>

      {/* Tabs para examenes */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setSubActiveTab('examenes')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: subActiveTab === 'examenes' ? '#007bff' : '#f8f9fa',
            color: subActiveTab === 'examenes' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📝 Exámenes
        </button>
        <button
          onClick={() => setSubActiveTab('preguntas')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: subActiveTab === 'preguntas' ? '#007bff' : '#f8f9fa',
            color: subActiveTab === 'preguntas' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ❓ Preguntas
        </button>
      </div>

      {/* Contenido según sub-tab */}
      {subActiveTab === 'examenes' && (
        <div>
          {examenes.map(curso => (
            <div key={curso.id} style={{ 
              marginBottom: '30px', 
              border: '1px solid #dee2e6', 
              borderRadius: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              {/* Header del curso */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>📚 {curso.nombre}</h3>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                    👨‍🏫 {curso.instructor} • 👥 {curso.estudiantes_inscritos} estudiantes inscritos
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{curso.total_examenes}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Exámenes</div>
                </div>
              </div>

              {/* Lista de exámenes del curso */}
              {curso.examenes.length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#6c757d' 
                }}>
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    📝 No hay exámenes creados para este curso
                  </p>
                  <button
                    style={{
                      marginTop: '15px',
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                    onClick={() => alert('Funcionalidad para crear examen próximamente')}
                  >
                    ➕ Crear primer examen
                  </button>
                </div>
              ) : (
                <div className="table-container" style={{ padding: '0' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e9ecef' }}>
                        <th>Título del Examen</th>
                        <th>Tipo</th>
                        <th>Duración</th>
                        <th>Preguntas</th>
                        <th>Intentos</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curso.examenes.map(examen => (
                        <tr key={examen.id}>
                          <td>
                            <div>
                              <input 
                                type="text" 
                                value={examen.titulo || ''} 
                                onChange={(e) => actualizarExamen(examen.id, 'titulo', e.target.value)}
                                className="inline-edit"
                                style={{ fontWeight: 'bold', fontSize: '14px' }}
                              />
                              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                {examen.descripcion ? examen.descripcion.substring(0, 50) + '...' : 'Sin descripción'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: examen.tipo === 'teorico' ? '#d1ecf1' : '#d4edda',
                              color: examen.tipo === 'teorico' ? '#0c5460' : '#155724'
                            }}>
                              {examen.tipo === 'teorico' ? '📖 Teórico' : '🔧 Práctico'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              value={examen.duracion_minutos || ''} 
                              onChange={(e) => actualizarExamen(examen.id, 'duracion_minutos', parseInt(e.target.value) || 0)}
                              className="inline-edit"
                              style={{ textAlign: 'center', width: '70px' }}
                            />
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>min</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <input 
                                type="number" 
                                value={examen.numero_preguntas || ''} 
                                onChange={(e) => actualizarExamen(examen.id, 'numero_preguntas', parseInt(e.target.value) || 0)}
                                className="inline-edit"
                                style={{ textAlign: 'center', width: '60px', marginBottom: '2px' }}
                              />
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                de {examen.total_preguntas_creadas} total
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              {examen.intentos_completados}/{examen.total_intentos}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>
                              completados
                            </div>
                          </td>
                          <td>
                            <select 
                              value={examen.activo} 
                              onChange={(e) => actualizarExamen(examen.id, 'activo', e.target.value === 'true')}
                              className="status-select"
                              style={{ 
                                color: examen.activo ? '#28a745' : '#dc3545',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                            >
                              <option value={true}>✅ Activo</option>
                              <option value={false}>❌ Inactivo</option>
                            </select>
                          </td>
                          <td>
                            {examen.tipo === 'practico' ? (
                              // Para exámenes prácticos: mostrar evaluación presencial
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {examen.examenes_practicos_pendientes && examen.examenes_practicos_pendientes.length > 0 ? (
                                  examen.examenes_practicos_pendientes.map(intento => (
                                    <div key={intento.id} style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
                                      <button
                                        onClick={() => evaluarExamenPractico(intento.id, 'aprobado')}
                                        style={{
                                          padding: '3px 6px',
                                          fontSize: '10px',
                                          backgroundColor: '#28a745',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '3px',
                                          cursor: 'pointer'
                                        }}
                                        title={`Aprobar a ${intento.usuario_nombre}`}
                                      >
                                        ✅ Aprobar
                                      </button>
                                      <button
                                        onClick={() => evaluarExamenPractico(intento.id, 'desaprobado')}
                                        style={{
                                          padding: '3px 6px',
                                          fontSize: '10px',
                                          backgroundColor: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '3px',
                                          cursor: 'pointer'
                                        }}
                                        title={`Desaprobar a ${intento.usuario_nombre}`}
                                      >
                                        ❌ Desaprobar
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ fontSize: '11px', color: '#6c757d', textAlign: 'center' }}>
                                    Sin evaluaciones pendientes
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Para exámenes teóricos: botones normales
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                <button 
                                  className="btn-view"
                                  onClick={() => verResultadosExamen(examen.id)}
                                  title="Ver resultados"
                                  style={{ fontSize: '11px', padding: '5px 8px' }}
                                >
                                  📊 Resultados
                                </button>
                                <button 
                                  className="btn-edit"
                                  onClick={() => {
                                    const nuevaDescripcion = prompt(`Editar descripción del examen "${examen.titulo}":`, examen.descripcion || '');
                                    if (nuevaDescripcion !== null) {
                                      actualizarExamen(examen.id, 'descripcion', nuevaDescripcion);
                                    }
                                  }}
                                  title="Editar descripción"
                                  style={{ fontSize: '11px', padding: '5px 8px' }}
                                >
                                  ✏️ Editar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          
          {examenes.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              color: '#6c757d' 
            }}>
              <h3>📚 No hay cursos disponibles</h3>
              <p>Primero crea cursos en la pestaña "Gestión de Cursos" para poder agregar exámenes.</p>
            </div>
          )}
        </div>
      )}

      {subActiveTab === 'preguntas' && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Examen</th>
                <th>Pregunta</th>
                <th>Opción A</th>
                <th>Opción B</th>
                <th>Opción C</th>
                <th>Opción D</th>
                <th>Respuesta Correcta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {preguntas.map(pregunta => (
                <tr key={pregunta.id}>
                  <td>{pregunta.examen_titulo || 'Sin examen'}</td>
                  <td>
                    <textarea 
                      value={pregunta.texto || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                      className="inline-edit"
                      style={{ minHeight: '60px', resize: 'vertical' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={pregunta.opcion_a || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'opcion_a', e.target.value)}
                      className="inline-edit"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={pregunta.opcion_b || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'opcion_b', e.target.value)}
                      className="inline-edit"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={pregunta.opcion_c || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'opcion_c', e.target.value)}
                      className="inline-edit"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={pregunta.opcion_d || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'opcion_d', e.target.value)}
                      className="inline-edit"
                    />
                  </td>
                  <td>
                    <select 
                      value={pregunta.respuesta_correcta || 'A'} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'respuesta_correcta', e.target.value)}
                      className="inline-edit"
                      style={{ 
                        color: '#28a745',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => eliminarPregunta(pregunta.id)}
                      title="Eliminar pregunta"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subActiveTab === 'intentos' && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Fecha Inicio</th>
                <th>Fecha Finalización</th>
                <th>Puntaje</th>
                <th>Porcentaje</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {intentosExamen.map(intento => (
                <tr key={intento.id}>
                  <td>{intento.usuario_nombre || 'Usuario desconocido'}</td>
                  <td>{intento.examen_titulo || 'Examen desconocido'}</td>
                  <td>{new Date(intento.fecha_inicio).toLocaleString()}</td>
                  <td>{intento.fecha_finalizacion ? new Date(intento.fecha_finalizacion).toLocaleString() : 'En progreso'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {intento.puntaje !== null ? intento.puntaje : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {intento.puntaje !== null ? `${Math.round((intento.puntaje / (intento.preguntas_seleccionadas?.length || 1)) * 100)}%` : '-'}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: intento.estado === 'completado' ? '#d4edda' : '#fff3cd',
                      color: intento.estado === 'completado' ? '#155724' : '#856404'
                    }}>
                      {intento.estado === 'completado' ? '✅ Completado' : '⏳ En progreso'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view"
                      onClick={() => verDetalleIntento(intento.id)}
                      title="Ver detalle"
                    >
                      👁️ Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
        <button 
          className={`tab-button ${activeTab === 'examenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('examenes')}
        >
          Exámenes
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'estudiantes' && renderEstudiantes()}
        {activeTab === 'inscripciones' && renderInscripciones()}
        {activeTab === 'cursos' && renderCursos()}
        {activeTab === 'examenes' && renderExamenes()}
      </div>
    </div>
  );
}

export default AdminPanel;
