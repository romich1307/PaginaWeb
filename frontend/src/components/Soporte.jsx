import React from 'react';
import './Soporte.css';

function Soporte() {
  
  const whatsappNumber = "51930995746"; 
  const whatsappMessage = "Hola! Necesito ayuda con la plataforma CONSMIN. ¿Podrían asistirme por favor?";
  
    const handleWhatsAppClick = () => {
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let whatsappUrl;
    
    if (isMobile) {
   
      whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMessage)}`;
    } else {
   
      whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMessage)}`;
    }
    
    const newWindow = window.open(whatsappUrl, '_blank');
    
   
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
    
      alert(
        'No se pudo abrir WhatsApp automáticamente.\n\n' +
        'Puedes contactarnos directamente en:\n' +
        '+51 930 995 746\n\n' +
        'O busca "CONSMIN" en WhatsApp'
      );
    }
    
    console.log('Intentando abrir WhatsApp:', whatsappUrl);
  };

  const handleEmailClick = () => {
    const subject = "Solicitud de Soporte - CONSMIN";
    const body = "Hola,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nGracias.";
    const mailtoUrl = `mailto:soporte@consmin.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="soporte-container">
      <div className="soporte-content">
        <div className="soporte-header">
          <div className="soporte-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Centro de Soporte</h1>
          <p>¿Necesitas ayuda? Estamos aquí para ti</p>
        </div>

        <div className="soporte-body">
          <div className="mensaje-principal">
            <h2> ¿Tienes algún problema o consulta?</h2>
            <p>
              Si necesitas ayuda con tu inscripción, tienes problemas técnicos, 
              o cualquier otra consulta, no dudes en contactarnos. Nuestro equipo 
              de soporte está listo para asistirte.
            </p>
          </div>

          <div className="contacto-section">
            <h3>Escríbenos Directamente</h3>
            
            <div className="contacto-opciones">
              {/* WhatsApp - Opción Principal */}
              <div className="contacto-card whatsapp-card">
                <div className="contacto-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382C17.167 14.222 15.8 13.553 15.514 13.445C15.227 13.337 15.018 13.283 14.809 13.588C14.6 13.894 14.063 14.515 13.88 14.724C13.697 14.933 13.514 14.957 13.209 14.797C12.904 14.637 11.904 14.306 10.717 13.253C9.78899 12.43 9.17899 11.416 8.99599 11.111C8.81299 10.806 8.97599 10.637 9.13599 10.477C9.27999 10.333 9.45599 10.104 9.61599 9.921C9.77599 9.738 9.82999 9.603 9.93799 9.394C10.046 9.185 9.99199 9.002 9.91199 8.842C9.83199 8.682 9.22199 7.315 8.95899 6.705C8.70199 6.115 8.44199 6.195 8.25199 6.185C8.07199 6.175 7.86299 6.175 7.65399 6.175C7.44499 6.175 7.10899 6.255 6.82199 6.56C6.53499 6.865 5.81799 7.534 5.81799 8.901C5.81799 10.268 6.84699 11.591 7.00699 11.8C7.16699 12.009 9.17899 15.108 12.269 16.285C13.008 16.595 13.585 16.785 14.032 16.925C14.773 17.165 15.451 17.13 15.987 17.05C16.584 16.96 17.672 16.36 17.935 15.695C18.198 15.03 18.198 14.465 18.118 14.335C18.038 14.205 17.777 14.542 17.472 14.382Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contacto-info">
                  <h4>WhatsApp</h4>
                  <p>+51930995746</p>
                  <span>Respuesta dentro de horario de atencion</span>
                </div>
                <button 
                  className="btn-whatsapp"
                  onClick={handleWhatsAppClick}
                >
                Escribir por WhatsApp
                </button>
              </div>

              {/* Email - Opción Secundaria */}
              <div className="contacto-card email-card">
                <div className="contacto-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contacto-info">
                  <h4>Email</h4>
                  <p>soporte@consmin.com</p>
                  <span>Respuesta en 24 horas</span>
                </div>
                <button 
                  className="btn-email"
                  onClick={handleEmailClick}
                >
                  Enviar Email
                </button>
              </div>
            </div>
          </div>

          <div className="horario-section">
            <div className="horario-card">
              <div className="horario-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="horario-info">
                <h4>Horarios de Atención</h4>
                <p><strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM</p>
                <p><strong>WhatsApp:</strong> Disponible en horario de atencion</p>
                <p><strong>Email:</strong> Respondemos en máximo 24 horas</p>
              </div>
            </div>
          </div>

          <div className="consejos-section">
            <h3> Para una mejor atención</h3>
            <div className="consejos-grid">
              <div className="consejo-item">
                <span className="consejo-numero">1</span>
                <p>Describe tu problema claramente</p>
              </div>
              <div className="consejo-item">
                <span className="consejo-numero">2</span>
                <p>Incluye capturas de pantalla si es posible</p>
              </div>
              <div className="consejo-item">
                <span className="consejo-numero">3</span>
                <p>Proporciona tu información de contacto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Soporte;