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
  const [intentoUsado, setIntentoUsado] = useState(false);
  const [preguntasComoImagenes, setPreguntasComoImagenes] = useState({});
  const [imagenesGenerandose, setImagenesGenerandose] = useState(false);
  const [progresoConversion, setProgresoConversion] = useState(0);
  const preguntaRef = useRef(null);

  // Datos de ejemplo
  const examenDatos = {
    nombre: "Examen de Líquidos Penetrantes - PRUEBA",
    duracion: 30,
    totalPreguntas: 1,
    preguntas: [
      {
        id: 11,
        texto: "Escribe el nombre del proceso que utiliza líquidos para detectar discontinuidades superficiales.",
        tipo: "texto",
        respuesta_correcta: "liquidos penetrantes"
      }
    ]
  };

  const iniciarExamen = () => {
    if (intentoUsado) return;
    setExamenIniciado(true);
    setTiempoRestante(examenDatos.duracion * 60);
    setPreguntaActual(0);
    setRespuestas({});
    setExamenTerminado(false);
    setResultado(null);
  };

  // Prevenir copiado
  useEffect(() => {
    if (examenIniciado && !examenTerminado) {
      const prevenir = (e) => {
        e.preventDefault();
        return false;
      };
      document.addEventListener('copy', prevenir);
      document.addEventListener('cut', prevenir);
      document.addEventListener('paste', prevenir);
      document.addEventListener('contextmenu', prevenir);
      return () => {
        document.removeEventListener('copy', prevenir);
        document.removeEventListener('cut', prevenir);
        document.removeEventListener('paste', prevenir);
        document.removeEventListener('contextmenu', prevenir);
      };
    }
  }, [examenIniciado, examenTerminado]);

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
    setIntentoUsado(true);
    calcularResultado();
  };

  const calcularResultado = () => {
    let correctas = 0;
    const normalizar = (texto) => {
      if (!texto) return '';
      texto = String(texto).trim().toLowerCase();
      texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    const nota = (correctas / examenDatos.preguntas.length) * 20;
    const notaRedondeada = Math.round(nota * 10) / 10;
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
    setExamenIniciado(false);
    setPreguntaActual(0);
    setRespuestas({});
    setTiempoRestante(0);
    setExamenTerminado(false);
  };

  // 👉 Renderizado condicional
  if (!examenIniciado) {
    return (
      <div className="examen-prueba-container">
        <div className="examen-inicio">
          <h1>Examen de Prueba - Sistema de Evaluación</h1>
          <div className="examen-info">
            <h2>{examenDatos.nombre}</h2>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Preguntas:</span><span className="info-value">{examenDatos.totalPreguntas}</span></div>
              <div className="info-item"><span className="info-label">Duración:</span><span className="info-value">{examenDatos.duracion} minutos</span></div>
              <div className="info-item"><span className="info-label">Puntaje mínimo:</span><span className="info-value">12/20</span></div>
              <div className="info-item"><span className="info-label">Intentos:</span><span className="info-value">Solo 1</span></div>
            </div>
          </div>
          <button className="btn-iniciar-examen" onClick={iniciarExamen} disabled={intentoUsado}>
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
            <div className="nota-principal">
              <span className="nota-valor">{resultado.nota}</span>
              <span className="nota-escala">/20</span>
            </div>
            <p>{resultado.aprobado ? "APROBADO ✅" : "DESAPROBADO ❌"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render preguntas
  const pregunta = examenDatos.preguntas[preguntaActual];
  return (
    <div className="examen-prueba-container">
      <div className="examen-header">
        <h2>{examenDatos.nombre}</h2>
        <span>{formatearTiempo(tiempoRestante)}</span>
      </div>
      <div className="pregunta-container">
        <h3>{pregunta.texto}</h3>
        <textarea
          value={respuestas[pregunta.id] || ''}
          onChange={e => setRespuestas(prev => ({ ...prev, [pregunta.id]: e.target.value }))}
        />
      </div>
      <div className="navegacion-container">
        {preguntaActual === examenDatos.preguntas.length - 1 ? (
          <button onClick={finalizarExamen}>Finalizar</button>
        ) : (
          <button onClick={siguientePregunta}>Siguiente</button>
        )}
      </div>
    </div>
  );
};

export default ExamenPrueba;
