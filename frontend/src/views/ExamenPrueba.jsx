import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import './ExamenPrueba.css';

const ExamenPrueba = () => {
  const [examenIniciado, setExamenIniciado] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [examenTerminado, setExamenTerminado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [intentoUsado, setIntentoUsado] = useState(false); // Nuevo estado para controlar intentos
  const [preguntasComoImagenes, setPreguntasComoImagenes] = useState({});
  const [imagenesGenerandose, setImagenesGenerandose] = useState(false);
  const [progresoConversion, setProgresoConversion] = useState(0);
  const preguntaRef = useRef(null);

  // Datos de ejemplo para el examen
  const examenDatos = {
  nombre: "Examen de Líquidos Penetrantes - PRUEBA",
  duracion: 30, // 30 minutos
  totalPreguntas: 11,
  preguntas: [
      {
        id: 1,
        texto: "¿Cuál es el propósito principal de los líquidos penetrantes?",
        opciones: [
          { id: 'a', texto: "Detectar discontinuidades superficiales" },
          { id: 'b', texto: "Medir el espesor del material" },
          { id: 'c', texto: "Determinar la composición química" },
          { id: 'd', texto: "Evaluar propiedades magnéticas" }
        ],
        respuesta_correcta: 'a'
      },
      {
        id: 2,
        texto: "¿Qué tipo de defectos NO pueden detectarse con líquidos penetrantes?",
        opciones: [
          { id: 'a', texto: "Grietas superficiales" },
          { id: 'b', texto: "Defectos internos" },
          { id: 'c', texto: "Porosidad superficial" },
          { id: 'd', texto: "Falta de fusión en soldadura" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 3,
        texto: "¿Cuál es la secuencia correcta en el proceso de líquidos penetrantes?",
        opciones: [
          { id: 'a', texto: "Aplicar penetrante → Limpiar → Aplicar revelador" },
          { id: 'b', texto: "Limpiar → Aplicar penetrante → Tiempo de penetración → Limpiar → Aplicar revelador" },
          { id: 'c', texto: "Aplicar revelador → Aplicar penetrante → Limpiar" },
          { id: 'd', texto: "Aplicar penetrante → Aplicar revelador → Limpiar" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 4,
        texto: "¿Qué característica debe tener un buen penetrante?",
        opciones: [
          { id: 'a', texto: "Alta viscosidad" },
          { id: 'b', texto: "Baja tensión superficial" },
          { id: 'c', texto: "Alta tensión superficial" },
          { id: 'd', texto: "Secado rápido" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 5,
        texto: "¿Cuál es la función del revelador?",
        opciones: [
          { id: 'a', texto: "Penetrar en los defectos" },
          { id: 'b', texto: "Limpiar la superficie" },
          { id: 'c', texto: "Absorber el penetrante y hacerlo visible" },
          { id: 'd', texto: "Proteger la superficie" }
        ],
        respuesta_correcta: 'c'
      },
      {
        id: 6,
        texto: "¿Qué tipo de luz se usa con penetrantes fluorescentes?",
        opciones: [
          { id: 'a', texto: "Luz blanca" },
          { id: 'b', texto: "Luz ultravioleta" },
          { id: 'c', texto: "Luz infrarroja" },
          { id: 'd', texto: "Luz láser" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 7,
        texto: "¿Cuál es el tiempo mínimo de penetración recomendado?",
        opciones: [
          { id: 'a', texto: "1-2 minutos" },
          { id: 'b', texto: "5-10 minutos" },
          { id: 'c', texto: "15-20 minutos" },
          { id: 'd', texto: "30 minutos" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 8,
        texto: "¿Qué material NO es adecuado para ensayos con líquidos penetrantes?",
        opciones: [
          { id: 'a', texto: "Acero inoxidable" },
          { id: 'b', texto: "Aluminio" },
          { id: 'c', texto: "Materiales porosos" },
          { id: 'd', texto: "Titanio" }
        ],
        respuesta_correcta: 'c'
      },
      {
        id: 9,
        texto: "¿Cuál es la ventaja principal de los penetrantes lavables con agua?",
        opciones: [
          { id: 'a', texto: "Mayor sensibilidad" },
          { id: 'b', texto: "Facilidad de remoción" },
          { id: 'c', texto: "Menor costo" },
          { id: 'd', texto: "Mayor penetración" }
        ],
        respuesta_correcta: 'b'
      },
      {
        id: 10,
        texto: "¿Qué norma internacional rige los ensayos con líquidos penetrantes?",
        opciones: [
          { id: 'a', texto: "ASTM E165" },
          { id: 'b', texto: "ISO 9001" },
          { id: 'c', texto: "AWS D1.1" },
          { id: 'd', texto: "ASME VIII" }
        ],
        respuesta_correcta: 'a'
      },
      {
        id: 11,
        texto: "Escribe el nombre del proceso que utiliza líquidos para detectar discontinuidades superficiales.",
        tipo: "texto",
        respuesta_correcta: "liquidos penetrantes"
      }
    ]
  };

  // Prevenir copiado durante el examen
  useEffect(() => {
    if (examenIniciado && !examenTerminado) {
      const prevenir = (e) => {
        e.preventDefault();
        return false;
      };

      const prevenirTeclado = (e) => {
        // Prevenir Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, F12, etc.
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p')) ||
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
          return false;
        }
      };

      // Agregar event listeners
      document.addEventListener('selectstart', prevenir);
      document.addEventListener('contextmenu', prevenir);
      document.addEventListener('copy', prevenir);
      document.addEventListener('cut', prevenir);
      document.addEventListener('paste', prevenir);
      document.addEventListener('dragstart', prevenir);
      document.addEventListener('keydown', prevenirTeclado);

      return () => {
        // Limpiar event listeners
        document.removeEventListener('selectstart', prevenir);
        document.removeEventListener('contextmenu', prevenir);
        document.removeEventListener('copy', prevenir);
        document.removeEventListener('cut', prevenir);
        document.removeEventListener('paste', prevenir);
        document.removeEventListener('dragstart', prevenir);
        document.removeEventListener('keydown', prevenirTeclado);
      };
    }
  }, [examenIniciado, examenTerminado]);

  // Timer effect
  useEffect(() => {
    if (examenIniciado && tiempoRestante > 0 && !examenTerminado) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            finalizarExamen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examenIniciado, tiempoRestante, examenTerminado]);

  const iniciarExamen = () => {
    if (intentoUsado) return; // Prevenir inicio si ya se usó el intento
    
    setExamenIniciado(true);
    setTiempoRestante(examenDatos.duracion * 60); // Convertir minutos a segundos
    setPreguntaActual(0);
    setRespuestas({});
    setExamenTerminado(false);
    setResultado(null);
    convertirPreguntasAImagenes();
  };

  const convertirPreguntasAImagenes = async () => {
    console.log('Convirtiendo preguntas a imágenes...');
    setImagenesGenerandose(true);
    setProgresoConversion(5);
    
    const imagenesGeneradas = {};
    
    // Solo convertir la primera pregunta para empezar más rápido
    const pregunta = examenDatos.preguntas[preguntaActual];
    
    // Crear elemento temporal para la pregunta
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 800px;
      padding: 30px;
      background: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #2c3e50;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    `;
    
    tempDiv.innerHTML = `
      <div style="margin-bottom: 25px;">
        <div style="background: #F9D122; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
          Pregunta ${preguntaActual + 1}
        </div>
        <h3 style="color: #2c3e50; font-size: 1.3em; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">
          ${pregunta.texto}
        </h3>
        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${pregunta.opciones.map(opcion => `
            <div style="display: flex; align-items: center; padding: 18px; border: 2px solid #ecf0f1; border-radius: 12px; background: #fafafa;">
              <div style="width: 24px; height: 24px; border: 2px solid #bdc3c7; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; background: white;"></div>
              <span style="font-weight: 700; color: #7f8c8d; margin-right: 15px; font-size: 1.1em;">${opcion.id.toUpperCase()})</span>
              <span style="color: #2c3e50; line-height: 1.4;">${opcion.texto}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: 'white',
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempDiv.offsetHeight,
        logging: false
      });
      
      imagenesGeneradas[pregunta.id] = canvas.toDataURL('image/png', 0.9);
      console.log(`Imagen generada para pregunta ${pregunta.id}`);
      setProgresoConversion(30);
    } catch (error) {
      console.error('Error generando imagen para pregunta', pregunta.id, error);
    }
    
    document.body.removeChild(tempDiv);
    
    setPreguntasComoImagenes(imagenesGeneradas);
    setImagenesGenerandose(false);
    
    // Convertir el resto de preguntas en segundo plano
    setTimeout(() => convertirRestoPreguntasAImagenes(), 1000);
  };

  const convertirRestoPreguntasAImagenes = async () => {
    const imagenesAdicionales = {};
    
    for (let i = 0; i < examenDatos.preguntas.length; i++) {
      if (i === preguntaActual) continue; // Ya convertida
      
      const pregunta = examenDatos.preguntas[i];
      
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 800px;
        padding: 30px;
        background: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #2c3e50;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      `;
      
      tempDiv.innerHTML = `
        <div style="margin-bottom: 25px;">
          <div style="background: #F9D122; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
            Pregunta ${i + 1}
          </div>
          <h3 style="color: #2c3e50; font-size: 1.3em; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">
            ${pregunta.texto}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            ${pregunta.opciones.map(opcion => `
              <div style="display: flex; align-items: center; padding: 18px; border: 2px solid #ecf0f1; border-radius: 12px; background: #fafafa;">
                <div style="width: 24px; height: 24px; border: 2px solid #bdc3c7; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; background: white;"></div>
                <span style="font-weight: 700; color: #7f8c8d; margin-right: 15px; font-size: 1.1em;">${opcion.id.toUpperCase()})</span>
                <span style="color: #2c3e50; line-height: 1.4;">${opcion.texto}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      try {
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: 'white',
          scale: 1.2,
          useCORS: true,
          allowTaint: true,
          width: 800,
          height: tempDiv.offsetHeight,
          logging: false
        });
        
        imagenesAdicionales[pregunta.id] = canvas.toDataURL('image/png', 0.9);
      } catch (error) {
        console.error('Error generando imagen para pregunta', pregunta.id, error);
      }
      
      document.body.removeChild(tempDiv);
    }
    
    setPreguntasComoImagenes(prev => ({ ...prev, ...imagenesAdicionales }));
    console.log('Todas las imágenes generadas');
  };

  const seleccionarRespuesta = (preguntaId, opcionId) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId
    }));
  };

  const siguientePregunta = () => {
    if (preguntaActual < examenDatos.preguntas.length - 1) {
      setPreguntaActual(prev => prev + 1);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(prev => prev - 1);
    }
  };

  const finalizarExamen = () => {
    setExamenTerminado(true);
    setIntentoUsado(true); // Marcar intento como usado
    calcularResultado();
  };

  const calcularResultado = () => {
    let correctas = 0;
    // Función para normalizar texto (sin tildes, espacios, mayúsculas)
    const normalizar = (texto) => {
      if (!texto) return '';
      texto = String(texto).trim().toLowerCase();
  texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar tildes
  texto = texto.replace(/\s+/g, ' ');
      return texto;
    };
    examenDatos.preguntas.forEach(pregunta => {
      if (pregunta.tipo === 'texto' || pregunta.tipo === 'completar' || pregunta.tipo === 'abierta') {
        if (
          normalizar(respuestas[pregunta.id]) !== '' &&
          normalizar(respuestas[pregunta.id]) === normalizar(pregunta.respuesta_correcta)
        ) {
          correctas++;
        }
      } else {
        if (respuestas[pregunta.id] === pregunta.respuesta_correcta) {
          correctas++;
        }
      }
    });

    // Calcular nota de 0 a 20 (sistema peruano)
    const nota = (correctas / examenDatos.preguntas.length) * 20;
    const notaRedondeada = Math.round(nota * 10) / 10; // Redondear a 1 decimal
    
    setResultado({
      correctas,
      total: examenDatos.preguntas.length,
      nota: notaRedondeada,
      aprobado: notaRedondeada >= 12
    });
  };

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const reiniciarExamen = () => {
    // Ya no permitir reiniciar - solo volver al inicio
    setExamenIniciado(false);
    setPreguntaActual(0);
    setRespuestas({});
    setTiempoRestante(0);
    setExamenTerminado(false);
    // NO reseteamos intentoUsado ni resultado para mantener el historial
  };

  if (!examenIniciado) {
    return (
      <div className="examen-prueba-container">
        <div className="examen-inicio">
          <h1>Examen de Prueba - Sistema de Evaluación</h1>
          <div className="examen-info">
            <h2>{examenDatos.nombre}</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Preguntas:</span>
                <span className="info-value">{examenDatos.totalPreguntas}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duración:</span>
                <span className="info-value">{examenDatos.duracion} minutos</span>
              </div>
              <div className="info-item">
                <span className="info-label">Puntaje mínimo:</span>
                <span className="info-value">12/20</span>
              </div>
              <div className="info-item">
                <span className="info-label">Intentos:</span>
                <span className="info-value">Solo 1</span>
              </div>
            </div>
          </div>
          
          <div className="instrucciones">
            <h3>Instrucciones:</h3>
            <ul>
              <li>Tienes {examenDatos.duracion} minutos para completar el examen</li>
              <li>Selecciona una respuesta para cada pregunta</li>
              <li>Puedes navegar entre preguntas usando los botones</li>
              <li>El examen se enviará automáticamente cuando termine el tiempo</li>
              <li>Necesitas al menos 12/20 para aprobar</li>
              <li><strong>IMPORTANTE: Solo tienes UN intento</strong></li>
            </ul>
          </div>

          <button 
            className="btn-iniciar-examen" 
            onClick={iniciarExamen}
            disabled={intentoUsado}
          >
            {intentoUsado ? 'Examen ya realizado' : 'Iniciar Examen'}
          </button>
          
          {intentoUsado && (
            <div className="mensaje-intento-usado">
              <p>Ya has utilizado tu único intento para este examen.</p>
              <p>Tu calificación final fue: <strong>{resultado?.nota || 'No disponible'}</strong></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (examenTerminado && resultado) {
    return (
      <div className="examen-prueba-container">
        <div className="resultado-container">
          <h1>Resultado del Examen</h1>
          
          <div className={`resultado-card ${resultado.aprobado ? 'aprobado' : 'reprobado'}`}>
            <div className="resultado-icon">
              {resultado.aprobado ? 'APROBADO' : 'DESAPROBADO'}
            </div>
            
            <div className="nota-principal">
              <span className="nota-valor">{resultado.nota}</span>
              <span className="nota-escala">/20</span>
            </div>
            
            <div className="resultado-stats">
              <div className="stat">
                <span className="stat-value">{resultado.correctas}</span>
                <span className="stat-label">Correctas</span>
              </div>
              <div className="stat">
                <span className="stat-value">{resultado.total - resultado.correctas}</span>
                <span className="stat-label">Incorrectas</span>
              </div>
              <div className="stat">
                <span className="stat-value">{resultado.total}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            
            <div className="resultado-mensaje">
              {resultado.aprobado 
                ? `Has obtenido ${resultado.nota}/20. Examen aprobado satisfactoriamente.` 
                : `Has obtenido ${resultado.nota}/20. Se requiere mínimo 12/20 para aprobar.`}
            </div>
            
            <div className="mensaje-unico-intento">
              <p><strong>Este era tu único intento para este examen.</strong></p>
              <p>Tu calificación final es: <span className="nota-final">{resultado.nota}/20</span></p>
            </div>
          </div>

          <div className="acciones-resultado">
            <button className="btn-volver" onClick={() => window.history.back()}>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pregunta = examenDatos.preguntas[preguntaActual];

  return (
    <div className="examen-prueba-container">
      <div className="examen-header">
        <div className="examen-info-bar">
          <h2>{examenDatos.nombre}</h2>
          <div className="examen-stats">
            <span className="pregunta-contador">
              Pregunta {preguntaActual + 1} de {examenDatos.preguntas.length}
            </span>
            <span className={`tiempo-restante ${tiempoRestante <= 300 ? 'urgente' : ''}`}>
              {formatearTiempo(tiempoRestante)}
            </span>
          </div>
        </div>
        
        <div className="progreso-bar">
          <div 
            className="progreso-fill" 
            style={{ width: `${((preguntaActual + 1) / examenDatos.preguntas.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="pregunta-container">
        <div className="pregunta-numero">
          Pregunta {preguntaActual + 1}
        </div>
        
        {imagenesGenerandose ? (
          <div className="cargando-imagen-container">
            <div className="spinner"></div>
            <p>Preparando pregunta...</p>
            <div className="progreso-conversion">
              <div className="progreso-bar-conversion">
                <div 
                  className="progreso-fill-conversion" 
                  style={{ width: `${progresoConversion}%` }}
                ></div>
              </div>
              <span className="progreso-texto">{progresoConversion}%</span>
            </div>
          </div>
        ) : preguntasComoImagenes[pregunta.id] ? (
          <div className="opciones-interactivas">
            <h3 className="pregunta-texto-protegida">{pregunta.texto}</h3>
            <h4>Selecciona tu respuesta:</h4>
            <div className="opciones-simples">
              {pregunta.opciones.map(opcion => (
                <button 
                  key={opcion.id}
                  className={`opcion-btn ${respuestas[pregunta.id] === opcion.id ? 'seleccionada' : ''}`}
                  onClick={() => seleccionarRespuesta(pregunta.id, opcion.id)}
                >
                  <span className="opcion-letra-btn">{opcion.id.toUpperCase()}</span>
                  <span className="opcion-texto-btn">{opcion.texto}</span>
                </button>
              ))}
            </div>
            
            {respuestas[pregunta.id] && (
              <div className="respuesta-seleccionada">
                <span>Respuesta seleccionada: </span>
                <strong>{respuestas[pregunta.id].toUpperCase()}) {pregunta.opciones.find(opt => opt.id === respuestas[pregunta.id])?.texto}</strong>
              </div>
            )}
          </div>
        ) : (
          <>
            <h3 className="pregunta-texto">{pregunta.texto}</h3>
            
            <div className="opciones-container">
              {pregunta.opciones.map(opcion => (
                <div 
                  key={opcion.id}
                  className={`opcion ${respuestas[pregunta.id] === opcion.id ? 'seleccionada' : ''}`}
                  onClick={() => seleccionarRespuesta(pregunta.id, opcion.id)}
                >
                  <div className="opcion-radio">
                    {respuestas[pregunta.id] === opcion.id && <span>●</span>}
                  </div>
                  <span className="opcion-letra">{opcion.id.toUpperCase()})</span>
                  <span className="opcion-texto">{opcion.texto}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="navegacion-container">
        <div className="navegacion-botones">
          <button 
            className="btn-navegacion anterior"
            onClick={preguntaAnterior}
            disabled={preguntaActual === 0}
          >
            Anterior
          </button>
          
          {preguntaActual === examenDatos.preguntas.length - 1 ? (
            <button 
              className="btn-finalizar"
              onClick={finalizarExamen}
              disabled={Object.keys(respuestas).length !== examenDatos.preguntas.length}
            >
              Finalizar Examen
            </button>
          ) : (
            <button 
              className="btn-navegacion siguiente"
              onClick={siguientePregunta}
            >
              Siguiente
            </button>
          )}
        </div>
        
        <div className="respuestas-estado">
          <span>Respondidas: {Object.keys(respuestas).length}/{examenDatos.preguntas.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ExamenPrueba;
