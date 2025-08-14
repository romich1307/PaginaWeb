import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExamenesAsignados.css';

const ExamenesAsignados = () => {
  const [examenesAsignados, setExamenesAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    obtenerExamenesAsignados();
  }, []);

  const obtenerExamenesAsignados = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/mis-examenes-asignados/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExamenesAsignados(data.examenes_asignados);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar exámenes asignados');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const iniciarExamen = async (examenAsignadoId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/examenes-asignados/${examenAsignadoId}/iniciar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Navegar al componente de examen con los datos
        navigate('/examen-prueba', { 
          state: { 
            examenData: data,
            esExamenAsignado: true 
          } 
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al iniciar examen');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return hora.slice(0, 5); // HH:MM
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'programado': { class: 'badge-programado', text: 'Programado' },
      'activo': { class: 'badge-activo', text: 'Activo' },
      'completado': { class: 'badge-completado', text: 'Completado' },
      'expirado': { class: 'badge-expirado', text: 'Expirado' }
    };
    return badges[estado] || { class: 'badge-default', text: estado };
  };

  const getResultadoBadge = (resultado) => {
    const badges = {
      'pendiente': { class: 'badge-pendiente', text: 'Pendiente' },
      'aprobado': { class: 'badge-aprobado', text: 'Aprobado' },
      'desaprobado': { class: 'badge-desaprobado', text: 'Desaprobado' }
    };
    return badges[resultado] || { class: 'badge-default', text: resultado };
  };

  const puedeIniciarExamen = (examenAsignado) => {
    const ahora = new Date();
    const fechaProgramada = new Date(examenAsignado.fecha_programada);
    const [horas, minutos] = examenAsignado.hora_inicio.split(':');
    fechaProgramada.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    
    // Permitir iniciar 10 minutos antes
    const horaLimite = new Date(fechaProgramada.getTime() - 10 * 60 * 1000);
    
    return ahora >= horaLimite && examenAsignado.estado !== 'completado';
  };

  if (loading) {
    return (
      <div className="examenes-asignados-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando exámenes asignados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="examenes-asignados-container">
      <div className="examenes-header">
        <h1>Mis Exámenes Asignados</h1>
        <p>Aquí puedes ver todos los exámenes que te han sido asignados</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {examenesAsignados.length === 0 ? (
        <div className="no-examenes">
          <div className="no-examenes-icon">📋</div>
          <h3>No tienes exámenes asignados</h3>
          <p>Cuando te asignen un examen, aparecerá aquí</p>
        </div>
      ) : (
        <div className="examenes-grid">
          {examenesAsignados.map((examenAsignado) => (
            <div key={examenAsignado.id} className="examen-card">
              <div className="examen-card-header">
                <h3>{examenAsignado.examen.nombre}</h3>
                <div className="badges">
                  <span className={`badge ${getEstadoBadge(examenAsignado.estado).class}`}>
                    {getEstadoBadge(examenAsignado.estado).text}
                  </span>
                  <span className={`badge ${getResultadoBadge(examenAsignado.resultado).class}`}>
                    {getResultadoBadge(examenAsignado.resultado).text}
                  </span>
                </div>
              </div>

              <div className="examen-card-body">
                <div className="examen-info">
                  <div className="info-item">
                    <span className="info-label">Curso:</span>
                    <span className="info-value">{examenAsignado.examen.curso}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tipo:</span>
                    <span className="info-value">{examenAsignado.examen.tipo}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{formatearFecha(examenAsignado.fecha_programada)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Hora:</span>
                    <span className="info-value">{formatearHora(examenAsignado.hora_inicio)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duración:</span>
                    <span className="info-value">{examenAsignado.duracion_minutos} minutos</span>
                  </div>
                  {examenAsignado.nota_final && (
                    <div className="info-item">
                      <span className="info-label">Nota:</span>
                      <span className="info-value nota-final">{examenAsignado.nota_final}/20</span>
                    </div>
                  )}
                </div>

                <div className="examen-descripcion">
                  <p>{examenAsignado.examen.descripcion}</p>
                </div>
              </div>

              <div className="examen-card-footer">
                {puedeIniciarExamen(examenAsignado) ? (
                  <button 
                    className="btn-iniciar-examen"
                    onClick={() => iniciarExamen(examenAsignado.id)}
                  >
                    Iniciar Examen
                  </button>
                ) : examenAsignado.estado === 'completado' ? (
                  <button className="btn-completado" disabled>
                    Examen Completado
                  </button>
                ) : (
                  <button className="btn-no-disponible" disabled>
                    No Disponible
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamenesAsignados;
