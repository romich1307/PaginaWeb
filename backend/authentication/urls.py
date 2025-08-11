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
    
    # Admin panel URLs
    path('admin/is-admin/', views.is_admin_user, name='is_admin_user'),
    path('admin/inscripciones/', views.admin_inscripciones, name='admin_inscripciones'),
    path('admin/inscripciones/<int:pk>/', views.admin_inscripcion_detail, name='admin_inscripcion_detail'),
    path('admin/cursos/', views.admin_cursos, name='admin_cursos'),
    path('admin/cursos/<int:pk>/', views.admin_curso_detail, name='admin_curso_detail'),
    path('admin/estudiantes/', views.admin_estudiantes, name='admin_estudiantes'),
]
