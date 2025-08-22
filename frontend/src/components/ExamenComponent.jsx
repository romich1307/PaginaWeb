  // Helper para construir la URL completa de la imagen de la pregunta
  const getImagenUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/media/')) return `http://localhost:8000${img}`;
    return `http://localhost:8000/media/preguntas/${img}`;
  };
import React, { useState, useEffect } from 'react';
import './ExamenComponent.css';

const ExamenComponent = ({ cursoId, curso, onVolver }) => {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examenActual, setExamenActual] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [intentoActual, setIntentoActual] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [examenTerminado, setExamenTerminado] = useState(false);
  const [resultado, setResultado] = useState(null);

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
    cargarExamenes();
  }, [cursoId]);

  useEffect(() => {
    let timer;
    if (examenActual && tiempoRestante > 0 && !examenTerminado) {
      timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            finalizarExamen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examenActual, tiempoRestante, examenTerminado]);

  const cargarExamenes = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/cursos/${cursoId}/examenes-lista/`);
      if (response.ok) {
        const data = await response.json();
        setExamenes(data.examenes);
      } else {
        console.error('Error al cargar exámenes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarExamen = async (examenId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/examenes/${examenId}/iniciar/`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setIntentoActual(data.intento);
        setExamenActual(data.examen);
        setTiempoRestante(data.examen.tiempo_limite * 60);
        cargarPreguntas(data.intento.id);
      } else {
        const error = await response.json();
        if (error.resultado) {
          // Si ya completó el examen, mostrar mensaje específico
          alert(`${error.error}\n\nResultado anterior: ${error.resultado.aprobado ? 'APROBADO' : 'NO APROBADO'}\nPuntaje: ${error.resultado.puntaje || 0}%`);
        } else {
          alert(error.error || 'Error al iniciar examen');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al iniciar examen');
    }
  };

  const cargarPreguntas = async (intentoId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/intentos/${intentoId}/preguntas/`);
      if (response.ok) {
        const data = await response.json();
        setPreguntas(data.preguntas);
      }
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    }
  };

  const manejarRespuesta = (preguntaId, opcionId) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId
    }));
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const irAPregunta = (index) => {
    setPreguntaActual(index);
  };

  const finalizarExamen = async () => {
    if (!intentoActual) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/intentos/${intentoActual.id}/enviar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ respuestas })
      });

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        setExamenTerminado(true);
        setTiempoRestante(0);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar respuestas');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al finalizar examen');
    }
  };

  const volverAExamenes = () => {
    setExamenActual(null);
    setPreguntas([]);
    setRespuestas({});
    setPreguntaActual(0);
    setIntentoActual(null);
    setTiempoRestante(0);
    setExamenTerminado(false);
    setResultado(null);
    cargarExamenes();
  };

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const obtenerEstadoExamen = (examen) => {
    if (!examen.ultimo_intento) {
      return { estado: 'No realizado', clase: 'estado-no-realizado' };
    }
    const intentoEstado = examen.ultimo_intento.estado;
    if (intentoEstado === 'completado') {
      const puntaje = typeof examen.ultimo_intento.puntaje_obtenido === 'number' ? examen.ultimo_intento.puntaje_obtenido : 0;
      if (examen.ultimo_intento.aprobado) {
        return { estado: `APROBADO (${puntaje}%)`, clase: 'estado-aprobado' };
      } else {
        return { estado: `NO APROBADO (${puntaje}%)`, clase: 'estado-reprobado' };
      }
    } else if (intentoEstado === 'abandonado') {
      return { estado: 'EXAMEN ABANDONADO', clase: 'estado-abandonado' };
    } else if (intentoEstado === 'iniciado') {
      return { estado: 'En progreso', clase: 'estado-en-progreso' };
    } else {
      return { estado: 'No realizado', clase: 'estado-no-realizado' };
    }
  };

  if (loading) {
    return <div className="loading">Cargando exámenes...</div>;
  }

  // Vista de resultado del examen
  if (examenTerminado && resultado) {
    return (
      <div className="examen-container" style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}>
        <div className="examen-header" style={{ marginBottom: '30px' }}>
          <button onClick={onVolver} style={{
            background: '#2DAAE1',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            ← Volver a Mis Cursos
          </button>
          <h2 style={{ color: '#E20713', textAlign: 'center' }}>Resultado del Examen</h2>
        </div>
        
        <div className="resultado-examen" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div className={`resultado-card`} style={{
            background: 'white',
            border: `4px solid ${resultado.aprobado ? '#28a745' : '#E20713'}`,
            borderRadius: '20px',
            padding: '50px',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              {resultado.aprobado ? '🎉' : '📚'}
            </div>
            
            <h3 style={{
              fontSize: '32px',
              color: resultado.aprobado ? '#28a745' : '#E20713',
              marginBottom: '20px',
              fontWeight: 'bold'
            }}>
              {resultado.aprobado ? '¡FELICITACIONES!' : 'NO APROBADO'}
            </h3>
            
            <div style={{
              background: resultado.aprobado ? '#d4edda' : '#f8d7da',
              border: `1px solid ${resultado.aprobado ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <p style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: resultado.aprobado ? '#155724' : '#721c24',
                marginBottom: '10px'
              }}>
                Tu puntuación: {Math.round(resultado.puntaje_obtenido)}%<br/>
                Nota sobre 20: {resultado.respuestas_correctas && resultado.total_preguntas ? Math.round((resultado.respuestas_correctas / resultado.total_preguntas) * 20 * 10) / 10 : 0}
              </p>
              <p style={{
                fontSize: '16px',
                color: resultado.aprobado ? '#155724' : '#721c24',
                margin: 0
              }}>
                {resultado.aprobado 
                  ? 'Has aprobado el examen exitosamente' 
                  : `Necesitas ${examenActual?.puntaje_minimo || 70}% para aprobar`
                }
              </p>
            </div>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Examen:</strong> {examenActual?.nombre}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Respuestas correctas:</strong> {resultado.respuestas_correctas} de {resultado.total_preguntas}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
            
            {!resultado.aprobado && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                  💡 <strong>Consejo:</strong> Revisa el material del curso y vuelve a intentarlo cuando te sientas preparado/a.
                </p>
              </div>
            )}
            
            <button 
              onClick={volverAExamenes}
              style={{
                background: '#F9D122',
                color: 'black',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                width: '100%'
              }}
            >
              Ver Otros Exámenes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista del examen en curso
  if (examenActual && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    const esUltimaPregunta = preguntaActual === preguntas.length - 1;
    const esPrimeraPregunta = preguntaActual === 0;

    // Renderizar imagen si existe
    const renderImagenPregunta = () => {
      if (pregunta.imagen_pregunta) {
        return (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img
              src={getImagenUrl(pregunta.imagen_pregunta)}
              alt="Imagen de la pregunta"
              style={{ maxWidth: '400px', maxHeight: '300px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML += '<div style="color:#E20713;font-weight:bold;">No se pudo cargar la imagen</div>'; }}
            />
          </div>
        );
      }
      return null;
    };

    // Opciones para verdadero/falso
    const renderOpciones = () => {
      if (pregunta.tipo === 'verdadero_falso') {
        const opcionesVF = [
          { id: 'verdadero', texto_opcion: 'Verdadero' },
          { id: 'falso', texto_opcion: 'Falso' }
        ];
        return opcionesVF.map((opcion, index) => {
          const isSelected = respuestas[pregunta.id] === opcion.id;
          return (
            <label key={opcion.id} className="opcion-label" style={{
              display: 'block',
              padding: '15px',
              margin: '10px 0',
              border: `2px solid ${isSelected ? '#2DAAE1' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: isSelected ? '#e3f2fd' : 'white',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
                value={opcion.id}
                checked={isSelected}
                onChange={() => manejarRespuesta(pregunta.id, opcion.id)}
                style={{ marginRight: '12px' }}
              />
              <span className="opcion-texto" style={{ color: '#333', fontWeight: 'bold' }}>
                {opcion.texto_opcion}
              </span>
            </label>
          );
        });
      }
      // Pregunta de respuesta escrita
      if (pregunta.tipo === 'texto') {
        return (
          <div style={{ marginTop: '20px' }}>
            <textarea
              name={`pregunta-${pregunta.id}`}
              value={respuestas[pregunta.id] || ''}
              onChange={e => manejarRespuesta(pregunta.id, e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #2DAAE1', fontSize: '16px', resize: 'vertical' }}
              placeholder="Escribe tu respuesta aquí..."
            />
          </div>
        );
      }
      // Opción múltiple y otras
      return pregunta.opciones.map((opcion, index) => {
        const letra = String.fromCharCode(65 + index); // A, B, C, D
        const isSelected = respuestas[pregunta.id] === opcion.id;
        return (
          <label key={opcion.id} className="opcion-label" style={{
            display: 'block',
            padding: '15px',
            margin: '10px 0',
            border: `2px solid ${isSelected ? '#2DAAE1' : '#ddd'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            background: isSelected ? '#e3f2fd' : 'white',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="radio"
              name={`pregunta-${pregunta.id}`}
              value={opcion.id}
              checked={isSelected}
              onChange={() => manejarRespuesta(pregunta.id, opcion.id)}
              style={{ marginRight: '12px' }}
            />
            <span style={{
              fontWeight: 'bold',
              color: '#E20713',
              marginRight: '8px'
            }}>
              {letra})
            </span>
            <span className="opcion-texto" style={{ color: '#333' }}>
              {opcion.texto_opcion}
            </span>
          </label>
        );
      });
    };

    return (
      <div className="examen-container" style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }} onContextMenu={(e) => e.preventDefault()}>
        {/* Imagen de la pregunta */}
        {renderImagenPregunta()}
        {/* Protección anti-plagio */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.01)',
          zIndex: -1,
          pointerEvents: 'none'
        }}></div>

        <div className="examen-header">
          <div className="examen-info">
            <h2 style={{ color: '#E20713' }}>{examenActual.nombre}</h2>
            <p style={{ color: '#2DAAE1' }}>{examenActual.descripcion}</p>
          </div>
          <div className="examen-timer">
            <div className={`timer ${tiempoRestante <= 300 ? 'timer-warning' : ''}`} style={{
              background: '#F9D122',
              color: '#000',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              Tiempo: {formatearTiempo(tiempoRestante)}
            </div>
          </div>
        </div>

        <div className="examen-progreso" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <div className="progreso-info" style={{ color: '#2DAAE1', fontWeight: 'bold', marginBottom: '10px' }}>
            Pregunta {preguntaActual + 1} de {preguntas.length} | {Object.keys(respuestas).length} respondidas
          </div>
          <div className="progreso-barra" style={{ background: '#e9ecef', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              className="progreso-completado" 
              style={{
                width: `${((preguntaActual + 1) / preguntas.length) * 100}%`,
                height: '100%',
                background: '#F9D122',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>

        <div className="pregunta-actual" style={{
          background: 'white',
          border: '2px solid #E20713',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div className="pregunta-numero" style={{
            background: '#E20713',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            Pregunta {preguntaActual + 1}
          </div>

          <div className="pregunta-texto" style={{
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '25px',
            color: '#333'
          }}>
            {pregunta.texto_pregunta}
          </div>

          {renderImagenPregunta()}

          <div className="opciones-container">
            {renderOpciones()}
          </div>
        </div>

        <div className="navegacion-preguntas" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button 
            onClick={preguntaAnterior}
            disabled={esPrimeraPregunta}
            style={{
              background: esPrimeraPregunta ? '#ccc' : '#2DAAE1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: esPrimeraPregunta ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Anterior
          </button>

          <div className="mapa-preguntas" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {preguntas.map((_, index) => (
              <button
                key={index}
                onClick={() => irAPregunta(index)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid',
                  borderColor: respuestas[preguntas[index].id] ? '#F9D122' : '#ddd',
                  background: index === preguntaActual ? '#E20713' : 
                             respuestas[preguntas[index].id] ? '#F9D122' : 'white',
                  color: index === preguntaActual ? 'white' : 
                         respuestas[preguntas[index].id] ? 'black' : '#666',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {!esUltimaPregunta ? (
            <button 
              onClick={siguientePregunta}
              style={{
                background: '#F9D122',
                color: 'black',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Siguiente →
            </button>
          ) : (
            <button 
              onClick={finalizarExamen}
              style={{
                background: '#E20713',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              disabled={Object.keys(respuestas).length === 0}
            >
              Finalizar Examen
            </button>
          )}
        </div>

        {/* Script anti-plagio */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 's')) {
                e.preventDefault();
                return false;
              }
              if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                return false;
              }
            });
            
            document.addEventListener('selectstart', function(e) {
              e.preventDefault();
              return false;
            });
            
            document.addEventListener('dragstart', function(e) {
              e.preventDefault();
              return false;
            });
          `
        }} />
      </div>
    );
  }

  // Vista principal de lista de exámenes
  return (
    <div className="examenes-container">
      <div className="examenes-header">
        <button onClick={onVolver} className="btn-volver">← Volver a Mis Cursos</button>
        <div className="curso-info">
          <h2>Exámenes de {curso?.nombre}</h2>
          <p>{curso?.descripcion}</p>
        </div>
      </div>

      <div className="examenes-lista">
        {examenes.length === 0 ? (
          <div className="no-examenes">
            <p>No hay exámenes disponibles para este curso.</p>
          </div>
        ) : (
          examenes.map((examen) => {
            const estadoExamen = obtenerEstadoExamen(examen);
            return (
              <div key={examen.id} className="examen-card">
                <div className="examen-card-header">
                  <h3>{examen.nombre}</h3>
                  <span className={`estado-badge ${estadoExamen.clase}`}>
                    {estadoExamen.estado}
                  </span>
                </div>
                
                <div className="examen-card-body">
                  <p className="examen-descripcion">{examen.descripcion}</p>
                  
                  <div className="examen-detalles">
                    <div className="detalle-item">
                      <span className="detalle-label">Tipo:</span>
                      <span className="detalle-valor">{examen.tipo === 'teorico' ? 'Teórico' : 'Práctico'}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="detalle-label">Duración:</span>
                      <span className="detalle-valor">{examen.tiempo_limite} minutos</span>
                    </div>
                    <div className="detalle-item">
                      <span className="detalle-label">Puntaje Mínimo:</span>
                      <span className="detalle-valor">{examen.puntaje_minimo}%</span>
                    </div>
                  </div>

                  {examen.ultimo_intento && (
                    <div className="ultimo-intento">
                      <h4>Último Intento:</h4>
                      <p>Puntaje: {typeof examen.ultimo_intento.puntaje_obtenido === 'number' ? examen.ultimo_intento.puntaje_obtenido : 0}%</p>
                      <p>Fecha: {examen.ultimo_intento.fecha_finalizacion ? new Date(examen.ultimo_intento.fecha_finalizacion).toLocaleDateString() : '---'}</p>
                    </div>
                  )}
                </div>

                <div className="examen-card-footer">
                  {examen.tipo === 'teorico' ? (
                    <>
                      {examen.ultimo_intento && examen.ultimo_intento.estado === 'completado' ? (
                        <div className="examen-completado-info">
                          <p className="mensaje-completado">
                            Este examen ya ha sido finalizado.
                          </p>
                          <p className="estado-final">
                            {examen.ultimo_intento.aprobado ? (
                              <span className="aprobado">✓ APROBADO</span>
                            ) : (
                              <span className="no-aprobado">✗ NO APROBADO</span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => iniciarExamen(examen.id)}
                          className="btn-iniciar-examen"
                        >
                          {examen.ultimo_intento ? 'Continuar Examen' : 'Iniciar Examen'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="examen-practico-info">
                      <p>Examen Presencial</p>
                      <p>Debe rendirse en las instalaciones del centro de capacitación</p>
                      {/* Estado de aprobación del admin para el examen práctico */}
                      {typeof examen.aceptado_admin !== 'undefined' && (
                        <div style={{ marginTop: '10px' }}>
                          <strong>Estado de aprobación del admin:</strong>
                          {examen.aceptado_admin === true && <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '8px' }}>Aprobado</span>}
                          {examen.aceptado_admin === false && <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '8px' }}>Desaprobado</span>}
                          {(examen.aceptado_admin === null || examen.aceptado_admin === undefined) && <span style={{ color: 'orange', fontWeight: 'bold', marginLeft: '8px' }}>Pendiente</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExamenComponent;
