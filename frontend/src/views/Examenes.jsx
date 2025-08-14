import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ExamenComponent from '../components/ExamenComponent';
import './Examenes.css';

function Examenes() {
  const { user } = useAuth();
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [examenesProgramados, setExamenesProgramados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaExamen, setVistaExamen] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api';

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
    cargarCursosConExamenes();
    cargarExamenesProgramados();
  }, [user]);

  const cargarExamenesProgramados = async () => {
    if (!user) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/mis-examenes-programados/`);
      
      if (response.ok) {
        const examenes = await response.json();
        setExamenesProgramados(examenes);
      } else {
        console.error('Error al cargar exámenes programados');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarCursosConExamenes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/mis-inscripciones/`);
      
      if (response.ok) {
        const inscripciones = await response.json();
        
        // Filtrar solo cursos con pago verificado
        const cursosVerificados = inscripciones.filter(
          inscripcion => inscripcion.estado_pago === 'verificado'
        );
        
        setCursosInscritos(cursosVerificados);
      } else {
        console.error('Error al cargar cursos');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirExamenes = (cursoId, curso) => {
    setVistaExamen({ cursoId, curso });
  };

  const volverAExamenes = () => {
    setVistaExamen(null);
  };

  // Si estamos en vista de examen específico, mostrar el componente de exámenes
  if (vistaExamen) {
    return (
      <ExamenComponent 
        cursoId={vistaExamen.cursoId}
        curso={vistaExamen.curso}
        onVolver={volverAExamenes}
      />
    );
  }

  if (loading) {
    return (
      <div className="examenes-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tus exámenes disponibles...</p>
      </div>
    );
  }

  return (
    <div className="examenes-page">
      <div className="examenes-page-header">
        <h1>Centro de Exámenes</h1>
        <p>Accede a todos los exámenes de tus cursos inscritos</p>
      </div>

      {/* Sección de Exámenes Programados */}
      {examenesProgramados.length > 0 && (
        <div className="examenes-programados-section">
          <h2>🗓️ Tus Exámenes Programados</h2>
          <div className="examenes-programados-grid">
            {examenesProgramados
              .filter(examen => examen.fecha_programada_practica || examen.tipo === 'teorico')
              .map(examen => (
                <div key={examen.id} className="examen-programado-card">
                  <div className="examen-programado-header">
                    <h4>{examen.examen_nombre}</h4>
                    <span className={`tipo-badge ${examen.tipo}`}>
                      {examen.tipo === 'practico' ? 'Práctico' : 'Teórico'}
                    </span>
                  </div>
                  
                  <div className="examen-programado-info">
                    <p><strong>Curso:</strong> {examen.curso_nombre}</p>
                    {examen.fecha_programada_practica && (
                      <p><strong>Fecha:</strong> {new Date(examen.fecha_programada_practica).toLocaleDateString('es-ES')}</p>
                    )}
                    {examen.hora_programada_practica && (
                      <p><strong>Hora:</strong> {examen.hora_programada_practica}</p>
                    )}
                    {examen.duracion_programada && (
                      <p><strong>Duración:</strong> {examen.duracion_programada} minutos</p>
                    )}
                    
                    <div className="examen-estado">
                      {examen.estado === 'completado' ? (
                        <span className="estado-completado">
                          ✅ Completado {examen.aprobado ? '(Aprobado)' : '(No Aprobado)'}
                        </span>
                      ) : examen.resultado_practico === 'pendiente' ? (
                        <span className="estado-pendiente">
                          ⏳ Pendiente de Evaluación
                        </span>
                      ) : (
                        <span className="estado-programado">
                          📅 Programado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {cursosInscritos.length === 0 ? (
        <div className="no-cursos-examenes">
          <div className="no-cursos-icon">
            <span className="icon-placeholder">Biblioteca</span>
          </div>
          <h3>No tienes cursos disponibles para exámenes</h3>
          <p>Para acceder a los exámenes, primero debes:</p>
          <ul>
            <li>Inscribirte en un curso</li>
            <li>Completar el pago</li>
            <li>Esperar la verificación del pago</li>
          </ul>
          <a href="/mis-cursos" className="btn-explorar-cursos">
            Explorar Cursos Disponibles
          </a>
        </div>
      ) : (
        <div className="cursos-examenes-grid">
          {cursosInscritos.map(inscripcion => (
            <div key={inscripcion.id} className="curso-examen-card">
              <div className="curso-examen-header">
                <img 
                  src={inscripcion.curso_info?.imagen || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop"} 
                  alt={inscripcion.curso_info?.nombre || 'Curso'} 
                  className="curso-examen-imagen"
                />
                <div className="curso-examen-overlay">
                  <h3>{inscripcion.curso_info?.nombre}</h3>
                  <p>{inscripcion.curso_info?.categoria}</p>
                </div>
              </div>

              <div className="curso-examen-body">
                <div className="curso-examen-info">
                  <div className="info-item">
                    <span className="info-icon">Duración:</span>
                    <span>{inscripcion.curso_info?.duracion_horas} horas</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">Ubicación:</span>
                    <span>{inscripcion.curso_info?.ubicacion || 'Virtual'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">Instructor:</span>
                    <span>{inscripcion.curso_info?.instructor || 'Por asignar'}</span>
                  </div>
                </div>

                <div className="examenes-preview">
                  <h4>Exámenes Disponibles:</h4>
                  <div className="examenes-tipos">
                    <div className="examen-tipo-item">
                      <span className="tipo-icon">Teórico</span>
                      <span>Examen Teórico</span>
                      <span className="tipo-badge teorico">Online</span>
                    </div>
                    <div className="examen-tipo-item">
                      <span className="tipo-icon">Práctico</span>
                      <span>Examen Práctico</span>
                      <span className="tipo-badge practico">Presencial</span>
                    </div>
                  </div>
                </div>

                <div className="estado-progreso">
                  <div className="progreso-label">Estado del Curso:</div>
                  <div className="estado-badge activo">
                    Inscrito y Verificado
                  </div>
                </div>
              </div>

              <div className="curso-examen-footer">
                <button 
                  className="btn-acceder-examenes"
                  onClick={() => abrirExamenes(inscripcion.curso, inscripcion.curso_info)}
                >
                  <span className="btn-icon">Exámenes</span>
                  <span>Acceder a Exámenes</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="examenes-info-section">
        <h3>Información sobre Exámenes</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-card-icon">Teórico</div>
            <h4>Exámenes Teóricos</h4>
            <p>Se realizan completamente online con preguntas de opción múltiple. Tienes un tiempo límite para completarlos.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">Práctico</div>
            <h4>Exámenes Prácticos</h4>
            <p>Deben rendirse presencialmente en nuestras instalaciones con evaluación directa de habilidades prácticas.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">Certificado</div>
            <h4>Certificación</h4>
            <p>Al aprobar ambos exámenes, recibirás tu certificado oficial del curso completado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Examenes;
