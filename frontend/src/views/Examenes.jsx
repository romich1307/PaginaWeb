import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ExamenComponent from '../components/ExamenComponent';
import './Examenes.css';

function Examenes() {
  const { user } = useAuth();
  const [cursosInscritos, setCursosInscritos] = useState([]);
  // Mapear fechas por cursoId para mostrar en exámenes programados
  const [fechasPorCurso, setFechasPorCurso] = useState({});
  const [examenesProgramados, setExamenesProgramados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaExamen, setVistaExamen] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

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
        // Guardar fechas por cursoId para mostrar en exámenes programados
        const fechas = {};
        cursosVerificados.forEach(insc => {
          fechas[insc.curso] = {
            teorico: insc.fecha_examen_teorico,
            practico: insc.fecha_examen_practico
          };
        });
        setFechasPorCurso(fechas);
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
          <h2>Tus Exámenes Programados</h2>
          <div className="examenes-programados-grid">
            {/* Mostrar solo un examen teórico por curso y todos los prácticos */}
            {(() => {
              const teoricosPorCurso = new Set();
              return examenesProgramados
                .filter(examen => {
                  if (examen.tipo === 'teorico') {
                    if (teoricosPorCurso.has(examen.curso_nombre)) return false;
                    teoricosPorCurso.add(examen.curso_nombre);
                    return true;
                  }
                  // Mostrar todos los prácticos
                  return examen.tipo === 'practico';
                })
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
                      {/* Mostrar la fecha que pone el admin en la inscripción, siempre igual que MisCursosInscritos.jsx */}
                      {examen.tipo === 'teorico' && examen.fecha_examen_teorico && (
                        <p><strong>Fecha:</strong> {examen.fecha_examen_teorico}</p>
                      )}
                      {examen.tipo === 'practico' && examen.fecha_examen_practico && (
                        <p><strong>Fecha:</strong> {examen.fecha_examen_practico}</p>
                      )}
                      {/* Si no hay fecha definida por el admin, mostrar la programada */}
                      {((examen.tipo === 'teorico' && !examen.fecha_examen_teorico) || (examen.tipo === 'practico' && !examen.fecha_examen_practico)) && examen.fecha_programada_practica && (
                        <p><strong>Fecha:</strong> {new Date(examen.fecha_programada_practica).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                      )}
                      {examen.hora_programada_practica && (
                        <p><strong>Hora:</strong> {examen.hora_programada_practica}</p>
                      )}
                      {examen.duracion_programada && (
                        <p><strong>Duración:</strong> {examen.duracion_programada} minutos</p>
                      )}
                      <div className="examen-estado">
                        {/* Mostrar estado de aprobación del admin para examen práctico */}
                        {examen.tipo === 'practico' && typeof examen.aceptado_admin !== 'undefined' ? (
                          examen.aceptado_admin === true ? (
                            <span className="estado-completado" style={{ color: 'green', fontWeight: 'bold' }}>
                              Aprobado
                            </span>
                          ) : examen.aceptado_admin === false ? (
                            <span className="estado-pendiente" style={{ color: 'red', fontWeight: 'bold' }}>
                              Desaprobado
                            </span>
                          ) : (
                            <span className="estado-pendiente" style={{ color: 'orange', fontWeight: 'bold' }}>
                              Pendiente de Evaluación
                            </span>
                          )
                        ) : (
                          examen.estado === 'completado' ? (
                            <span className="estado-completado">
                              Completado {examen.aprobado ? '(Aprobado)' : '(No Aprobado)'}
                            </span>
                          ) : examen.resultado_practico === 'pendiente' ? (
                            <span className="estado-pendiente">
                              Pendiente de Evaluación
                            </span>
                          ) : (
                            <span className="estado-programado">
                              Programado
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ));
            })()}
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
  ) : null}

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
