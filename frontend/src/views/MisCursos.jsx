import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MisCursos.css';

function MisCursos() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [courseToEnroll, setCourseToEnroll] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    // Configurar headers por defecto
    const defaultHeaders = {
      'Authorization': `Token ${token}`,
      ...options.headers,
    };
    
    // Solo agregar Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    return fetch(url, {
      ...options,
      headers: defaultHeaders,
    });
  };

  // Cargar cursos reales del backend
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        console.log('Cargando cursos desde:', `${API_BASE_URL}/cursos/`);
        const response = await fetch(`${API_BASE_URL}/cursos/`);
        console.log('Respuesta del servidor:', response.status);
        
        if (response.ok) {
          const cursosData = await response.json();
          console.log('Cursos obtenidos:', cursosData);
          setCursos(cursosData);
        } else {
          const errorText = await response.text();
          console.error('Error al cargar cursos:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error de conexión:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarCursos();
  }, []);

  const handleCourseClick = (curso) => {
    setSelectedCourse(curso);
  };

  const handleEnrollClick = (curso) => {
    setCourseToEnroll(curso);
    setShowPayment(true);
    setSelectedCourse(null);
  };

  const closeModal = () => {
    setSelectedCourse(null);
  };

  const closePayment = () => {
    setShowPayment(false);
    setCourseToEnroll(null);
    setPaymentMethod('');
    setReceiptFile(null);
  };

  // Función para procesar la inscripción
  const handleInscripcion = async (e) => {
    e.preventDefault();
    
    console.log('Iniciando proceso de inscripción...');
    console.log('Usuario:', user);
    console.log('Curso a inscribir:', courseToEnroll);
    
    if (!user) {
      alert('Debes estar logueado para inscribirte');
      return;
    }

    if (!paymentMethod || !receiptFile) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('curso', courseToEnroll.id);
      formData.append('metodo_pago', paymentMethod);
      formData.append('comprobante_pago', receiptFile);
      formData.append('comentarios', '');
      formData.append('estado_pago', 'pendiente');

      console.log('FormData creado con archivo:', receiptFile.name);
      console.log('URL del endpoint:', `${API_BASE_URL}/inscripciones/`);

      const response = await fetchWithAuth(`${API_BASE_URL}/inscripciones/`, {
        method: 'POST',
        body: formData, // Enviar FormData en lugar de JSON
        // No incluir Content-Type header, se establece automáticamente para FormData
      });

      console.log('Respuesta del servidor:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Inscripción exitosa:', responseData);
        alert('¡Inscripción enviada exitosamente! Tu solicitud será revisada en 24-48 horas.');
        closePayment();
      } else {
        const errorData = await response.json();
        console.error('Error en inscripción:', errorData);
        console.error('Detalles del error:', errorData.details);
        
        let errorMessage = 'Error al procesar la inscripción:\n';
        if (errorData.error) {
          errorMessage += errorData.error + '\n';
        }
        if (errorData.details) {
          Object.keys(errorData.details).forEach(field => {
            errorMessage += `${field}: ${errorData.details[field].join(', ')}\n`;
          });
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const getNivelColor = (nivel) => {
    switch(nivel) {
      case 'Principiante': return '#4CAF50';
      case 'Intermedio': return '#FF9800';
      case 'Avanzado': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <div className="mis-cursos-container">
      <div className="cursos-header">
        <h1>Mis Cursos</h1>
        <p>Descubre y únete a nuestros cursos especializados</p>
      </div>

      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Cargando cursos...
        </div>
      ) : cursos.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          No hay cursos disponibles en este momento.
        </div>
      ) : (
        <div className="cursos-grid">
          {cursos.map((curso) => (
            <div key={curso.id} className="curso-card" onClick={() => handleCourseClick(curso)}>
              <div className="curso-imagen">
                <img src={curso.imagen || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"} alt={curso.nombre} />
              <div className="curso-nivel" style={{backgroundColor: getNivelColor(curso.nivel)}}>
                {curso.nivel}
              </div>
            </div>
            <div className="curso-info">
              <h3>{curso.nombre}</h3>
              <div className="curso-detalles">
                <span className="precio">{curso.precio}</span>
                <span className="duracion">{curso.duracion}</span>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Modal de Descripción del Curso */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <div className="modal-header">
              <img src={selectedCourse.imagen} alt={selectedCourse.nombre} />
              <div className="modal-title">
                <h2>{selectedCourse.nombre}</h2>
                <div className="modal-badges">
                  <span className="badge nivel" style={{backgroundColor: getNivelColor(selectedCourse.nivel)}}>
                    {selectedCourse.nivel}
                  </span>
                  <span className="badge precio">{selectedCourse.precio}</span>
                  <span className="badge duracion">{selectedCourse.duracion}</span>
                </div>
              </div>
            </div>
            <div className="modal-body">
              <h3>Descripción</h3>
              <p>{selectedCourse.descripcion}</p>
              <h3>Contenido del Curso</h3>
              <ul>
                {selectedCourse.contenido.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button className="enroll-btn" onClick={() => handleEnrollClick(selectedCourse)}>
                Agregar Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showPayment && courseToEnroll && (
        <div className="modal-overlay" onClick={closePayment}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePayment}>×</button>
            <div className="payment-header">
              <h2>Completar Inscripción</h2>
              <div className="course-summary">
                <h3>{courseToEnroll.nombre}</h3>
                <p className="payment-price">Total: {courseToEnroll.precio}</p>
                <div className="course-details">
                  <p><strong>Modalidad:</strong> Presencial</p>
                  <p><strong>Ubicación:</strong> Centro de Capacitación TechPro</p>
                  <p><strong>Horario:</strong> Lunes a Viernes 7:00 PM - 9:00 PM</p>
                  <p><strong>Instructor:</strong> Ing. María González</p>
                  <p><strong>Duración:</strong> {courseToEnroll.duracion}</p>
                </div>
              </div>
            </div>
            <div className="payment-form">
              <h3>Información Personal</h3>
              <form onSubmit={handleInscripcion}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" placeholder="Tu nombre completo" required />
                </div>
                <div className="form-group">
                  <label>Cédula de Identidad</label>
                  <input type="text" placeholder="Número de cédula" required />
                </div>
                <div className="form-group">
                  <label>Email de Confirmación</label>
                  <input type="email" placeholder="tu@email.com" required />
                </div>
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input type="tel" placeholder="Tu número de teléfono" required />
                </div>
                
                <h3>Método de Pago</h3>
                <div className="form-group">
                  <label>Seleccionar Método de Pago</label>
                  <select required onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="">Seleccionar método</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="deposito">Depósito en Efectivo</option>
                  </select>
                </div>

                {paymentMethod && (
                  <div className="payment-info">
                    <div className="bank-details">
                      <h4>Información de Pago</h4>
                      <p><strong>Banco:</strong> Banco Nacional de Costa Rica</p>
                      <p><strong>Cuenta Corriente:</strong> 200-01-000-123456</p>
                      <p><strong>Cuenta IBAN:</strong> CR05015202001000123456</p>
                      <p><strong>Titular:</strong> TechPro Education S.A.</p>
                      <p><strong>Cédula Jurídica:</strong> 3-101-123456</p>
                      <hr />
                      <p><strong>Para consultas:</strong></p>
                      <p><strong>Teléfono:</strong> +506 2234-5678</p>
                      <p><strong>WhatsApp:</strong> +506 8765-4321</p>
                      <p><strong>Email:</strong> pagos@techproeducation.com</p>
                    </div>
                    
                    <div className="form-group">
                      <label>Subir Comprobante de Pago</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        required 
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                      />
                      <small>Formatos aceptados: JPG, PNG, PDF (Máx. 5MB)</small>
                    </div>

                    <div className="form-group">
                      <label>Comentarios Adicionales (Opcional)</label>
                      <textarea 
                        placeholder="Alguna consulta o comentario especial..."
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="payment-btn"
                  disabled={!paymentMethod || !receiptFile}
                >
                  Enviar Solicitud de Inscripción
                </button>
                
                <p className="payment-note">
                  * Tu inscripción será verificada en un plazo de 24-48 horas. 
                  Recibirás un email de confirmación una vez aprobada.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisCursos;
