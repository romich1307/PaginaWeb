import React from "react";
import "./Soporte.css";

function Soporte() {
  const handleWhatsAppClick = () => {
    const whatsappNumber = "51910588685";
    const whatsappMessage =
      "Hola! Necesito ayuda con la plataforma CONSMIN. ¿Podrían asistirme por favor?";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    // Redirigir directamente en la misma pestaña
    window.location.href = whatsappUrl;
  };

  const handleEmailClick = () => {
    const subject = "Solicitud de Soporte - CONSMIN";
    const body =
      "Hola,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nGracias.";
    // Usar ambos correos en el mailto
    const mailtoUrl = `mailto:ventas@qsconsmin.com,jarizabal@qsconsmin.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  };

  return (
    <div className="soporte-container">
      <div className="soporte-content">
        <div className="soporte-header">
          <div className="soporte-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>Centro de Soporte</h1>
          <p>¿Necesitas ayuda? Estamos aquí para ti</p>
        </div>

        <div className="soporte-body">
          <div className="mensaje-principal">
            <h2>¿Tienes algún problema o consulta?</h2>
            <p>
              Si necesitas ayuda con tu inscripción, tienes problemas técnicos,
              o cualquier otra consulta, no dudes en contactarnos. Nuestro
              equipo de soporte está listo para asistirte.
            </p>
          </div>

          <div className="contacto-section">
            <h3>Escríbenos Directamente</h3>

            <div className="contacto-opciones">
              {/* WhatsApp */}
              <div className="contacto-card whatsapp-card">
                <div className="contacto-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.472 14.382C17.167 14.222 15.8 13.553 15.514 13.445C15.227 13.337 15.018 13.283 14.809 13.588C14.6 13.894 14.063 14.515 13.88 14.724C13.697 14.933 13.514 14.957 13.209 14.797C12.904 14.637 11.904 14.306 10.717 13.253C9.789 12.43 9.179 11.416 8.996 11.111C8.813 10.806 8.976 10.637 9.136 10.477C9.28 10.333 9.456 10.104 9.616 9.921C9.776 9.738 9.83 9.603 9.938 9.394C10.046 9.185 9.992 9.002 9.912 8.842C9.832 8.682 9.222 7.315 8.959 6.705C8.702 6.115 8.442 6.195 8.252 6.185C8.072 6.175 7.863 6.175 7.654 6.175C7.445 6.175 7.109 6.255 6.822 6.56C6.535 6.865 5.818 7.534 5.818 8.901C5.818 10.268 6.847 11.591 7.007 11.8C7.167 12.009 9.179 15.108 12.269 16.285C13.008 16.595 13.585 16.785 14.032 16.925C14.773 17.165 15.451 17.13 15.987 17.05C16.584 16.96 17.672 16.36 17.935 15.695C18.198 15.03 18.198 14.465 18.118 14.335C18.038 14.205 17.777 14.542 17.472 14.382Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="contacto-info">
                  <h4>WhatsApp</h4>
                  <p>+51 910 588 685</p>
                  <span>Respuesta dentro de horario de atención</span>
                </div>
                <button className="btn-whatsapp" onClick={handleWhatsAppClick}>
                  Escribir por WhatsApp
                </button>
              </div>

              {/* Email */}
              <div className="contacto-card email-card">
                <div className="contacto-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="contacto-info">
                  <h4>Email</h4>
                  <p>ventas@qsconsmin.com</p>
                  <p>jarizabal@qsconsmin.com</p>
                  <span>Respuesta en 24 horas</span>
                </div>
                <button className="btn-email" onClick={handleEmailClick}>
                  Enviar Email
                </button>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="horario-section">
            <div className="horario-card">
              <div className="horario-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="12,6 12,12 16,14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="horario-info">
                <h4>Horarios de Atención</h4>
                <p>
                  <strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM
                </p>
                <p>
                  <strong>WhatsApp:</strong> Disponible en horario de atención
                </p>
                <p>
                  <strong>Email:</strong> Respondemos en máximo 24 horas
                </p>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div className="consejos-section">
            <h3>Para una mejor atención</h3>
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
