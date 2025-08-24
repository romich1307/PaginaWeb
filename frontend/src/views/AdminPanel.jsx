  // Helper para construir la URL completa de la imagen de la pregunta
  const getImagenUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
  if (img.startsWith('/media/')) return `${import.meta.env.VITE_API_URL.replace('/api','')}${img}`;
  return `${import.meta.env.VITE_API_URL.replace('/api','')}/media/preguntas/${img}`;
  };
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminPanel.css';

function AdminPanel() {
  // Eliminar curso
  const eliminarCurso = async (cursoId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este curso?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/admin/cursos/${cursoId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        mostrarNotificacion('Curso eliminado correctamente');
        loadData();
      } else {
        mostrarNotificacion('Error al eliminar el curso');
      }
    } catch {
      mostrarNotificacion('Error de conexión');
    }
  };
  // Devuelve estudiantes inscritos, pagados y aceptados por el admin para un curso
  const getEstudiantesInscritosPagadosAceptados = (cursoId) => {
    return inscripciones
      .filter(
        insc =>
          insc.curso_info?.id === cursoId &&
          insc.estado_pago === 'verificado' &&
          insc.aceptado_admin === true
      )
      .map(insc => ({
        id: insc.usuario_info?.id,
        nombre: `${insc.usuario_info?.nombres || ''} ${insc.usuario_info?.apellidos || ''}`.trim()
      }));
  };

  // Devuelve estudiantes inscritos y pagados pero NO aceptados aún (para mostrar en el modal para aprobar)
  const getEstudiantesPendientesAceptacion = (cursoId) => {
    return inscripciones
      .filter(
        insc =>
          insc.curso_info?.id === cursoId &&
          insc.estado_pago === 'verificado' &&
          insc.aceptado_admin !== true
      )
      .map(insc => ({
        id: insc.usuario_info?.id,
        nombre: `${insc.usuario_info?.nombres || ''} ${insc.usuario_info?.apellidos || ''}`.trim()
      }));
  };

  // Aprobar estudiante (actualiza aceptado_admin en backend)
  const aprobarEstudiante = async (usuarioId, cursoId) => {
    const insc = inscripciones.find(
      i => i.usuario_info?.id === usuarioId && i.curso_info?.id === cursoId
    );
    if (!insc) return;
    await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${insc.id}/`, {
      method: 'PUT',
      body: JSON.stringify({ aceptado_admin: true })
    });
    loadData();
  };

  // Desaprobar estudiante (actualiza aceptado_admin en backend)
  const desaprobarEstudiante = async (usuarioId, cursoId) => {
    const insc = inscripciones.find(
      i => i.usuario_info?.id === usuarioId && i.curso_info?.id === cursoId
    );
    if (!insc) return;
    await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${insc.id}/`, {
      method: 'PUT',
      body: JSON.stringify({ aceptado_admin: false })
    });
    loadData();
  };
  const { logout, user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [subActiveTab, setSubActiveTab] = useState('examenes');
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  // Estados para selección de curso y examen en la pestaña de preguntas
  const [cursoPreguntasId, setCursoPreguntasId] = useState('');
  // Estado para el modal de añadir pregunta
  const [mostrarModalPregunta, setMostrarModalPregunta] = useState(false);
  const [nuevaPregunta, setNuevaPregunta] = useState({
    texto: '',
    opcion_a: '',
    opcion_b: '',
    opcion_c: '',
    opcion_d: '',
    respuesta_correcta: 'A',
    examen_id: '',
  });
  const [errorPregunta, setErrorPregunta] = useState('');
  const [intentosExamen, setIntentosExamen] = useState([]);
  const [examenesPracticosPendientes, setExamenesPracticosPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormularioCurso, setMostrarFormularioCurso] = useState(false);

  // Estados para la gestión de estudiantes
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenPor, setOrdenPor] = useState('fecha_desc');
  const [paginaActual, setPaginaActual] = useState(1);
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [estudianteDetalle, setEstudianteDetalle] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalListaEstudiantes, setModalListaEstudiantes] = useState({ abierto: false, estudiantes: [], cursoId: null });

  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    descripcion: '',
    instructor: '',
    ubicacion: '',
    horario: '',
    precio: '',
    duracion_semanas: '',
    nivel: 'basico',
    activo: true
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken'); // Cambiar de 'token' a 'authToken'
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        ...options.headers,
      },
    });
  };

  // Cargar datos reales del backend
  useEffect(() => {
    console.log('AdminPanel: Estado de autenticación:', {
      isAuthenticated,
      isAdmin,
      isLoading,
      user
    });

    if (isLoading) {
      console.log('AdminPanel: Esperando carga de autenticación...');
      return;
    }

    if (!isAuthenticated) {
      console.log('AdminPanel: Usuario no autenticado');
      setError('No estás logueado. Por favor inicia sesión primero.');
      return;
    }

    if (!isAdmin) {
      console.log('AdminPanel: Usuario no es administrador');
      setError('No tienes permisos de administrador.');
      return;
    }

    console.log('AdminPanel: Usuario autenticado y es admin, cargando datos...');
    loadData();
  }, [isAuthenticated, isAdmin, isLoading]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken'); // Usar 'authToken' consistentemente
      console.log('Token:', token);

      if (!token) {
        setError('No estás logueado. Por favor inicia sesión primero.');
        return;
      }

      // Primero verificar si el token es válido obteniendo el perfil del usuario
      const profileResponse = await fetchWithAuth(`${API_BASE_URL}/profile/`);
      console.log('Profile response status:', profileResponse.status);

      if (profileResponse.status === 401 || profileResponse.status === 403) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('authToken'); // Cambiar de 'token' a 'authToken'
        return;
      }

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.log('Profile response error:', errorText);
        setError(`Error de autenticación: ${profileResponse.status}`);
        return;
      }

      const profileData = await profileResponse.json();
      console.log('User profile:', profileData);

      // Verificar si es admin
      const adminResponse = await fetchWithAuth(`${API_BASE_URL}/admin/is-admin/`);
      console.log('Admin response status:', adminResponse.status);

      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.log('Admin response error:', errorText);
        setError(`Error verificando permisos: ${adminResponse.status}`);
        return;
      }

      const adminData = await adminResponse.json();
      console.log('Admin data:', adminData);

      if (!adminData.is_admin) {
        setError(`No tienes permisos de administrador. Email actual: ${profileData.user?.email || 'No disponible'}. Se requiere: jiji@gmail.com`);
        return;
      }

      // Cargar estudiantes
      const estudiantesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/estudiantes/`);
      if (estudiantesResponse.ok) {
        const estudiantesData = await estudiantesResponse.json();
        setEstudiantes(estudiantesData);
      }

      // Cargar cursos
      const cursosResponse = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/`);
      if (cursosResponse.ok) {
        const cursosData = await cursosResponse.json();
        setCursos(cursosData);
      }

      // Cargar inscripciones
      const inscripcionesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/`);
      if (inscripcionesResponse.ok) {
        const inscripcionesData = await inscripcionesResponse.json();
        console.log('📋 Inscripciones cargadas:', inscripcionesData.length);
        console.log('📋 Inscripciones más recientes:', inscripcionesData.slice(0, 3));
        setInscripciones(inscripcionesData);
      }

      // Cargar exámenes
      const examenesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/examenes/`);
      if (examenesResponse.ok) {
        const examenesData = await examenesResponse.json();
        setExamenes(examenesData);
      }

      // Cargar preguntas
      const preguntasResponse = await fetchWithAuth(`${API_BASE_URL}/admin/preguntas/`);
      if (preguntasResponse.ok) {
        const preguntasData = await preguntasResponse.json();
        setPreguntas(preguntasData);
      }

      // Cargar intentos de examen
      const intentosResponse = await fetchWithAuth(`${API_BASE_URL}/admin/intentos-examen/`);
      if (intentosResponse.ok) {
        const intentosData = await intentosResponse.json();
        setIntentosExamen(intentosData);
      }

      // Cargar exámenes prácticos pendientes
      const practicosPendientesResponse = await fetchWithAuth(`${API_BASE_URL}/admin/examenes-practicos/pendientes/`);
      if (practicosPendientesResponse.ok) {
        const practicosPendientesData = await practicosPendientesResponse.json();
        setExamenesPracticosPendientes(practicosPendientesData);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de pago
  const actualizarEstadoPago = async (inscripcionId, nuevoEstado) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${inscripcionId}/`, {
        method: 'PUT',
        body: JSON.stringify({ estado_pago: nuevoEstado }),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Estado de pago actualizado correctamente');
      } else {
        setError('Error al actualizar el estado de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar el estado de pago');
    }
  };

  // Función para actualizar una fecha específica de inscripción
  const actualizarFechaInscripcion = async (inscripcionId, campo, valor) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${inscripcionId}/`, {
        method: 'PUT',
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        // Actualizar solo la inscripción específica en el estado local
        setInscripciones(prev => 
          prev.map(inscripcion => 
            inscripcion.id === inscripcionId 
              ? { ...inscripcion, [campo]: valor }
              : inscripcion
          )
        );

        // Mostrar notificación sutil
        mostrarNotificacion(`${campo.replace('_', ' ')} actualizada correctamente`);
      } else {
        alert('Error al actualizar la fecha');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la fecha');
    }
  };

  // Función para construir URL completa del comprobante
  const construirUrlComprobante = (comprobante) => {
    if (!comprobante) return null;

    // Si ya es una URL completa, usarla tal como está
    if (comprobante.startsWith('http://') || comprobante.startsWith('https://')) {
      return comprobante;
    }

    // Si ya empieza con /media/, solo agregar el dominio base
    if (comprobante.startsWith('/media/')) {
      const baseUrl = API_BASE_URL.replace('/api', ''); // Remover /api para archivos media
      return `${baseUrl}${comprobante}`;
    }

    // Si es una ruta relativa que empieza con 'comprobantes/', construir URL completa
    if (comprobante.startsWith('comprobantes/')) {
      const baseUrl = API_BASE_URL.replace('/api', ''); // Remover /api para archivos media
      return `${baseUrl}/media/${comprobante}`;
    }

    // Si es solo un nombre de archivo, asumir que está en comprobantes/
    const baseUrl = API_BASE_URL.replace('/api', ''); // Remover /api para archivos media
    return `${baseUrl}/media/comprobantes/${comprobante}`;
  };

  // Función para ver comprobante de pago
  const verComprobante = async (urlComprobante) => {
    console.log('🔍 DEBUG: verComprobante llamado con:', urlComprobante);

    if (!urlComprobante) {
      alert('No hay comprobante disponible');
      return;
    }

    const urlCompleta = construirUrlComprobante(urlComprobante);
    console.log('🔍 DEBUG: URL construida:', urlCompleta);

    if (!urlCompleta) {
      alert('Error al construir la URL del comprobante');
      return;
    }

    // Verificar si el archivo existe antes de abrir el modal
    try {
      console.log('🔍 DEBUG: Verificando archivo...');
      const response = await fetch(urlCompleta, { method: 'HEAD' });
      console.log('🔍 DEBUG: Respuesta HEAD:', response.status, response.ok);
      if (!response.ok) {
        console.warn(`Archivo no encontrado: ${urlCompleta}`);
        // Aún así mostramos el modal para que el usuario vea la información de error
      }
    } catch (error) {
      console.warn(`Error al verificar archivo: ${error.message}`);
      // Continuamos mostrando el modal con información de error
    }

    console.log('🔍 DEBUG: Creando modal...');

    // Remover cualquier modal existente
    const existingModal = document.querySelector('.comprobante-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Crear modal para mostrar el comprobante
    const modal = document.createElement('div');
    modal.className = 'comprobante-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'comprobante-modal-content';

    const header = document.createElement('div');
    header.className = 'comprobante-header';
    header.innerHTML = `
      <h3>Comprobante de Pago</h3>
      <button class="close-comprobante">×</button>
    `;

    const viewer = document.createElement('div');
    viewer.className = 'comprobante-viewer';
    viewer.innerHTML = getComprobanteViewer(urlCompleta, urlComprobante);

    const actions = document.createElement('div');
    actions.className = 'comprobante-actions';
    actions.innerHTML = `
      <button class="btn-download">Abrir en nueva pestaña</button>
      <button class="btn-copy">Copiar URL</button>
      <button class="btn-info">Ver información técnica</button>
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(viewer);
    modalContent.appendChild(actions);
    modal.appendChild(modalContent);

    // Event listeners
    const closeBtn = header.querySelector('.close-comprobante');
    closeBtn.addEventListener('click', () => modal.remove());

    const downloadBtn = actions.querySelector('.btn-download');
    downloadBtn.addEventListener('click', () => window.open(urlCompleta, '_blank'));

    const copyBtn = actions.querySelector('.btn-copy');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(urlCompleta).then(() => {
        mostrarNotificacion('URL copiada al portapapeles');
      });
    });

    const infoBtn = actions.querySelector('.btn-info');
    infoBtn.addEventListener('click', () => {
      const infoModal = `
        Información del Comprobante:
        
        Archivo original: ${urlComprobante}
        URL construida: ${urlCompleta}
        API Base: ${API_BASE_URL}
        
        Pruebas para diagnosticar:
  1. ¿Django está corriendo? → ${import.meta.env.VITE_API_URL.replace('/api','')}/
  2. ¿Archivos media funcionan? → ${import.meta.env.VITE_API_URL.replace('/api','')}/media/test.txt
        3. ¿Esta URL específica? → ${urlCompleta}
        
        Si alguna falla:
  - Verificar que Django esté corriendo en el servidor configurado
        - Verificar configuración de MEDIA_URL y MEDIA_ROOT
        - Verificar que el archivo existe en backend/media/comprobantes/
        - Verificar configuración de CORS y X-Frame-Options
      `;
      alert(infoModal);
    });

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Cerrar con tecla Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(modal);
  };

  // Función para obtener el visor apropiado según el tipo de archivo
  const getComprobanteViewer = (url, archivoOriginal) => {
    const extension = url.split('.').pop().toLowerCase();
    const fileName = url.split('/').pop();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return `
        <div class="image-container">
          <img src="${url}" alt="Comprobante" 
               style="max-width: 100%; height: auto; max-height: 500px; display: block;" 
               onload="this.nextElementSibling.style.display='none';"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div class="error-fallback">
            <div class="file-preview">
              <div class="file-icon-large">IMG</div>
              <p><strong>Archivo de imagen:</strong></p>
              <p class="file-name">${fileName}</p>
              <p class="file-original">Original: ${archivoOriginal}</p>
              <p class="error-msg">No se pudo cargar la imagen. Verifica que el archivo existe en el servidor.</p>
              <p class="help-msg">💡 Usa "Ver información técnica" para más detalles</p>
            </div>
          </div>
        </div>`;
    } else if (extension === 'pdf') {
      return `
        <div class="pdf-container">
          <embed src="${url}" type="application/pdf" style="width: 100%; height: 500px; display: block;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div class="error-fallback">
            <div class="file-preview">
              <div class="file-icon-large">PDF</div>
              <p><strong>Archivo PDF:</strong></p>
              <p class="file-name">${fileName}</p>
              <p class="file-original">Original: ${archivoOriginal}</p>
              <p class="error-msg">No se pudo cargar el PDF. Intenta abrirlo en nueva pestaña.</p>
              <p class="help-msg"> Usa "Ver información técnica" para más detalles</p>
            </div>
          </div>
        </div>`;
    } else {
      return `<div class="file-preview">
        <div class="file-icon-large">${extension.toUpperCase()}</div>
        <p><strong>Archivo:</strong></p>
        <p class="file-name">${fileName}</p>
        <p class="file-original">Original: ${archivoOriginal}</p>
        <p><strong>Tipo:</strong> ${extension.toUpperCase()}</p>
        <p class="info-msg">Haz clic en "Abrir en nueva pestaña" para ver el archivo.</p>
      </div>`;
    }
  };

  // Función para obtener el icono del archivo
  const getFileIcon = (url) => {
    if (!url) return <span className="no-file">Sin archivo</span>;

    const extension = url.split('.').pop().toLowerCase();

    switch (extension) {
      case 'pdf':
        return <span className="file-icon pdf" title="PDF">PDF</span>;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <span className="file-icon image" title="Imagen">IMG</span>;
      case 'doc':
      case 'docx':
        return <span className="file-icon doc" title="Documento">DOC</span>;
      default:
        return <span className="file-icon unknown" title="Archivo">FILE</span>;
    }
  };

  // Función para mostrar notificaciones sutiles
  const mostrarNotificacion = (mensaje) => {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-sutil';
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    // Animación de entrada
    setTimeout(() => notificacion.classList.add('mostrar'), 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  };

  // Función para manejar el envío del formulario de nuevo curso
  const handleCrearCurso = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nuevoCurso.nombre || !nuevoCurso.descripcion || !nuevoCurso.precio) {
      alert('Por favor completa al menos el nombre, descripción y precio del curso');
      return;
    }

    const exito = await crearCurso(nuevoCurso);
    if (exito) {
      // Limpiar el formulario
      setNuevoCurso({
        nombre: '',
        descripcion: '',
        instructor: '',
        ubicacion: '',
        horario: '',
        precio: '',
        duracion_semanas: '',
        nivel: 'basico',
        activo: true
      });
      setMostrarFormularioCurso(false);
    }
  };

  // Función para crear un nuevo curso
  const crearCurso = async (datosNuevoCurso) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/`, {
        method: 'POST',
        body: JSON.stringify(datosNuevoCurso),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Curso creado exitosamente');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Error al crear curso:', errorData);
        setError(`Error al crear curso: ${JSON.stringify(errorData)}`);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear el curso');
      return false;
    }
  };

  // Función para actualizar información del curso
  const actualizarCurso = async (cursoId, campo, valor) => {
    try {
      // Validar que el valor no esté vacío para campos requeridos
      if (['nombre', 'precio'].includes(campo) && (!valor || valor.toString().trim() === '')) {
        alert(`El campo ${campo} no puede estar vacío`);
        loadData(); // Recargar para restaurar el valor original
        return;
      }

      // Actualizar localmente primero para mejor UX
      setCursos(prevCursos => 
        prevCursos.map(curso => 
          curso.id === cursoId 
            ? { ...curso, [campo]: valor }
            : curso
        )
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/admin/cursos/${cursoId}/`, {
        method: 'PATCH', // Usar PATCH en lugar de PUT para actualizaciones parciales
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        console.log(`Curso actualizado: ${campo} = ${valor}`);
        // Mostrar notificación sutil
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          z-index: 1000;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = `${campo} actualizado correctamente`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar curso:', errorData);
        setError(`Error al actualizar ${campo}: ${errorData.detail || 'Error desconocido'}`);
        loadData(); // Recargar para restaurar el valor original
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error de conexión al actualizar ${campo}`);
      loadData(); // Recargar para restaurar el valor original
    }
  };

  // Función para actualizar fechas de inscripción
  const actualizarFechasInscripcion = async (inscripcionId, fechas) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/inscripciones/${inscripcionId}/`, {
        method: 'PUT',
        body: JSON.stringify(fechas),
      });

      if (response.ok) {
        loadData(); // Recargar todos los datos
        alert('Fechas actualizadas correctamente');
      } else {
        setError('Error al actualizar las fechas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar las fechas');
    }
  };

  // Función para actualizar exámenes
  const actualizarExamen = async (examenId, campo, valor) => {
    try {
      // Actualizar localmente primero (para examenes como array de cursos)
      setExamenes(prevExamenes =>
        prevExamenes.map(curso => ({
          ...curso,
          examenes: curso.examenes
            ? curso.examenes.map(examen =>
                examen.id === examenId
                  ? { ...examen, [campo]: valor }
                  : examen
              )
            : curso.examenes
        }))
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examenes/${examenId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ [campo]: valor }),
      });

      if (response.ok) {
        console.log(`Examen actualizado: ${campo} = ${valor}`);
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          z-index: 1000;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = `${campo} del examen actualizado`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      } else {
        console.error('Error al actualizar examen');
        loadData(); // Recargar para restaurar
      }
    } catch (error) {
      console.error('Error:', error);
      loadData();
    }
  };

  // Función para actualizar preguntas
  // ...la versión correcta ya está definida abajo...

  // Función para eliminar pregunta
    const actualizarPregunta = async (preguntaId, campo, valor) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/admin/preguntas/${preguntaId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({ [campo]: valor }),
        });
        if (response.ok) {
          setPreguntas(prevPreguntas => 
            prevPreguntas.map(pregunta => 
              pregunta.id === preguntaId 
                ? { ...pregunta, [campo]: valor }
                : pregunta
            )
          );
          setErrorPregunta('');
        } else {
          setErrorPregunta('Error al actualizar la pregunta');
        }
      } catch (error) {
        setErrorPregunta('Error de conexión al actualizar la pregunta');
      }
    };

    // Función para eliminar pregunta
const eliminarPregunta = async (preguntaId) => {
  if (!window.confirm('¿Seguro que deseas eliminar esta pregunta?')) return;
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/admin/preguntas/${preguntaId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!res.ok) {
      alert('Error al eliminar la pregunta');
      return;
    }
    // Actualizar preguntas localmente
    setPreguntas(prev => prev.filter(p => p.id !== preguntaId));
  } catch (err) {
    alert('Error de conexión al eliminar la pregunta');
  }
};
  // Función para ver resultados del examen
  const verResultadosExamen = (examenId) => {
    // Buscar el examen en la estructura de cursos
    let examenEncontrado = null;
    let cursoNombre = '';

    for (const curso of examenes) {
      const examen = curso.examenes.find(e => e.id === examenId);
      if (examen) {
        examenEncontrado = examen;
        cursoNombre = curso.nombre;
        break;
      }
    }

    if (!examenEncontrado) {
      alert('Examen no encontrado');
      return;
    }

    const promedioCalificacion = examenEncontrado.intentos_completados > 0 
      ? 'Información detallada disponible en la pestaña "Intentos"' 
      : 'Sin intentos completados';

    const porcentajeFinalizacion = examenEncontrado.total_intentos > 0 
      ? ((examenEncontrado.intentos_completados / examenEncontrado.total_intentos) * 100).toFixed(1)
      : '0';

    alert(`Resultados del Examen: ${examenEncontrado.titulo}
