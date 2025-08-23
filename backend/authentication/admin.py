from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Curso, Inscripcion, Examen, ExamenUsuario,
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
        if not hasattr(obj, 'texto_pregunta') or obj.texto_pregunta is None:
            return "(Sin texto)"
        return obj.texto_pregunta[:50] + "..." if len(obj.texto_pregunta) > 50 else obj.texto_pregunta
    texto_pregunta_corto.short_description = "Pregunta"

    def save_model(self, request, obj, form, change):
        if obj.tipo == 'verdadero_falso':
            opciones = obj.opcionrespuesta_set.all()
            textos = [o.texto_opcion.lower() for o in opciones]
            correctas = [o for o in opciones if o.es_correcta]
            if 'verdadero' not in textos or 'falso' not in textos:
                from django.core.exceptions import ValidationError
                raise ValidationError("Las preguntas de Verdadero/Falso deben tener las opciones 'Verdadero' y 'Falso'.")
            if len(correctas) != 1:
                from django.core.exceptions import ValidationError
                raise ValidationError("Debe haber exactamente una opción marcada como correcta en preguntas de Verdadero/Falso.")
        super().save_model(request, obj, form, change)


@admin.register(ExamenUsuario)
class ExamenUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'examen', 'fecha_programada', 'hora_inicio', 'estado', 'resultado', 'nota_final']
    list_filter = ['estado', 'resultado', 'fecha_programada', 'examen__curso']
    search_fields = ['usuario__nombres', 'usuario__apellidos', 'examen__nombre']
    ordering = ['fecha_programada', 'hora_inicio']
    
    fieldsets = (
        ('Asignación', {
            'fields': ('usuario', 'examen')
        }),
        ('Programación', {
            'fields': ('fecha_programada', 'hora_inicio', 'duracion_minutos')
        }),
        ('Estado y Resultados', {
            'fields': ('estado', 'resultado', 'nota_final')
        }),
        ('Fechas de Control', {
            'fields': ('fecha_asignacion', 'fecha_realizacion'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['fecha_asignacion', 'fecha_realizacion']
    
    # Acciones simplificadas
    actions = ['marcar_aprobado', 'marcar_desaprobado']
    
    def marcar_aprobado(self, request, queryset):
        """Marca los exámenes seleccionados como aprobados"""
        updated = queryset.update(resultado='aprobado')
        self.message_user(request, f'{updated} exámenes marcados como aprobados.')
    marcar_aprobado.short_description = "Marcar como Aprobado"
    
    def marcar_desaprobado(self, request, queryset):
        """Marca los exámenes seleccionados como desaprobados"""
        updated = queryset.update(resultado='desaprobado')
        self.message_user(request, f'{updated} exámenes marcados como desaprobados.')
    marcar_desaprobado.short_description = "Marcar como Desaprobado"


@admin.register(IntentarExamen)
class IntentarExamenAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'examen', 'get_tipo_examen', 'estado', 'puntaje_obtenido', 'aprobado', 'fecha_inicio', 'fecha_finalizacion']
    list_filter = ['estado', 'aprobado', 'examen__tipo', 'examen__curso', 'fecha_inicio']
    search_fields = ['usuario__nombres', 'usuario__apellidos', 'examen__nombre']
    ordering = ['-fecha_inicio']
    list_editable = ['aprobado']  # Permite editar directamente desde la lista
    
    readonly_fields = ['fecha_inicio', 'tiempo_utilizado', 'respuestas']
    
    def get_tipo_examen(self, obj):
        if not hasattr(obj, 'examen') or obj.examen is None:
            return "(Sin examen)"
        tipo = getattr(obj.examen, 'tipo', None)
        if tipo == 'teorico':
            return "Teórico"
        elif tipo == 'practico':
            return "Práctico"
        return "(Tipo desconocido)"
    get_tipo_examen.short_description = 'Tipo de Examen'
    
    # Filtrar por tipo de examen
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('usuario', 'examen', 'examen__curso')
    
    # Organizar los campos en el formulario de edición
    fieldsets = (
        ('Información del Intento', {
            'fields': ('usuario', 'examen', 'estado', 'fecha_inicio', 'fecha_finalizacion')
        }),
        ('Resultados', {
            'fields': ('puntaje_obtenido', 'aprobado', 'tiempo_utilizado')
        }),
        ('Detalles', {
            'fields': ('respuestas',),
            'classes': ('collapse',)
        }),
    )
    
    # Acciones personalizadas
    actions = ['marcar_como_aprobado', 'marcar_como_desaprobado']
    
    def marcar_como_aprobado(self, request, queryset):
        updated = queryset.update(aprobado=True, estado='completado')
        self.message_user(request, f'{updated} intentos marcados como aprobados.')
    marcar_como_aprobado.short_description = "Marcar como aprobado"
    
    def marcar_como_desaprobado(self, request, queryset):
        updated = queryset.update(aprobado=False, estado='completado')
        self.message_user(request, f'{updated} intentos marcados como desaprobados.')
    marcar_como_desaprobado.short_description = "Marcar como desaprobado"


# Personalización adicional para el admin
class ExamenesPracticosFilter(admin.SimpleListFilter):
    title = 'Exámenes Prácticos Pendientes'
    parameter_name = 'practicos_pendientes'
    
    def lookups(self, request, model_admin):
        return (
            ('pendientes', 'Prácticos Pendientes de Calificación'),
            ('practicos', 'Todos los Exámenes Prácticos'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'pendientes':
            return queryset.filter(
                examen__tipo='practico',
                estado='iniciado',
                aprobado=False
            )
        if self.value() == 'practicos':
            return queryset.filter(examen__tipo='practico')
        return queryset


# Agregar el filtro personalizado al admin de IntentarExamen
IntentarExamenAdmin.list_filter = [
    'estado', 'aprobado', 'examen__tipo', 'examen__curso', 'fecha_inicio', ExamenesPracticosFilter
]
