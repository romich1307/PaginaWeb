from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Curso, Inscripcion, Examen, 
    Pregunta, OpcionRespuesta, IntentarExamen
)

# Register your models here.

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'nombres', 'apellidos', 'dni', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'nombres', 'apellidos', 'dni']
    ordering = ['-date_joined']
    
    # Personalizar los fieldsets para mostrar nuestros campos
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('nombres', 'apellidos', 'email', 'dni')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'nombres', 'apellidos', 'dni', 'password1', 'password2'),
        }),
    )


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nivel', 'precio', 'duracion_semanas', 'instructor', 'activo', 'fecha_creacion']
    list_filter = ['nivel', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'instructor']
    list_editable = ['activo', 'precio']
    ordering = ['nombre']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'nivel', 'precio', 'duracion_semanas')
        }),
        ('Contenido', {
            'fields': ('contenido', 'imagen_url')
        }),
        ('Información del Curso', {
            'fields': ('ubicacion', 'horario', 'instructor')
        }),
        ('Control', {
            'fields': ('activo',)
        }),
    )


@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'curso', 'estado_pago', 'metodo_pago', 'progreso', 'certificado_otorgado', 'fecha_inscripcion']
    list_filter = ['estado_pago', 'metodo_pago', 'certificado_otorgado', 'fecha_inscripcion']
    search_fields = ['usuario__nombres', 'usuario__apellidos', 'usuario__email', 'curso__nombre']
    list_editable = ['estado_pago', 'progreso']
    ordering = ['-fecha_inscripcion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'curso')
        }),
        ('Pago', {
            'fields': ('metodo_pago', 'comprobante_pago', 'estado_pago', 'comentarios')
        }),
        ('Fechas del Curso', {
            'fields': ('fecha_inicio', 'fecha_examen_teorico', 'fecha_examen_practico')
        }),
        ('Progreso', {
            'fields': ('progreso', 'certificado_otorgado', 'fecha_certificado')
        }),
        ('Verificación', {
            'fields': ('fecha_verificacion', 'verificado_por')
        }),
    )
    
    readonly_fields = ['fecha_inscripcion']


@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'curso', 'tipo', 'cantidad_preguntas', 'tiempo_limite', 'puntaje_minimo', 'activo']
    list_filter = ['tipo', 'activo', 'curso']
    search_fields = ['nombre', 'curso__nombre']
    list_editable = ['activo', 'tiempo_limite', 'puntaje_minimo']
    ordering = ['curso', 'tipo']


class OpcionRespuestaInline(admin.TabularInline):
    model = OpcionRespuesta
    extra = 4
    max_num = 6


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ['texto_pregunta_corto', 'examen', 'tipo', 'puntaje', 'orden']
    list_filter = ['tipo', 'examen__curso', 'examen__tipo']
    search_fields = ['texto_pregunta', 'examen__nombre']
    ordering = ['examen', 'orden']
    inlines = [OpcionRespuestaInline]
    
    def texto_pregunta_corto(self, obj):
        return obj.texto_pregunta[:50] + "..." if len(obj.texto_pregunta) > 50 else obj.texto_pregunta
    texto_pregunta_corto.short_description = "Pregunta"


@admin.register(IntentarExamen)
class IntentarExamenAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'examen', 'estado', 'puntaje_obtenido', 'aprobado', 'fecha_inicio', 'fecha_finalizacion']
    list_filter = ['estado', 'aprobado', 'examen__curso', 'fecha_inicio']
    search_fields = ['usuario__nombres', 'usuario__apellidos', 'examen__nombre']
    ordering = ['-fecha_inicio']
    
    readonly_fields = ['fecha_inicio', 'tiempo_utilizado', 'respuestas']
