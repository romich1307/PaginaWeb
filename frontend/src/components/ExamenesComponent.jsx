import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ExamenesComponent.css';

function ExamenesComponent({ cursoId, cursoNombre }) {
  const { user } = useAuth();
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examenActivo, setExamenActivo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [intentoId, setIntentoId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

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

  // Cargar exámenes disponibles
  const cargarExamenes = async () => {
    if (!cursoId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/cursos/${cursoId}/examenes/`);
      
      if (response.ok) {
        const data = await response.json();
        setExamenes(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar exámenes');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al cargar exámenes');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar examen
  const iniciarExamen = async (examenId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/examenes/${examenId}/iniciar/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntentoId(data.intento_id);
        setTiempoRestante(data.tiempo_limite * 60); // Convertir a segundos
        await cargarPreguntasExamen(data.intento_id);
        setExamenActivo(examenes.find(e => e.id === examenId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al iniciar examen');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al iniciar examen');
    } finally {
      setLoading(false);
    }
  };

  // Cargar preguntas del examen
  const cargarPreguntasExamen = async (intentoId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/intentos/${intentoId}/preguntas/`);
      
      if (response.ok) {
        const data = await response.json();
        setPreguntas(data.preguntas);
        
        // Inicializar respuestas vacías
        const respuestasIniciales = {};
        data.preguntas.forEach(pregunta => {
          respuestasIniciales[pregunta.id] = '';
        });
        setRespuestas(respuestasIniciales);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar preguntas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al cargar preguntas');
    }
  };

  // Enviar respuestas del examen
  const enviarExamen = async () => {
    if (!intentoId) return;
    
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/intentos/${intentoId}/enviar/`, {
        method: 'POST',
        body: JSON.stringify({ respuestas })
      });
      
      if (response.ok) {
        const resultado = await response.json();
        
        alert(`¡Examen completado!
        
Puntaje obtenido: ${resultado.puntaje_obtenido.toFixed(1)}%
Puntaje mínimo: ${resultado.puntaje_minimo}%
Estado: ${resultado.aprobado ? '✅ APROBADO' : '❌ NO APROBADO'}
Respuestas correctas: ${resultado.respuestas_correctas}/${resultado.total_preguntas}
Tiempo utilizado: ${resultado.tiempo_utilizado} minutos`);
        
        // Reiniciar estado
        setExamenActivo(null);
        setPreguntas([]);
        setRespuestas({});
        setIntentoId(null);
        setTiempoRestante(0);
        
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al enviar examen');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al enviar examen');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de respuesta
  const manejarCambioRespuesta = (preguntaId, respuesta) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: respuesta
    }));
  };

  // Timer del examen
  useEffect(() => {
    let timer;
    if (examenActivo && tiempoRestante > 0) {
      timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            // Tiempo agotado, enviar automáticamente
            enviarExamen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examenActivo, tiempoRestante]);

  // Cargar exámenes al montar el componente
  useEffect(() => {
    cargarExamenes();
  }, [cursoId]);

  // Formatear tiempo
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="examenes-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="examenes-error">
        <p>❌ {error}</p>
        <button onClick={cargarExamenes} className="btn-retry">
          🔄 Reintentar
        </button>
      </div>
    );
  }

  // Vista del examen activo
  if (examenActivo) {
    return (
      <div className="examen-activo">
        <div className="examen-header">
          <h2>📝 {examenActivo.nombre}</h2>
          <div className="tiempo-restante">
            ⏰ Tiempo restante: <span className={tiempoRestante < 300 ? 'tiempo-critico' : ''}>{formatearTiempo(tiempoRestante)}</span>
          </div>
        </div>

        <div className="progreso-examen">
          <p>Pregunta 1 de {preguntas.length} | Tipo: {examenActivo.tipo}</p>
          <div className="barra-progreso">
            <div 
              className="progreso-fill" 
              style={{ width: `${(Object.keys(respuestas).filter(k => respuestas[k]).length / preguntas.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="preguntas-container">
          {preguntas.map((pregunta, index) => (
            <div key={pregunta.id} className="pregunta-card">
              <h3>Pregunta {pregunta.numero}</h3>
              <p className="texto-pregunta">{pregunta.texto_pregunta}</p>
              
              {pregunta.imagen_pregunta && (
                <img 
                  src={pregunta.imagen_pregunta} 
                  alt="Imagen de la pregunta" 
                  className="imagen-pregunta"
                />
              )}

              <div className="opciones-respuesta">
                {pregunta.tipo === 'multiple' && (
                  pregunta.opciones.map(opcion => (
                    <label key={opcion.id} className="opcion-radio">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={opcion.id}
                        checked={respuestas[pregunta.id] == opcion.id}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id, e.target.value)}
                      />
                      <span>{opcion.texto_opcion}</span>
                    </label>
                  ))
                )}

                {pregunta.tipo === 'verdadero_falso' && (
                  <div className="verdadero-falso">
                    <label className="opcion-radio">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value="verdadero"
                        checked={respuestas[pregunta.id] === 'verdadero'}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id, e.target.value)}
                      />
                      <span>✅ Verdadero</span>
                    </label>
                    <label className="opcion-radio">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value="falso"
                        checked={respuestas[pregunta.id] === 'falso'}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id, e.target.value)}
                      />
                      <span>❌ Falso</span>
                    </label>
                  </div>
                )}

                {pregunta.tipo === 'texto' && (
                  <textarea
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => manejarCambioRespuesta(pregunta.id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="respuesta-texto"
                    rows="4"
                  />
                )}
              </div>

              <div className="puntaje-pregunta">
                💯 Puntaje: {pregunta.puntaje} puntos
              </div>
            </div>
          ))}
        </div>

        <div className="acciones-examen">
          <button 
            onClick={enviarExamen}
            className="btn-enviar-examen"
            disabled={loading}
          >
            {loading ? '📤 Enviando...' : '📤 Enviar Examen'}
          </button>
          <p className="advertencia">
            ⚠️ Una vez enviado el examen no podrás modificar las respuestas
          </p>
        </div>
      </div>
    );
  }

  // Vista de lista de exámenes
  return (
    <div className="examenes-container">
      <h2>📚 Exámenes de {cursoNombre}</h2>
      
      {examenes.length === 0 ? (
        <div className="no-examenes">
          <p>📋 No hay exámenes disponibles para este curso</p>
        </div>
      ) : (
        <div className="examenes-grid">
          {examenes.map(examen => (
            <div key={examen.id} className="examen-card">
              <div className="examen-header">
                <h3>{examen.nombre}</h3>
                <span className={`examen-tipo ${examen.tipo}`}>
                  {examen.tipo === 'teorico' ? '📖 Teórico' : '🔧 Práctico'}
                </span>
              </div>
              
              <p className="examen-descripcion">{examen.descripcion}</p>
              
              <div className="examen-detalles">
                <div className="detalle">
                  <span className="icono">📝</span>
                  <span>{examen.cantidad_preguntas} preguntas (de {examen.total_preguntas_disponibles} disponibles)</span>
                </div>
                <div className="detalle">
                  <span className="icono">⏱️</span>
                  <span>{examen.tiempo_limite} minutos</span>
                </div>
                <div className="detalle">
                  <span className="icono">🎯</span>
                  <span>Mínimo {examen.puntaje_minimo}% para aprobar</span>
                </div>
              </div>
              
              <button 
                onClick={() => iniciarExamen(examen.id)}
                className="btn-iniciar-examen"
                disabled={loading}
              >
                🚀 Iniciar Examen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExamenesComponent;
