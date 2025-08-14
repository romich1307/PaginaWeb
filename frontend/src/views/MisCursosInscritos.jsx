import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ExamenComponent from '../components/ExamenComponent';
import './MisCursosInscritos.css';

function MisCursosInscritos() {
  const { user } = useAuth();
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaExamen, setVistaExamen] = useState(null); // {cursoId, curso}

  const API_BASE_URL = 'http://localhost:8000/api';

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    const cargarInscripciones = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Obtener mis inscripciones usando el endpoint específico para usuarios
        const response = await fetchWithAuth(`${API_BASE_URL}/mis-inscripciones/`);
        
        if (response.ok) {
          const inscripciones = await response.json();
          console.log('Mis inscripciones obtenidas:', inscripciones);
          setCursosInscritos(inscripciones);
        } else {
          console.error('Error al cargar inscripciones:', response.status);
          const errorText = await response.text();
          console.error('Detalle del error:', errorText);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarInscripciones();
  }, [user]);

  const abrirExamenes = (cursoId, curso) => {
    setVistaExamen({ cursoId, curso });
  };

  const volverACursos = () => {
    setVistaExamen(null);
  };

  // Si estamos en vista de examen, mostrar el componente de exámenes
  if (vistaExamen) {
    return (
      <ExamenComponent 
        cursoId={vistaExamen.cursoId}
        curso={vistaExamen.curso}
        onVolver={volverACursos}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando tus cursos...</p>
      </div>
    );
  }

  if (cursosInscritos.length === 0) {
    return (
      <div className="cursos-inscritos-container">
        <div className="cursos-header">
          <h1>Mis Cursos</h1>
          <p>Aquí aparecerán los cursos en los que te has inscrito</p>
        </div>
        
        <div className="no-cursos">
          <div className="no-cursos-icon">📚</div>
          <h2>No tienes cursos inscritos</h2>
          <p>Una vez que realices el pago y sea verificado, tus cursos aparecerán aquí.</p>
          <a href="/mis-cursos" className="explorar-btn">
            Explorar Cursos Disponibles
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cursos-inscritos-container">
      <div className="cursos-header">
        <h1>Mis Cursos</h1>
        <p>Bienvenido, {user?.first_name || user?.nombre || 'Estudiante'}</p>
      </div>

      <div className="cursos-inscritos-grid">
        {cursosInscritos.map(inscripcion => (
          <div key={inscripcion.id} className="curso-inscrito-card">
            <div className="curso-imagen">
              <img 
                src={inscripcion.curso_info?.imagen || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop"} 
                alt={inscripcion.curso_info?.nombre || 'Curso'} 
              />
              <div className="progreso-overlay">
                <div className="progreso-circle">
                  <span>{inscripcion.progreso || 0}%</span>
                </div>
              </div>
              <div className={`estado-badge ${inscripcion.estado_pago}`}>
                {inscripcion.estado_pago === 'pagado' ? 'Pagado' : 
                 inscripcion.estado_pago === 'pendiente' ? 'Pendiente' : 'Rechazado'}
              </div>
            </div>
            
            <div className="curso-contenido">
              <h3>{inscripcion.curso_info?.nombre || 'Curso sin nombre'}</h3>
              
              <div className="curso-detalles">
                <div className="detalle-item">
                  <span className="icono">📅</span>
                  <div>
                    <strong>Inicio:</strong>
                    <p>{inscripcion.fecha_inicio || 'Por definir'}</p>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="icono">🕐</span>
                  <div>
                    <strong>Horario:</strong>
                    <p>{inscripcion.curso_info?.horario || 'Por definir'}</p>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="icono">📍</span>
                  <div>
                    <strong>Ubicación:</strong>
                    <p>{inscripcion.curso_info?.ubicacion || 'Por definir'}</p>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="icono">👨‍🏫</span>
                  <div>
                    <strong>Instructor:</strong>
                    <p>{inscripcion.curso_info?.instructor || 'Por asignar'}</p>
                  </div>
                </div>
              </div>

              <div className="examenes-info">
                <h4>Próximos Exámenes</h4>
                <div className="examen-item">
                  <span className="examen-tipo">💻 Teórico</span>
                  <span className="examen-fecha">{inscripcion.fecha_examen_teorico || 'Por definir'}</span>
                </div>
                <div className="examen-item">
                  <span className="examen-tipo">🛠️ Práctico</span>
                  <span className="examen-fecha">{inscripcion.fecha_examen_practico || 'Por definir'}</span>
                </div>
              </div>

              <div className="progreso-detalle">
                <div className="progreso-header">
                  <span>Progreso del Curso</span>
                  <span>{inscripcion.progreso || 0}%</span>
                </div>
                <div className="progreso-bar">
                  <div 
                    className="progreso-fill" 
                    style={{ width: `${inscripcion.progreso || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="curso-acciones">
                <button 
                  className="btn-examenes"
                  onClick={() => abrirExamenes(inscripcion.curso, inscripcion.curso_info)}
                >
                  Exámenes
                </button>
                <button className="btn-acceder">
                  Acceder al Curso
                </button>
                <button className="btn-materiales">
                  Materiales
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="explorar-mas">
        <h3>¿Interesado en más cursos?</h3>
        <p>Explora nuestra amplia variedad de cursos disponibles</p>
        <a href="/mis-cursos" className="explorar-btn">
          Ver Todos los Cursos
        </a>
      </div>
    </div>
  );
}

export default MisCursosInscritos;
