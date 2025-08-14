from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.user_profile, name='user_profile'),
    
    # Public URLs
    path('cursos/', views.cursos_publicos, name='cursos_publicos'),
    path('inscripciones/', views.crear_inscripcion, name='crear_inscripcion'),
    path('mis-inscripciones/', views.mis_inscripciones, name='mis_inscripciones'),
    
    # Examen URLs
    path('cursos/<int:curso_id>/examenes/', views.examenes_disponibles, name='examenes_disponibles'),
    path('mis-examenes-programados/', views.mis_examenes_programados, name='mis_examenes_programados'),
    path('cursos/<int:curso_id>/examenes-lista/', views.obtener_examenes_curso, name='obtener_examenes_curso'),
    path('examenes/<int:examen_id>/iniciar/', views.iniciar_examen, name='iniciar_examen'),
    path('intentos/<int:intento_id>/preguntas/', views.obtener_preguntas_examen, name='obtener_preguntas_examen'),
    path('intentos/<int:intento_id>/enviar/', views.enviar_respuestas_examen, name='enviar_respuestas_examen'),
    
    # Nuevas URLs para exámenes asignados
    path('mis-examenes-asignados/', views.obtener_examenes_asignados, name='obtener_examenes_asignados'),
    path('examenes-asignados/<int:examen_asignado_id>/iniciar/', views.iniciar_examen_asignado, name='iniciar_examen_asignado'),
    
    # Admin panel URLs
    path('admin/is-admin/', views.is_admin_user, name='is_admin_user'),
    path('admin/inscripciones/', views.admin_inscripciones, name='admin_inscripciones'),
    path('admin/inscripciones/<int:pk>/', views.admin_inscripcion_detail, name='admin_inscripcion_detail'),
    path('admin/cursos/', views.admin_cursos, name='admin_cursos'),
    path('admin/cursos/<int:pk>/', views.admin_curso_detail, name='admin_curso_detail'),
    path('admin/estudiantes/', views.admin_estudiantes, name='admin_estudiantes'),
    
    # Admin exam URLs
    path('admin/examenes/', views.admin_examenes, name='admin_examenes'),
    path('admin/examenes/<int:examen_id>/', views.admin_examen_detalle, name='admin_examen_detalle'),
    path('admin/preguntas/', views.admin_preguntas, name='admin_preguntas'),
    path('admin/preguntas/<int:pregunta_id>/', views.admin_pregunta_detalle, name='admin_pregunta_detalle'),
    path('admin/intentos-examen/', views.admin_intentos_examen, name='admin_intentos_examen'),
    
    # Admin practical exam URLs
    path('admin/examenes-practicos/pendientes/', views.admin_examenes_practicos_pendientes, name='admin_examenes_practicos_pendientes'),
    path('admin/examenes-practicos/programar/', views.programar_examen_practico, name='programar_examen_practico'),
    path('admin/examenes-practicos/activar/', views.activar_examen_para_curso, name='activar_examen_para_curso'),
    path('admin/examen-practico/resultado/<int:intento_id>/', views.admin_examen_practico_resultado, name='admin_examen_practico_resultado'),
    
    # New admin URLs
    path('admin/crear-intento-practico/', views.crear_intento_examen_practico, name='crear_intento_examen_practico'),
    path('admin/usuarios-examenes/', views.lista_usuarios_examenes, name='lista_usuarios_examenes'),
]