Curso: ${cursoNombre}
    
Total de intentos: ${examenEncontrado.total_intentos}
Intentos completados: ${examenEncontrado.intentos_completados}
Porcentaje de finalización: ${porcentajeFinalizacion}%
Preguntas configuradas: ${examenEncontrado.numero_preguntas} de ${examenEncontrado.total_preguntas_creadas} disponibles
Duración: ${examenEncontrado.duracion_minutos} minutos
Estado: ${examenEncontrado.activo ? 'Activo' : 'Inactivo'}

Tip: Ve a la pestaña "Intentos" para ver detalles específicos de cada estudiante.`);
  };

  // Función para ver detalle del intento
  const verDetalleIntento = (intentoId) => {
    const intento = intentosExamen.find(i => i.id === intentoId);
    if (!intento) return;

    const duracion = intento.fecha_finalizacion && intento.fecha_inicio
      ? Math.round((new Date(intento.fecha_finalizacion) - new Date(intento.fecha_inicio)) / 60000)
      : 'N/A';

    alert(`Detalle del Intento:

Usuario: ${intento.usuario_nombre}
Examen: ${intento.examen_titulo}
Inicio: ${new Date(intento.fecha_inicio).toLocaleString()}
Fin: ${intento.fecha_finalizacion ? new Date(intento.fecha_finalizacion).toLocaleString() : 'En progreso'}
Duración: ${duracion} minutos
Puntaje: ${intento.puntaje !== null ? intento.puntaje : 'Pendiente'}
Preguntas: ${intento.preguntas_seleccionadas?.length || 0}
Estado: ${intento.estado === 'completado' ? 'Completado' : 'En progreso'}`);
  };

  // Función para actualizar resultado de examen práctico
  const actualizarResultadoPractico = async (intentoId, resultado, observaciones = '', evaluador = '') => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examen-practico/resultado/${intentoId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          resultado_practico: resultado,
          observaciones_practico: observaciones,
          evaluador: evaluador
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar la lista de pendientes removiendo el item actualizado
        setExamenesPracticosPendientes(prev => prev.filter(item => item.id !== intentoId));

        // Actualizar la lista de exámenes para remover el intento evaluado
        setExamenes(prev => prev.map(curso => ({
          ...curso,
          examenes: curso.examenes.map(examen => ({
            ...examen,
            examenes_practicos_pendientes: examen.examenes_practicos_pendientes?.filter(
              intento => intento.id !== intentoId
            ) || []
          }))
        })));

        alert(`Resultado actualizado: ${resultado.toUpperCase()}`);
      } else {
        console.error('Error al actualizar resultado práctico');
        alert('Error al actualizar el resultado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el resultado');
    }
  };

  // Función para manejar la evaluación práctica
  const evaluarExamenPractico = (intentoId, resultado) => {
    const evaluador = prompt(`Ingresa tu nombre como evaluador:`);
    if (!evaluador) return;

    const observaciones = prompt('Observaciones adicionales (opcional):') || '';

    actualizarResultadoPractico(intentoId, resultado, observaciones, evaluador);
  };

  // Función para programar examen práctico individual
  const programarExamenPractico = async (intentoId, fechaProgramada, horaProgramada = '', duracionProgramada = '') => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examenes-practicos/programar/`, {
        method: 'POST',
        body: JSON.stringify({
          intento_id: intentoId,
          fecha_programada: fechaProgramada,
          hora_programada: horaProgramada,
          duracion_programada: duracionProgramada
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Examen programado exitosamente: ${data.message}`);

        // Recargar datos de exámenes pendientes
        loadData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error al programar examen:', error);
      alert('Error al programar examen');
    }
  };

  // Función para activar examen para todos los inscritos en un curso
  const activarExamenParaCurso = async (examenId, fechaProgramada, horaProgramada, duracionProgramada) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/examenes-practicos/activar/`, {
        method: 'POST',
        body: JSON.stringify({
          examen_id: examenId,
          fecha_programada: fechaProgramada,
          hora_programada: horaProgramada,
          duracion_programada: duracionProgramada
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`¡Examen activado exitosamente!\n${data.message}\nIntentos creados: ${data.intentos_creados}\nIntentos actualizados: ${data.intentos_actualizados}`);

        // Recargar datos
        loadData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error al activar examen:', error);
      alert('Error al activar examen para el curso');
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Verificando autenticación...</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Cargando panel de administración...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Panel de Administración</h1>
          <div className="error-message" style={{color: 'red', padding: '20px', textAlign: 'center'}}>
            {error}
            <br />
            <div style={{marginTop: '15px'}}>
              <button 
                onClick={loadData} 
                style={{marginRight: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Reintentar
              </button>
              <button 
                onClick={() => window.location.href = '/login'} 
                style={{padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Ir a Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderEstudiantes = () => {
    const elementosPorPagina = 10;

    // Función para verificar si un estudiante tiene cursos comprados
    const tieneCompraVerificada = (estudianteId) => {
      return inscripciones.some(inscripcion => 
        inscripcion.usuario === estudianteId && 
        (inscripcion.estado_pago === 'verificado' || inscripcion.estado_pago === 'pagado')
      );
    };

    // Función para obtener cursos del estudiante
    const obtenerCursosEstudiante = (estudianteId) => {
      return inscripciones
        .filter(inscripcion => 
          inscripcion.usuario === estudianteId && 
          (inscripcion.estado_pago === 'verificado' || inscripcion.estado_pago === 'pagado')
        )
        .map(inscripcion => inscripcion.curso_info?.nombre || 'Curso no disponible');
    };

    // Filtrar y ordenar estudiantes
    const estudiantesFiltrados = estudiantes
      .filter(estudiante => {
        const esActivo = tieneCompraVerificada(estudiante.id);
        const coincideBusqueda = `${estudiante.nombres} ${estudiante.apellidos} ${estudiante.email} ${estudiante.dni}`
          .toLowerCase()
          .includes(busqueda.toLowerCase());

        if (filtroEstado === 'activos') return esActivo && coincideBusqueda;
        if (filtroEstado === 'inactivos') return !esActivo && coincideBusqueda;
        return coincideBusqueda;
      })
      .sort((a, b) => {
        switch (ordenPor) {
          case 'nombre_asc':
            return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
          case 'nombre_desc':
            return `${b.nombres} ${b.apellidos}`.localeCompare(`${a.nombres} ${a.apellidos}`);
          case 'fecha_asc':
            return new Date(a.date_joined) - new Date(b.date_joined);
          case 'fecha_desc':
            return new Date(b.date_joined) - new Date(a.date_joined);
          case 'email_asc':
            return a.email.localeCompare(b.email);
          case 'email_desc':
            return b.email.localeCompare(a.email);
          default:
            return 0;
        }
      });

    // Paginación
    const totalPaginas = Math.ceil(estudiantesFiltrados.length / elementosPorPagina);
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const estudiantesPaginados = estudiantesFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

    // Estadísticas
    const estudiantesActivos = estudiantes.filter(est => tieneCompraVerificada(est.id));
    const estudiantesInactivos = estudiantes.filter(est => !tieneCompraVerificada(est.id));

    // Función para exportar datos a PDF mejorado
    const exportarDatos = () => {
      try {
        // Determinar qué estudiantes exportar
        const estudiantesParaExportar = estudiantesSeleccionados.length > 0 
          ? estudiantes.filter(est => estudiantesSeleccionados.includes(est.id))
          : estudiantesFiltrados;

        // Verificar que hay datos para exportar
        if (!estudiantesParaExportar || estudiantesParaExportar.length === 0) {
          const mensaje = estudiantesSeleccionados.length > 0 
            ? 'No hay estudiantes seleccionados para exportar'
            : 'No hay estudiantes para exportar';
          alert(mensaje);
          return;
        }

        console.log('Iniciando generación de PDF mejorado...');
        const doc = new jsPDF();

        // Configurar fuente para caracteres especiales
        doc.setFont('helvetica');

        // ENCABEZADO PROFESIONAL
        // Fondo azul para el encabezado
        doc.setFillColor(45, 170, 225);
        doc.rect(0, 0, 210, 50, 'F');

        // Título principal
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        const tituloReporte = estudiantesSeleccionados.length > 0 
          ? 'REPORTE DE ESTUDIANTES SELECCIONADOS'
          : 'REPORTE DE ESTUDIANTES';
        doc.text(tituloReporte, 20, 25);

        // Subtítulo
        doc.setFontSize(12);
        doc.text('Sistema de Gestión Académica', 20, 35);

        // Fecha de generación
        doc.setFontSize(10);
        const fechaActual = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Generado: ${fechaActual}`, 20, 43);

        // SECCIÓN DE ESTADÍSTICAS
        let yPosition = 65;
        doc.setTextColor(33, 37, 41);
        doc.setFontSize(16);
        doc.text('RESUMEN EJECUTIVO', 20, yPosition);

        // Línea decorativa
        doc.setDrawColor(45, 170, 225);
        doc.setLineWidth(2);
        doc.line(20, yPosition + 3, 190, yPosition + 3);

        yPosition += 15;

        // Estadísticas en cajas basadas en los estudiantes a exportar
        const estudiantesActivosCount = estudiantesParaExportar.filter(est => tieneCompraVerificada(est.id)).length;
        const estudiantesInactivosCount = estudiantesParaExportar.filter(est => !tieneCompraVerificada(est.id)).length;

        // Caja 1: Total en reporte
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition, 40, 25, 'F');
        doc.setDrawColor(233, 236, 239);
        doc.rect(20, yPosition, 40, 25);
        doc.setFontSize(20);
        doc.setTextColor(45, 170, 225);
        doc.text(String(estudiantesParaExportar.length), 35, yPosition + 15);
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        const etiquetaTotal = estudiantesSeleccionados.length > 0 ? 'SELECCIONADOS' : 'EN REPORTE';
        doc.text(etiquetaTotal, 25, yPosition + 22);

        // Caja 2: Activos
        doc.setFillColor(248, 249, 250);
        doc.rect(70, yPosition, 40, 25, 'F');
        doc.rect(70, yPosition, 40, 25);
        doc.setFontSize(20);
        doc.setTextColor(76, 175, 80);
        doc.text(String(estudiantesActivosCount), 85, yPosition + 15);
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text('ACTIVOS', 85, yPosition + 22);

        // Caja 3: Inactivos
        doc.setFillColor(248, 249, 250);
        doc.rect(120, yPosition, 40, 25, 'F');
        doc.rect(120, yPosition, 40, 25);
        doc.setFontSize(20);
        doc.setTextColor(244, 67, 54);
        doc.text(String(estudiantesInactivosCount), 135, yPosition + 15);
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text('INACTIVOS', 135, yPosition + 22);

        // Caja 4: Porcentaje de activos
        doc.setFillColor(248, 249, 250);
        doc.rect(170, yPosition, 40, 25, 'F');
        doc.rect(170, yPosition, 40, 25);
        doc.setFontSize(20);
        doc.setTextColor(45, 170, 225);
        const porcentajeActivos = estudiantesParaExportar.length > 0 
          ? Math.round((estudiantesActivosCount / estudiantesParaExportar.length) * 100)
          : 0;
        doc.text(`${porcentajeActivos}%`, 185, yPosition + 15);
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text('% ACTIVOS', 180, yPosition + 22);

        yPosition += 40;

        // Información de filtros si aplica
        if (filtroEstado !== 'todos' || busqueda !== '') {
          doc.setFillColor(255, 243, 205);
          doc.rect(20, yPosition, 170, 12, 'F');
          doc.setDrawColor(255, 193, 7);
          doc.rect(20, yPosition, 170, 12);

          doc.setFontSize(9);
          doc.setTextColor(133, 100, 4);
          let filtrosTexto = 'FILTROS APLICADOS: ';
          if (filtroEstado !== 'todos') {
            filtrosTexto += `Estado: ${filtroEstado.toUpperCase()}`;
          }
          if (busqueda !== '') {
            filtrosTexto += `${filtroEstado !== 'todos' ? ' | ' : ''}Búsqueda: "${busqueda}"`;
          }
          doc.text(filtrosTexto, 25, yPosition + 7);
          yPosition += 20;
        }

        // TABLA DE DATOS
        doc.setFontSize(14);
        doc.setTextColor(33, 37, 41);
        doc.text('DETALLE DE ESTUDIANTES', 20, yPosition);

        // Línea decorativa
        doc.setDrawColor(45, 170, 225);
        doc.setLineWidth(1);
        doc.line(20, yPosition + 3, 190, yPosition + 3);

        yPosition += 10;

        // Preparar datos para la tabla
        console.log('Preparando datos para la tabla...');
        const datosTabla = estudiantesParaExportar.map(estudiante => {
          const esActivo = tieneCompraVerificada(estudiante.id);
          const cursosEstudiante = obtenerCursosEstudiante(estudiante.id);

          return [
            `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim(),
            estudiante.email || 'No disponible',
            estudiante.dni || 'N/A',
            estudiante.date_joined ? new Date(estudiante.date_joined).toLocaleDateString('es-ES') : 'N/A',
            esActivo ? 'ACTIVO' : 'INACTIVO',
            cursosEstudiante.length > 0 ? `${cursosEstudiante.length} curso(s)` : 'Sin cursos'
          ];
        });

        console.log('Datos preparados:', datosTabla.length, 'filas');

        // Configurar la tabla con diseño mejorado
        autoTable(doc, {
          startY: yPosition,
          head: [['NOMBRE', 'EMAIL', 'DNI', 'REGISTRO', 'ESTADO', 'CURSOS']],
          body: datosTabla,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 4,
            halign: 'left',
            valign: 'middle',
            textColor: [33, 37, 41],
            lineColor: [233, 236, 239],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [45, 170, 225],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 5,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          rowStyles: {
            fillColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' }, // Nombre
            1: { cellWidth: 40 }, // Email
            2: { cellWidth: 18, halign: 'center' }, // DNI
            3: { cellWidth: 22, halign: 'center' }, // Fecha
            4: { 
              cellWidth: 20,
              halign: 'center',
              fontStyle: 'bold'
            }, // Estado
            5: { cellWidth: 25, halign: 'center' } // Cursos
          },
          didParseCell: function(data) {
            // Colorear la columna de estado
            if (data.column.index === 4) {
              if (data.cell.text[0] === 'ACTIVO') {
                data.cell.styles.textColor = [76, 175, 80];
                data.cell.styles.fillColor = [232, 245, 233];
              } else {
                data.cell.styles.textColor = [244, 67, 54];
                data.cell.styles.fillColor = [255, 235, 238];
              }
            }
            // Resaltar nombres
            if (data.column.index === 0) {
              data.cell.styles.textColor = [45, 170, 225];
            }
          },
          margin: { top: 10, right: 15, bottom: 30, left: 15 },
          pageBreak: 'auto',
          showHead: 'everyPage'
        });

        // PIE DE PÁGINA PROFESIONAL
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          const pageHeight = doc.internal.pageSize.height;

          // Fondo del pie
          doc.setFillColor(248, 249, 250);
          doc.rect(0, pageHeight - 25, 210, 25, 'F');

          // Línea superior
          doc.setDrawColor(45, 170, 225);
          doc.setLineWidth(1);
          doc.line(15, pageHeight - 25, 195, pageHeight - 25);

          // Información del pie
          doc.setFontSize(8);
          doc.setTextColor(108, 117, 125);
          doc.text('Sistema de Gestión de Estudiantes | Reporte Generado Automáticamente', 15, pageHeight - 15);
          doc.text(`Página ${i} de ${totalPages}`, 165, pageHeight - 15);
          doc.text(`Total de registros: ${estudiantesFiltrados.length}`, 15, pageHeight - 8);
          doc.text(new Date().toLocaleString('es-ES'), 165, pageHeight - 8);
        }

        console.log('PDF generado exitosamente');

        // Descargar el PDF
        const tipoReporte = estudiantesSeleccionados.length > 0 ? 'Seleccionados' : 'Todos';
        const nombreArchivo = `Reporte_Estudiantes_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('Descargando archivo:', nombreArchivo);

        doc.save(nombreArchivo);

        // Mostrar mensaje de éxito
        const mensaje = estudiantesSeleccionados.length > 0 
          ? `PDF generado con ${estudiantesParaExportar.length} estudiantes seleccionados: ${nombreArchivo}`
          : `PDF profesional generado: ${nombreArchivo}`;
        alert(mensaje);

      } catch (error) {
        console.error('Error al generar PDF:', error);
        alert(`Error al generar el PDF: ${error.message}`);
      }
    };

    // Función para mostrar detalles del estudiante
    const mostrarDetalles = (estudiante) => {
      const cursosEstudiante = obtenerCursosEstudiante(estudiante.id);
      const inscripcionesEstudiante = inscripciones.filter(ins => ins.usuario === estudiante.id);

      setEstudianteDetalle({
        ...estudiante,
        cursos: cursosEstudiante,
        inscripciones: inscripcionesEstudiante,
        esActivo: tieneCompraVerificada(estudiante.id)
      });
      setMostrarModal(true);
    };

    const cerrarModal = () => {
      setMostrarModal(false);
      setEstudianteDetalle(null);
    };
    const exportarDatosAlternativo = () => {
      try {
        // Determinar qué estudiantes exportar
        const estudiantesParaExportar = estudiantesSeleccionados.length > 0 
          ? estudiantes.filter(est => estudiantesSeleccionados.includes(est.id))
          : estudiantesFiltrados;

        // Verificar que hay datos para exportar
        if (!estudiantesParaExportar || estudiantesParaExportar.length === 0) {
          const mensaje = estudiantesSeleccionados.length > 0 
            ? 'No hay estudiantes seleccionados para exportar'
            : 'No hay estudiantes para exportar';
          alert(mensaje);
          return;
        }

        const datos = estudiantesParaExportar.map(estudiante => {
          const esActivo = tieneCompraVerificada(estudiante.id);
          const cursosEstudiante = obtenerCursosEstudiante(estudiante.id);

          return [
            `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim(),
            estudiante.email || 'No disponible',
            estudiante.dni || 'No disponible',
            estudiante.date_joined ? new Date(estudiante.date_joined).toLocaleDateString('es-ES') : 'No disponible',
            esActivo ? 'Activo' : 'Inactivo',
            cursosEstudiante.length > 0 ? cursosEstudiante.join(' | ') : 'Sin cursos'
          ];
        });

        // Usar punto y coma como delimitador (mejor para Excel en español)
        const delimiter = ';';
        const headers = ['Nombre', 'Email', 'DNI', 'Fecha de Registro', 'Estado', 'Cursos Comprados'];

        // Función para escapar celdas correctamente
        const escaparCelda = (valor) => {
          if (valor == null) return '';
          let valorStr = String(valor).trim();

          // Escapar comillas dobles duplicándolas
          valorStr = valorStr.replace(/"/g, '""');

          // Encerrar en comillas si contiene delimitador, comillas o saltos de línea
          if (valorStr.includes(delimiter) || valorStr.includes('"') || valorStr.includes('\n') || valorStr.includes('\r')) {
            valorStr = `"${valorStr}"`;
          }

          return valorStr;
        };

        // Construir el CSV línea por línea
        let csvContent = headers.map(escaparCelda).join(delimiter) + '\r\n';

        datos.forEach(fila => {
          csvContent += fila.map(escaparCelda).join(delimiter) + '\r\n';
        });

        // Agregar BOM para UTF-8 y crear blob
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const tipoReporte = estudiantesSeleccionados.length > 0 ? 'seleccionados' : 'todos';
        a.download = `estudiantes_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Mostrar mensaje de éxito
        const mensaje = estudiantesSeleccionados.length > 0 
          ? `CSV generado con ${estudiantesParaExportar.length} estudiantes seleccionados`
          : `CSV generado correctamente con ${estudiantesParaExportar.length} estudiantes`;
        alert(mensaje);

        alert('Archivo CSV descargado exitosamente');
      } catch (error) {
        console.error('Error al exportar CSV:', error);
        alert('Error al exportar los datos');
      }
    };
    const toggleSeleccionEstudiante = (estudianteId) => {
      setEstudiantesSeleccionados(prev => 
        prev.includes(estudianteId) 
          ? prev.filter(id => id !== estudianteId)
          : [...prev, estudianteId]
      );
    };

    const seleccionarTodos = () => {
      if (estudiantesSeleccionados.length === estudiantesPaginados.length) {
        setEstudiantesSeleccionados([]);
      } else {
        setEstudiantesSeleccionados(estudiantesPaginados.map(est => est.id));
      }
    };

    return (
      <div className="tab-content">
        <div className="estudiantes-header">
          <h2>Gestión de Estudiantes</h2>
          <div className="header-actions">
            <div className="export-buttons">
              <button className="btn-export btn-pdf" onClick={exportarDatos}>
                {estudiantesSeleccionados.length > 0 
                  ? `Exportar PDF (${estudiantesSeleccionados.length} seleccionados)`
                  : `Exportar PDF (${estudiantesFiltrados.length} estudiantes)`
                }
              </button>
              <button className="btn-export btn-csv" onClick={exportarDatosAlternativo}>
                {estudiantesSeleccionados.length > 0 
                  ? `Exportar CSV (${estudiantesSeleccionados.length} seleccionados)`
                  : `Exportar CSV (${estudiantesFiltrados.length} estudiantes)`
                }
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">{estudiantes.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number active">{estudiantesActivos.length}</span>
            <span className="stat-label">Activos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number inactive">{estudiantesInactivos.length}</span>
            <span className="stat-label">Inactivos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{estudiantesFiltrados.length}</span>
            <span className="stat-label">Filtrados</span>
          </div>
        </div>

        {/* Controles de filtrado y búsqueda */}
        <div className="controls-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="search-input"
            />
          </div>

          <div className="filters-container">
            <select 
              value={filtroEstado} 
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </select>

            <select 
              value={ordenPor} 
              onChange={(e) => setOrdenPor(e.target.value)}
              className="filter-select"
            >
              <option value="fecha_desc">Más Recientes</option>
              <option value="fecha_asc">Más Antiguos</option>
              <option value="nombre_asc">Nombre A-Z</option>
              <option value="nombre_desc">Nombre Z-A</option>
              <option value="email_asc">Email A-Z</option>
              <option value="email_desc">Email Z-A</option>
            </select>
          </div>
        </div>

        {/* Acciones por lotes */}
        {estudiantesSeleccionados.length > 0 && (
          <div className="batch-actions">
            <span className="selection-count">
              {estudiantesSeleccionados.length} estudiante(s) seleccionado(s)
            </span>
            <button 
              className="btn-clear-selection"
              onClick={() => setEstudiantesSeleccionados([])}
            >
              Limpiar Selección
            </button>
          </div>
        )}

        {/* Vista de tabla */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={estudiantesSeleccionados.length === estudiantesPaginados.length && estudiantesPaginados.length > 0}
                    onChange={seleccionarTodos}
                  />
                </th>
                <th>Nombre</th>
                <th>Email</th>
                <th>DNI</th>
                <th>Fecha de Registro</th>
                <th>Estado</th>
                <th>Cursos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantesPaginados.map(estudiante => {
                const esActivo = tieneCompraVerificada(estudiante.id);
                const cursosEstudiante = obtenerCursosEstudiante(estudiante.id);

                return (
                  <tr key={estudiante.id} className={estudiantesSeleccionados.includes(estudiante.id) ? 'selected' : ''}>
                    <td>
                            {/* El log debe ir dentro del map donde 'pregunta' está definido */}
                            {/* ...existing code... */}
                      <input
                        type="checkbox"
                        checked={estudiantesSeleccionados.includes(estudiante.id)}
                        onChange={() => toggleSeleccionEstudiante(estudiante.id)}
                      />
                    </td>
                    <td className="student-name">
                      <div className="name-container">
                        <span className="full-name">{estudiante.nombres} {estudiante.apellidos}</span>
                        <span className="student-id">ID: {estudiante.id}</span>
                      </div>
                    </td>
                    <td>{estudiante.email}</td>
                    <td>{estudiante.dni}</td>
                    <td>{new Date(estudiante.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${esActivo ? 'active' : 'inactive'}`}>
                        {esActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="courses-info">
                        {cursosEstudiante.length > 0 ? (
                          <span className="courses-count">{cursosEstudiante.length} curso(s)</span>
                        ) : (
                          <span className="no-cursos">Sin cursos</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn-details"
                        onClick={() => mostrarDetalles(estudiante)}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
            >
              Anterior
            </button>

            <div className="pagination-info">
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
              <span>
                ({estudiantesFiltrados.length} estudiantes total)
              </span>
            </div>

            <button 
              className="pagination-btn"
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal de detalles del estudiante */}
        {mostrarModal && estudianteDetalle && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Detalles del Estudiante</h3>
                <button className="modal-close" onClick={cerrarModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="student-info-grid">
                  <div className="info-section">
                    <h4>Información Personal</h4>
                    <div className="info-item">
                      <span className="label">Nombre Completo:</span>
                      <span className="value">{estudianteDetalle.nombres} {estudianteDetalle.apellidos}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Email:</span>
                      <span className="value">{estudianteDetalle.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">DNI:</span>
                      <span className="value">{estudianteDetalle.dni || 'No disponible'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">ID:</span>
                      <span className="value">{estudianteDetalle.id}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Fecha de Registro:</span>
                      <span className="value">{new Date(estudianteDetalle.date_joined).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Estado:</span>
                      <span className={`status-badge ${estudianteDetalle.esActivo ? 'active' : 'inactive'}`}>
                        {estudianteDetalle.esActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="courses-section-modal">
                    <h4>Trayectoria de Cursos</h4>
                    {estudianteDetalle.inscripciones.length > 0 ? (
                      <div className="inscripciones-list">
                        {estudianteDetalle.inscripciones.map((inscripcion, index) => (
                          <div key={index} className="inscripcion-item">
                            <div className="curso-nombre">
                              {inscripcion.curso_info?.nombre || 'Curso no disponible'}
                            </div>
                            <div className="inscripcion-detalles">
                              <span className="fecha">
                                Inscrito: {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                              </span>
                              <span className={`estado-pago ${inscripcion.estado_pago}`}>
                                {inscripcion.estado_pago}
                              </span>
                              <span className="metodo-pago">
                                {inscripcion.metodo_pago}
                              </span>
                            </div>
                            {inscripcion.fecha_inicio && (
                              <div className="fechas-importantes">
                                <span>Inicio: {new Date(inscripcion.fecha_inicio).toLocaleDateString()}</span>
                                {inscripcion.fecha_examen_teorico && (
                                  <span>Examen Teórico: {new Date(inscripcion.fecha_examen_teorico).toLocaleDateString()}</span>
                                )}
                                {inscripcion.fecha_examen_practico && (
                                  <span>Examen Práctico: {new Date(inscripcion.fecha_examen_practico).toLocaleDateString()}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-inscripciones">Este estudiante no tiene inscripciones registradas.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInscripciones = () => (
    <div className="tab-content">
      <h2>Gestión de Inscripciones y Pagos</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Curso</th>
              <th>Método de Pago</th>
              <th>Comprobante</th>
              <th>Estado de Pago</th>
              <th>Fecha de Inscripción</th>
              <th>Fecha Inicio</th>
              <th>Fecha Examen Teórico</th>
              <th>Fecha Examen Práctico</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map(inscripcion => (
              <tr key={inscripcion.id}>
                <td>
                  {inscripcion.usuario_info ? 
                    `${inscripcion.usuario_info.nombres} ${inscripcion.usuario_info.apellidos}` : 
                    'Usuario no encontrado'
                  }
                </td>
                <td>
                  {inscripcion.curso_info ? 
                    inscripcion.curso_info.nombre : 
                    'Curso no encontrado'
                  }
                </td>
                <td>
                  <span className={`payment-method ${inscripcion.metodo_pago?.toLowerCase()}`}>
                    {inscripcion.metodo_pago}
                  </span>
                </td>
                <td>
                  {inscripcion.comprobante_pago ? (
                    <div className="comprobante-container">
                      <button 
                        className="btn-view-comprobante"
                        onClick={() => verComprobante(inscripcion.comprobante_pago)}
                        title="Ver comprobante"
                      >
                        Ver Comprobante
                      </button>
                      <div className="comprobante-preview">
                        {/* Mostrar preview del tipo de archivo */}
                        {getFileIcon(inscripcion.comprobante_pago)}
                      </div>
                    </div>
                  ) : (
                    <span className="no-comprobante">Sin comprobante</span>
                  )}
                </td>
                <td>
                  <select 
                    value={inscripcion.estado_pago} 
                    onChange={(e) => actualizarEstadoPago(inscripcion.id, e.target.value)}
                    className={`status-select ${inscripcion.estado_pago}`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="verificado">Verificado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </td>
                <td>{new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}</td>
                <td>
                  <input
                    type="date"
                    value={inscripcion.fecha_inicio || ''}
                    onChange={(e) => actualizarFechaInscripcion(inscripcion.id, 'fecha_inicio', e.target.value)}
                    className="inline-date-edit"
                    placeholder="Sin definir"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={inscripcion.fecha_examen_teorico || ''}
                    onChange={(e) => actualizarFechaInscripcion(inscripcion.id, 'fecha_examen_teorico', e.target.value)}
                    className="inline-date-edit"
                    placeholder="Sin definir"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={inscripcion.fecha_examen_practico || ''}
                    onChange={(e) => actualizarFechaInscripcion(inscripcion.id, 'fecha_examen_practico', e.target.value)}
                    className="inline-date-edit"
                    placeholder="Sin definir"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCursos = () => (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestión de Cursos</h2>
        <button 
          onClick={() => setMostrarFormularioCurso(!mostrarFormularioCurso)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {mostrarFormularioCurso ? 'Cancelar' : '+ Agregar Nuevo Curso'}
        </button>
      </div>

      {/* Formulario para crear nuevo curso */}
      {mostrarFormularioCurso && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3>Crear Nuevo Curso</h3>
          <form onSubmit={handleCrearCurso}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre del Curso *</label>
                <input
                  type="text"
                  value={nuevoCurso.nombre}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Curso de Soldadura Básica"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Instructor</label>
                <input
                  type="text"
                  value={nuevoCurso.instructor}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, instructor: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Nombre del instructor"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ubicación</label>
                <input
                  type="text"
                  value={nuevoCurso.ubicacion}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, ubicacion: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Aula 201, Centro de Capacitación"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Horario</label>
                <input
                  type="text"
                  value={nuevoCurso.horario}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, horario: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: Lunes a Viernes 9:00-17:00"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCurso.precio}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: 1500"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duración (semanas)</label>
                <input
                  type="number"
                  value={nuevoCurso.duracion_semanas}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, duracion_semanas: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Ej: 12"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nivel</label>
                <select
                  value={nuevoCurso.nivel}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nivel: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Estado</label>
                <select
                  value={nuevoCurso.activo}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, activo: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción *</label>
              <textarea
                value={nuevoCurso.descripcion}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                required
                rows="3"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
                placeholder="Descripción detallada del curso..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Crear Curso
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormularioCurso(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre del Curso</th>
              <th>Instructor</th>
              <th>Ubicación</th>
              <th>Horario</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map(curso => (
              <tr key={curso.id}>
                <td>
                  <input 
                    type="text" 
                    value={curso.nombre || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'nombre', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'nombre', e.target.value)}
                    className="inline-edit"
                    style={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.instructor || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'instructor', e.target.value)}
                    className="inline-edit"
                    placeholder="Nombre del instructor"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.ubicacion || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'ubicacion', e.target.value)}
                    className="inline-edit"
                    placeholder="Ubicación del curso"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={curso.horario || ''} 
                    onChange={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    onBlur={(e) => actualizarCurso(curso.id, 'horario', e.target.value)}
                    className="inline-edit"
                    placeholder="Ej: Lun-Vie 9:00-17:00"
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '5px', color: '#666' }}>$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={curso.precio || ''} 
                      onChange={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value) || 0)}
                      onBlur={(e) => actualizarCurso(curso.id, 'precio', parseFloat(e.target.value) || 0)}
                      className="inline-edit"
                      placeholder="0.00"
                      style={{ textAlign: 'right' }}
                    />
                  </div>
                </td>
                <td>
                  <select 
                    value={curso.activo} 
                    onChange={(e) => actualizarCurso(curso.id, 'activo', e.target.value === 'true')}
                    className="status-select"
                    style={{ 
                      color: curso.activo ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}
                  >
                    <option value={true}>Activo</option>
                    <option value={false}>Inactivo</option>
                  </select>
                </td>

                {/* ...el bloque correcto de acciones ya está abajo... */}
                <td>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button 
      className="btn-edit"
      onClick={() => {
        const nuevaDescripcion = prompt(`Editar descripción del curso "${curso.nombre}":`, curso.descripcion || '');
        if (nuevaDescripcion !== null) {
          actualizarCurso(curso.id, 'descripcion', nuevaDescripcion);
        }
      }}
      title="Editar descripción"
    >
      Desc
    </button>
    <button
      className="btn-edit"
      onClick={() => eliminarCurso(curso.id)}
      title="Eliminar curso"
      style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: '6px', padding: '7px 14px', fontWeight: 'bold', fontSize: '15px', border: 'none' }}
    >
      🗑️ Eliminar
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExamenes = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Gestión de Exámenes</h2>


      {/* Tabs para examenes */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setSubActiveTab('examenes')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: subActiveTab === 'examenes' ? '#007bff' : '#f8f9fa',
            color: subActiveTab === 'examenes' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Exámenes
        </button>
        <button
          onClick={() => setSubActiveTab('preguntas')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: subActiveTab === 'preguntas' ? '#007bff' : '#f8f9fa',
            color: subActiveTab === 'preguntas' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Preguntas
        </button>
      </div>

      {/* Contenido según sub-tab */}
      {subActiveTab === 'examenes' && (
        <div>
          {[...new Map(examenes.map(curso => [curso.id, curso])).values()].map(curso => (
                      <div key={`curso-${curso.id}-${curso.nombre}`} style={{ 
                        marginBottom: '30px', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '10px',
                        backgroundColor: '#f8f9fa'
                      }}>
              {/* Header del curso */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>📚 {curso.nombre}</h3>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                    {curso.instructor} •  {curso.estudiantes_inscritos} estudiantes inscritos
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{curso.total_examenes}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Exámenes</div>
                </div>
              </div>

              {/* Tabla de exámenes */}
              <table className="admin-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th>Título del Examen</th>
                    <th>Tipo</th>
                    <th>Duración</th>
                    <th>Preguntas</th>
                    <th>Intentos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {curso.examenes.map(examen => (
                    <tr key={examen.id}>
                      <td>
                        <div>
                          {examen.titulo}
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                            {examen.descripcion ? examen.descripcion.substring(0, 50) + '...' : 'Sin descripción'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: examen.tipo === 'teorico' ? '#d1ecf1' : '#d4edda',
                          color: examen.tipo === 'teorico' ? '#0c5460' : '#155724'
                        }}>
                          {examen.tipo === 'teorico' ? ' Teórico' : ' Práctico'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min={1}
                        value={examen.duracion_minutos}
                        onChange={e => actualizarExamen(examen.id, 'duracion_minutos', parseInt(e.target.value))}
                        style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                        title="Duración del examen en minutos"
                      /> min
                    </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min={1}
                          max={examen.total_preguntas_creadas}
                          value={examen.numero_preguntas}
                          onChange={e => actualizarExamen(examen.id, 'numero_preguntas', parseInt(e.target.value))}
                          style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                          title={`Cantidad de preguntas aleatorias a seleccionar (máximo ${examen.total_preguntas_creadas})`}
                        />
                        <div style={{ fontSize: '11px', color: '#6c757d' }}>
                          de {examen.total_preguntas_creadas} disponibles
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>1 intento</td>
                      <td>
                        <select 
                          value={examen.activo} 
                          onChange={(e) => actualizarExamen(examen.id, 'activo', e.target.value === 'true')}
                          className="status-select"
                          style={{ color: examen.activo ? '#28a745' : '#dc3545', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          <option value={true}>✅ Activo</option>
                          <option value={false}>❌ Inactivo</option>
                        </select>
                      </td>
                      <td>
                        {examen.tipo === 'practico' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Botón para abrir la tarjeta/modal de estudiantes */}
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  // Mostrar todos los estudiantes inscritos y pagados, con su estado actual
                                  const estudiantesInscritosPagados = inscripciones
                                    .filter(
                                      insc =>
                                        insc.curso_info?.id === curso.id &&
                                        insc.estado_pago === 'verificado'
                                    )
                                    .map(insc => ({
                                      id: insc.usuario_info?.id,
                                      nombre: `${insc.usuario_info?.nombres || ''} ${insc.usuario_info?.apellidos || ''}`.trim(),
                                      aceptado_admin: insc.aceptado_admin
                                    }));
                                  setModalListaEstudiantes({ abierto: true, estudiantes: estudiantesInscritosPagados, cursoId: curso.id });
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  backgroundColor: '#17a2b8',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title="Ver lista de estudiantes para aprobar/desaprobar"
                              >
                                Lista de Estudiantes
                              </button>
                            </div>
                            {/* Evaluaciones individuales */}
                            {examen.examenes_practicos_pendientes && examen.examenes_practicos_pendientes.length > 0 ? (
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {examen.examenes_practicos_pendientes.map(intento => (
                                  <div key={intento.id} style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
                                    <button
                                      onClick={() => evaluarExamenPractico(intento.id, 'aprobado')}
                                      style={{
                                        padding: '3px 6px',
                                        fontSize: '10px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                      }}
                                      title={`Aprobar a ${intento.usuario_nombre}`}
                                    >
                                     Aprobar
                                    </button>
                                    <button
                                      onClick={() => evaluarExamenPractico(intento.id, 'desaprobado')}
                                      style={{
                                        padding: '3px 6px',
                                        fontSize: '10px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                      }}
                                      title={`Desaprobar a ${intento.usuario_nombre}`}
                                    >
                                       Desaprobar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#6c757d', textAlign: 'center' }}>
                                Sin evaluaciones pendientes
                              </div>
                            )}
                          </div>
                        ) : (
                          // Para exámenes teóricos: botones normales
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>

                          
                            <button
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios-examenes/`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    // Filtrar solo los estudiantes que tengan intentos en este examen
                                    const estudiantesConNotas = data.usuarios
                                      .map(usuario => {
                                        const intentos = usuario.intentos_examenes.filter(
                                          intento => intento.examen.id === examen.id && intento.examen.tipo === 'teorico'
                                        );
                                        if (intentos.length > 0) {
                                          return {
                                            id: usuario.id,
                                            nombre: `${usuario.nombres} ${usuario.apellidos}`.trim(),
                                            email: usuario.email,
                                            dni: usuario.dni,
                                            intentos: intentos
                                          };
                                        }
                                        return null;
                                      })
                                      .filter(e => e !== null);
                                    setModalListaEstudiantes({ abierto: true, estudiantes: estudiantesConNotas, examenId: examen.id });
                                  } else {
                                    setError('Error al obtener la lista de estudiantes y notas');
                                  }
                                } catch (error) {
                                  setError('Error al obtener la lista de estudiantes y notas');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              title="Ver lista de estudiantes y notas de este examen"
                            >
                              Notas de Estudiantes
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {examenes.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              color: '#6c757d' 
            }}>
              <h3> No hay cursos disponibles</h3>
              <p>Primero crea cursos en la pestaña "Gestión de Cursos" para poder agregar exámenes.</p>
            </div>
          )}
        </div>
      )}

      {subActiveTab === 'preguntas' && (
        <div className="table-container">
          <div style={{ marginBottom: '18px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Curso:</label>
            <select value={cursoPreguntasId} onChange={e => setCursoPreguntasId(e.target.value)}>
              <option value="">Selecciona un curso</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.id}>{curso.nombre}</option>
              ))}
            </select>
            <button
              style={{ marginLeft: '20px', padding: '8px 18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setMostrarModalPregunta(true)}
              disabled={!cursoPreguntasId}
            >
              + Añadir Pregunta
            </button>
          </div>
          {cursoPreguntasId ? (
            <>
              <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#007bff' }}>
                Preguntas para este curso: {
                  (() => {
                    const idNum = Number(cursoPreguntasId);
                    const curso = examenes.find(c => c.curso_id === idNum || c.id === idNum);
                    if (!curso || !curso.examenes) {
                      return 0;
                    }
                    const examenTeorico = curso.examenes.find(ex => ex.tipo === 'teorico');
                    if (!examenTeorico) {
                      return 0;
                    }
                    const preguntasTeoricas = preguntas.filter(p => p.examen_id === examenTeorico.id);
                    return preguntasTeoricas.length;
                  })()
                }
              </div>
              {/* Tabla de preguntas para el curso seleccionado */}
              <div style={{ marginTop: '10px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Texto</th>
                      <th>Tipo</th>
                      <th>Imagen</th>
                      <th>Opciones</th>
                      <th>Respuesta Correcta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const idNum = Number(cursoPreguntasId);
                      const curso = examenes.find(c => c.curso_id === idNum || c.id === idNum);
                      if (!curso || !curso.examenes) return null;
                      const examenTeorico = curso.examenes.find(ex => ex.tipo === 'teorico');
                      if (!examenTeorico) return null;
                      const preguntasTeoricas = preguntas.filter(p => p.examen_id === examenTeorico.id);
                      if (preguntasTeoricas.length === 0) {
                        return (
                          <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6c757d' }}>No hay preguntas registradas para este curso.</td></tr>
                        );
                      }
                      return preguntasTeoricas.map(pregunta => {
                        console.debug('Pregunta debug:', pregunta);
                        return (
                          <tr key={pregunta.id}>
                            <td>{pregunta.id}</td>
                            <td style={{ maxWidth: '320px' }}>{pregunta.texto}</td>
                            <td>{pregunta.tipo}</td>
                            <td>
                              {pregunta.imagen_pregunta ? (
                                <a href={getImagenUrl(pregunta.imagen_pregunta)} target="_blank" rel="noopener noreferrer">
                                  <img src={getImagenUrl(pregunta.imagen_pregunta)} alt="Imagen" style={{ maxWidth: '80px', maxHeight: '60px', borderRadius: '6px', cursor: 'pointer' }} />
                                </a>
                              ) : 'Sin imagen'}
                            </td>
                            <td>
                              {pregunta.opciones && pregunta.opciones.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {pregunta.opciones.map((opcion, idx) => (
                                    <li key={opcion.id} style={{ color: opcion.es_correcta ? '#28a745' : '#333', fontWeight: opcion.es_correcta ? 'bold' : 'normal' }}>
                                      {String.fromCharCode(65 + idx)}. {opcion.texto_opcion}
                                    </li>
                                  ))}
                                </ul>
                              ) : '-'}
                            </td>
                            <td>
                              {pregunta.tipo === 'verdadero_falso' ? (
                                <>
                                  <span style={{ fontWeight: 'bold', color: '#007bff', marginRight: '8px' }}>
                                    {typeof pregunta.respuesta_correcta === 'string' && pregunta.respuesta_correcta !== ''
                                      ? (pregunta.respuesta_correcta === 'verdadero' ? 'Verdadero' : 'Falso')
                                      : <span style={{ color: '#6c757d' }}>Sin respuesta</span>}
                                  </span>
                                  <select value={pregunta.respuesta_correcta || ''} onChange={e => actualizarPregunta(pregunta.id, 'respuesta_correcta', e.target.value)}>
                                    <option value="">Sin respuesta</option>
                                    <option value="verdadero">Verdadero</option>
                                    <option value="falso">Falso</option>
                                  </select>
                                </>
                              ) : pregunta.tipo === 'texto' ? (
                                <>
                                  <span style={{ fontWeight: 'bold', color: '#007bff', marginRight: '8px' }}>
                                    {pregunta.respuesta_esperada && pregunta.respuesta_esperada.trim() !== ''
                                      ? pregunta.respuesta_esperada
                                      : <span style={{ color: '#6c757d' }}>Sin respuesta</span>}
                                  </span>
                                  <input
                                    type="text"
                                    value={pregunta.respuesta_esperada || ''}
                                    onChange={e => actualizarPregunta(pregunta.id, 'respuesta_esperada', e.target.value)}
                                    className="inline-edit"
                                    style={{ width: '90%' }}
                                    placeholder="Respuesta esperada"
                                  />
                                </>
                              ) : (
                                pregunta.opciones && pregunta.opciones.length > 0 ? (
                                  (() => {
                                    const correcta = pregunta.opciones.find(o => o.es_correcta);
                                    return correcta ? String.fromCharCode(65 + pregunta.opciones.indexOf(correcta)) : '-';
                                  })()
                                ) : (pregunta.respuesta_correcta || '-')
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn-edit"
                                onClick={() => eliminarPregunta(pregunta.id)}
                                title="Eliminar pregunta"
                                style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: '6px', padding: '7px 14px', fontWeight: 'bold', fontSize: '15px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '10px', color: '#6c757d' }}>
              Selecciona un curso para ver las preguntas.
            </div>
          )}
  {/* Modal para añadir pregunta (fuera del bloque de preguntas) */}
  {mostrarModalPregunta && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMostrarModalPregunta(false)}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '32px', minWidth: '350px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '18px', textAlign: 'center', color: '#007bff' }}>Añadir Pregunta</h2>
            {errorPregunta && <div style={{ color: 'red', marginBottom: '10px' }}>{errorPregunta}</div>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setErrorPregunta('');
              // Ya no es necesario buscar el examen teórico, el backend lo crea automáticamente si no existe
              // Validaciones básicas
              if (!nuevaPregunta.texto.trim()) {
                setErrorPregunta('El texto de la pregunta es obligatorio.');
                return;
              }
              // Crear pregunta en backend
              try {
                const token = localStorage.getItem('authToken');
                const formData = new FormData();
                formData.append('texto', nuevaPregunta.texto);
                formData.append('tipo', nuevaPregunta.tipo || 'multiple');
                formData.append('opcion_a', nuevaPregunta.opcion_a || '');
                formData.append('opcion_b', nuevaPregunta.opcion_b || '');
                formData.append('opcion_c', nuevaPregunta.opcion_c || '');
                formData.append('opcion_d', nuevaPregunta.opcion_d || '');
                formData.append('respuesta_correcta', nuevaPregunta.respuesta_correcta || '');
                formData.append('curso_id', cursoPreguntasId);
                if (nuevaPregunta.imagen_pregunta) {
                  formData.append('imagen_pregunta', nuevaPregunta.imagen_pregunta);
                }
                if (nuevaPregunta.respuesta_esperada) {
                  formData.append('respuesta_esperada', nuevaPregunta.respuesta_esperada);
                }
                const res = await fetch(`${API_BASE_URL}/admin/preguntas/`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Token ${token}`,
                  },
                  body: formData
                });
                if (!res.ok) {
                  let data = {};
                  try { data = await res.json(); } catch { }
                  setErrorPregunta(data.error || 'Error al crear la pregunta');
                  return;
                }
                setMostrarModalPregunta(false);
                setNuevaPregunta({ texto: '', opcion_a: '', opcion_b: '', opcion_c: '', opcion_d: '', respuesta_correcta: 'A', examen_id: '' });
                setErrorPregunta('');
                // Recargar preguntas
                loadData();
              } catch (err) {
                setErrorPregunta('Error de conexión al crear la pregunta');
              }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>Tipo de pregunta:</label>
                <select
                  value={nuevaPregunta.tipo || 'multiple'}
                  onChange={e => setNuevaPregunta({ ...nuevaPregunta, tipo: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }}
                  required
                >
                  <option value="multiple">Opción Múltiple</option>
                  <option value="verdadero_falso">Verdadero/Falso</option>
                  <option value="texto">Respuesta Escrita</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>Imagen de la pregunta (opcional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    setNuevaPregunta({ ...nuevaPregunta, imagen_pregunta: file });
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }}
                />
                {nuevaPregunta.imagen_pregunta && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={URL.createObjectURL(nuevaPregunta.imagen_pregunta)} alt="Vista previa" style={{ maxWidth: '180px', maxHeight: '120px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>Texto de la pregunta:</label>
                <textarea value={nuevaPregunta.texto} onChange={e => setNuevaPregunta({ ...nuevaPregunta, texto: e.target.value })} required style={{ width: '100%', minHeight: '60px', resize: 'vertical' }} />
              </div>
              {/* Campos dinámicos según tipo */}
              {nuevaPregunta.tipo === 'multiple' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label>Opción A:</label>
                      <input type="text" value={nuevaPregunta.opcion_a} onChange={e => setNuevaPregunta({ ...nuevaPregunta, opcion_a: e.target.value })} />
                    </div>
                    <div>
                      <label>Opción B:</label>
                      <input type="text" value={nuevaPregunta.opcion_b} onChange={e => setNuevaPregunta({ ...nuevaPregunta, opcion_b: e.target.value })} />
                    </div>
                    <div>
                      <label>Opción C:</label>
                      <input type="text" value={nuevaPregunta.opcion_c} onChange={e => setNuevaPregunta({ ...nuevaPregunta, opcion_c: e.target.value })} />
                    </div>
                    <div>
                      <label>Opción D:</label>
                      <input type="text" value={nuevaPregunta.opcion_d} onChange={e => setNuevaPregunta({ ...nuevaPregunta, opcion_d: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label>Respuesta Correcta:</label>
                    <select value={nuevaPregunta.respuesta_correcta} onChange={e => setNuevaPregunta({ ...nuevaPregunta, respuesta_correcta: e.target.value })}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </>
              )}
              {nuevaPregunta.tipo === 'verdadero_falso' && (
                <div style={{ marginBottom: '12px' }}>
                  <label>Respuesta Correcta:</label>
                  <select value={nuevaPregunta.respuesta_correcta} onChange={e => setNuevaPregunta({ ...nuevaPregunta, respuesta_correcta: e.target.value })}>
                    <option value="verdadero">Verdadero</option>
                    <option value="falso">Falso</option>
                  </select>
                </div>
              )}
              {nuevaPregunta.tipo === 'texto' && (
                <div style={{ marginBottom: '12px' }}>
                  <label>Respuesta esperada (opcional):</label>
                  <input type="text" value={nuevaPregunta.respuesta_esperada || ''} onChange={e => setNuevaPregunta({ ...nuevaPregunta, respuesta_esperada: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="submit" style={{ padding: '10px 22px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Crear Pregunta</button>
                <button type="button" style={{ padding: '10px 22px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setMostrarModalPregunta(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '18px', alignItems: 'flex-start' }}>
              {preguntas.filter(p => {
                const examen = examenes.find(ex => ex.id === p.examen_id);
                return examen && examen.curso_id === cursoPreguntasId;
              }).map(pregunta => (
                <div key={pregunta.id} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
                  padding: '24px',
                  minWidth: '320px',
                  maxWidth: '400px',
                  marginBottom: '10px',
                  position: 'relative',
                  border: '1px solid #e3e3e3'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '10px', color: '#007bff' }}>
                    <span style={{ marginRight: '8px', color: '#6c757d', fontSize: '15px' }}>#{pregunta.id}</span>
                    <textarea 
                      value={pregunta.texto || ''} 
                      onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                      className="inline-edit"
                      style={{ minHeight: '48px', resize: 'vertical', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #e3e3e3', padding: '8px' }}
                    />
                  </div>
                  {pregunta.imagen_pregunta && (
                    <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                      <img src={pregunta.imagen_pregunta} alt="Imagen" style={{ maxWidth: '180px', maxHeight: '120px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    </div>
                  )}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>Opciones:</div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {pregunta.opciones.map((opcion, idx) => (
                        <li key={opcion.id} style={{
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          background: opcion.es_correcta ? '#eafaf1' : '#f8f9fa',
                          borderRadius: '7px',
                          padding: '6px 10px',
                          border: opcion.es_correcta ? '1.5px solid #28a745' : '1px solid #e3e3e3'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: opcion.es_correcta ? '#28a745' : '#007bff',
                            fontSize: '16px',
                            marginRight: '10px'
                          }}>{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opcion.texto_opcion}
                            onChange={e => actualizarOpcion(pregunta.id, opcion.id, e.target.value)}
                            className="inline-edit"
                            style={{ width: '100%', fontSize: '15px', borderRadius: '6px', border: '1px solid #e3e3e3', padding: '6px' }}
                          />
                          {opcion.es_correcta && <span style={{ marginLeft: '10px', color: '#28a745', fontWeight: 'bold', fontSize: '15px' }}>✔</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#007bff', fontSize: '15px' }}>
                      Respuesta Correcta: {
                        (() => {
                          const correcta = pregunta.opciones.find(o => o.es_correcta);
                          return correcta ? String.fromCharCode(65 + pregunta.opciones.indexOf(correcta)) : '-';
                        })()
                      }
                    </div>
                    <div>
                      <button 
                        className="btn-edit"
                        onClick={() => {/* Aquí iría la lógica para editar pregunta */}}
                        title="Editar pregunta"
                        style={{ backgroundColor: '#ffc107', color: '#333', marginRight: '8px', borderRadius: '6px', padding: '7px 14px', fontWeight: 'bold', fontSize: '15px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-edit"
                        onClick={() => eliminarPregunta(pregunta.id)}
                        title="Eliminar pregunta"
                        style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: '6px', padding: '7px 14px', fontWeight: 'bold', fontSize: '15px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

        </div>
      )}

      {subActiveTab === 'intentos' && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Fecha Inicio</th>
                <th>Fecha Finalización</th>
                <th>Puntaje</th>
                <th>Porcentaje</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {intentosExamen.map(intento => (
                <tr key={intento.id}>
                  <td>{intento.usuario_nombre || 'Usuario desconocido'}</td>
                  <td>{intento.examen_titulo || 'Examen desconocido'}</td>
                  <td>{new Date(intento.fecha_inicio).toLocaleString()}</td>
                  <td>{intento.fecha_finalizacion ? new Date(intento.fecha_finalizacion).toLocaleString() : 'En progreso'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {intento.puntaje !== null ? intento.puntaje : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {intento.puntaje !== null ? `${Math.round((intento.puntaje / (intento.preguntas_seleccionadas?.length || 1)) * 100)}%` : '-'}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: intento.estado === 'completado' ? '#d4edda' : '#fff3cd',
                      color: intento.estado === 'completado' ? '#155724' : '#856404'
                    }}>
                      {intento.estado === 'completado' ? '✅ Completado' : '⏳ En progreso'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view"
                      onClick={() => verDetalleIntento(intento.id)}
                      title="Ver detalle"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="logo-section">
          <img src="/LogoPagina.png" alt="CertifiKT" className="admin-logo" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          <h1>Panel de Administración</h1>
        </div>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'estudiantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('estudiantes')}
        >
          Estudiantes
        </button>
        <button 
          className={`tab-button ${activeTab === 'inscripciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('inscripciones')}
        >
          Inscripciones y Pagos
        </button>
        <button 
          className={`tab-button ${activeTab === 'cursos' ? 'active' : ''}`}
          onClick={() => setActiveTab('cursos')}
        >
          Gestión de Cursos
        </button>
        <button 
          className={`tab-button ${activeTab === 'examenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('examenes')}
        >
          Exámenes
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'estudiantes' && renderEstudiantes()}
        {activeTab === 'inscripciones' && renderInscripciones()}
        {activeTab === 'cursos' && renderCursos()}
        {activeTab === 'examenes' && renderExamenes()}
      </div>

      {/* Modal/tarjeta de estudiantes */}
      {modalListaEstudiantes.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalListaEstudiantes({ ...modalListaEstudiantes, abierto: false })}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '32px', minWidth: '350px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '18px', textAlign: 'center', color: '#007bff' }}>Estudiantes inscritos</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {modalListaEstudiantes.estudiantes.map(est => (
                modalListaEstudiantes.examenId
                  ? (
                    // Modal de notas de estudiantes (examen teórico)
                    <li key={est.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{est.nombre}</span>
                      <span style={{ fontSize: '14px', color: '#007bff', marginTop: '4px' }}>
                        Nota: {est.puntaje_obtenido !== undefined && est.puntaje_obtenido !== null ? est.puntaje_obtenido : 'Sin nota'}
                      </span>
                    </li>
                  )
                  : (
                    // Modal de lista de estudiantes (examen práctico)
                    <li key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{est.nombre}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Estado actual de aprobación */}
                        {typeof est.aceptado_admin !== 'undefined' && (
                          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
                            {est.aceptado_admin === true && <span style={{ color: 'green' }}>Aprobado</span>}
                            {est.aceptado_admin === false && <span style={{ color: 'red' }}>Desaprobado</span>}
                            {(est.aceptado_admin === null || est.aceptado_admin === undefined) && <span style={{ color: 'orange' }}>Pendiente</span>}
                          </span>
                        )}
                        <button
                          style={{ padding: '6px 14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={async () => {
                            await aprobarEstudiante(est.id, modalListaEstudiantes.cursoId);
                            setModalListaEstudiantes(prev => ({
                              ...prev,
                              estudiantes: prev.estudiantes.map(e =>
                                e.id === est.id ? { ...e, aceptado_admin: true } : e
                              )
                            }));
                          }}
                        >Aprobar</button>
                        <button
                          style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={async () => {
                            await desaprobarEstudiante(est.id, modalListaEstudiantes.cursoId);
                            setModalListaEstudiantes(prev => ({
                              ...prev,
                              estudiantes: prev.estudiantes.map(e =>
                                e.id === est.id ? { ...e, aceptado_admin: false } : e
                              )
                            }));
                          }}
                        >Desaprobar</button>
                      </div>
                    </li>
                  )
              ))}
            </ul>
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button style={{ padding: '8px 22px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setModalListaEstudiantes({ ...modalListaEstudiantes, abierto: false })}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;