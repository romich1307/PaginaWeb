from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.

class CustomUser(AbstractUser):
    # Campos principales para el login y registro
    username = models.CharField(max_length=50, unique=True, verbose_name="Nombre de Usuario")
    email = models.EmailField(unique=True, verbose_name="Email")
    nombres = models.CharField(max_length=100, verbose_name="Nombres")
    apellidos = models.CharField(max_length=100, verbose_name="Apellidos")
    dni = models.CharField(max_length=8, unique=True, verbose_name="DNI")
    password = models.CharField(max_length=128, verbose_name="Contraseña")
    
    # Campos adicionales de Django que son útiles
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Registro")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    # Configuración para usar email como campo de login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nombres', 'apellidos', 'dni']
    
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        db_table = "usuarios"
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.email})"
    
    def get_full_name(self):
        return f"{self.nombres} {self.apellidos}"


class Curso(models.Model):
    NIVEL_CHOICES = [
        ('principiante', 'Principiante'),
        ('intermedio', 'Intermedio'),
        ('avanzado', 'Avanzado'),
    ]
    
    nombre = models.CharField(max_length=200, verbose_name="Nombre del Curso")
    descripcion = models.TextField(verbose_name="Descripción")
    precio = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Precio")
    duracion_semanas = models.PositiveIntegerField(verbose_name="Duración en Semanas")
    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES, verbose_name="Nivel")
    imagen_url = models.URLField(blank=True, null=True, verbose_name="URL de Imagen")
    contenido = models.JSONField(default=list, verbose_name="Contenido del Curso")
    
    # Información adicional para cursos presenciales
    ubicacion = models.CharField(max_length=200, default="Centro de Capacitación TechPro", verbose_name="Ubicación")
    horario = models.CharField(max_length=100, default="Lunes a Viernes 7:00 PM - 9:00 PM", verbose_name="Horario")
    instructor = models.CharField(max_length=100, default="Instructor Especializado", verbose_name="Instructor")
    
    # Control administrativo
    activo = models.BooleanField(default=True, verbose_name="Curso Activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    
    class Meta:
        verbose_name = "Curso"
        verbose_name_plural = "Cursos"
        db_table = "cursos"
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} - {self.nivel}"


class Inscripcion(models.Model):
    ESTADO_PAGO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('verificado', 'Verificado'),
        ('rechazado', 'Rechazado'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('transferencia', 'Transferencia Bancaria'),
        ('deposito', 'Depósito en Efectivo'),
    ]
    
    # Relaciones
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name="Usuario")
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, verbose_name="Curso")
    
    # Información de pago
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, verbose_name="Método de Pago")
    comprobante_pago = models.FileField(upload_to='comprobantes/', blank=True, null=True, verbose_name="Comprobante de Pago")
    comentarios = models.TextField(blank=True, null=True, verbose_name="Comentarios")
    
    # Estado y fechas
    estado_pago = models.CharField(max_length=20, choices=ESTADO_PAGO_CHOICES, default='pendiente', verbose_name="Estado del Pago")
    fecha_inscripcion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Inscripción")
    fecha_verificacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Verificación")
    verificado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, 
                                     related_name='verificaciones', verbose_name="Verificado por")
    
    # Fechas del curso
    fecha_inicio = models.DateField(blank=True, null=True, verbose_name="Fecha de Inicio")
    fecha_examen_teorico = models.DateField(blank=True, null=True, verbose_name="Fecha Examen Teórico")
    fecha_examen_practico = models.DateField(blank=True, null=True, verbose_name="Fecha Examen Práctico")
    
    # Progreso del estudiante
    progreso = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], 
                                         verbose_name="Progreso (%)")
    certificado_otorgado = models.BooleanField(default=False, verbose_name="Certificado Otorgado")
    fecha_certificado = models.DateTimeField(blank=True, null=True, verbose_name="Fecha del Certificado")
    
    class Meta:
        verbose_name = "Inscripción"
        verbose_name_plural = "Inscripciones"
        db_table = "inscripciones"
        unique_together = ['usuario', 'curso']  # Un usuario no puede inscribirse dos veces al mismo curso
        ordering = ['-fecha_inscripcion']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.curso.nombre} ({self.estado_pago})"


class Examen(models.Model):
    TIPO_EXAMEN_CHOICES = [
        ('teorico', 'Teórico'),
        ('practico', 'Práctico'),
    ]
    
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='examenes', verbose_name="Curso")
    nombre = models.CharField(max_length=200, verbose_name="Nombre del Examen")
    tipo = models.CharField(max_length=20, choices=TIPO_EXAMEN_CHOICES, verbose_name="Tipo de Examen")
    descripcion = models.TextField(verbose_name="Descripción del Examen")
    
    # Configuración del examen
    cantidad_preguntas = models.PositiveIntegerField(verbose_name="Cantidad de Preguntas")
    tiempo_limite = models.PositiveIntegerField(verbose_name="Tiempo Límite (minutos)")
    puntaje_minimo = models.DecimalField(max_digits=5, decimal_places=2, default=70.00, 
                                       verbose_name="Puntaje Mínimo para Aprobar (%)")
    
    # Control
    activo = models.BooleanField(default=True, verbose_name="Examen Activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    
    class Meta:
        verbose_name = "Examen"
        verbose_name_plural = "Exámenes"
        db_table = "examenes"
        ordering = ['curso', 'tipo']
    
    def __str__(self):
        return f"{self.curso.nombre} - {self.nombre} ({self.tipo})"


class Pregunta(models.Model):
    TIPO_PREGUNTA_CHOICES = [
        ('multiple', 'Opción Múltiple'),
        ('verdadero_falso', 'Verdadero/Falso'),
        ('texto', 'Respuesta de Texto'),
    ]
    
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='preguntas', verbose_name="Examen")
    texto_pregunta = models.TextField(verbose_name="Texto de la Pregunta")
    tipo = models.CharField(max_length=20, choices=TIPO_PREGUNTA_CHOICES, verbose_name="Tipo de Pregunta")
    puntaje = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, verbose_name="Puntaje")
    orden = models.PositiveIntegerField(verbose_name="Orden en el Examen")
    
    # Para preguntas con imagen
    imagen_pregunta = models.ImageField(upload_to='preguntas/', blank=True, null=True, verbose_name="Imagen de la Pregunta")
    
    class Meta:
        verbose_name = "Pregunta"
        verbose_name_plural = "Preguntas"
        db_table = "preguntas"
        ordering = ['examen', 'orden']
        unique_together = ['examen', 'orden']
    
    def __str__(self):
        return f"{self.examen.nombre} - Pregunta {self.orden}"


class OpcionRespuesta(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='opciones', verbose_name="Pregunta")
    texto_opcion = models.TextField(verbose_name="Texto de la Opción")
    es_correcta = models.BooleanField(default=False, verbose_name="Es Correcta")
    orden = models.PositiveIntegerField(verbose_name="Orden de la Opción")
    
    class Meta:
        verbose_name = "Opción de Respuesta"
        verbose_name_plural = "Opciones de Respuesta"
        db_table = "opciones_respuesta"
        ordering = ['pregunta', 'orden']
        unique_together = ['pregunta', 'orden']
    
    def __str__(self):
        return f"{self.pregunta} - Opción {self.orden}"


class IntentarExamen(models.Model):
    ESTADO_CHOICES = [
        ('iniciado', 'Iniciado'),
        ('completado', 'Completado'),
        ('abandonado', 'Abandonado'),
    ]
    
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name="Usuario")
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, verbose_name="Examen")
    
    # Control de tiempo
    fecha_inicio = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Inicio")
    fecha_finalizacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Finalización")
    tiempo_utilizado = models.PositiveIntegerField(blank=True, null=True, verbose_name="Tiempo Utilizado (minutos)")
    
    # Resultados
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='iniciado', verbose_name="Estado")
    puntaje_obtenido = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="Puntaje Obtenido")
    aprobado = models.BooleanField(default=False, verbose_name="Aprobado")
    
    # Respuestas (JSON para flexibilidad)
    respuestas = models.JSONField(default=dict, verbose_name="Respuestas del Usuario")
    
    class Meta:
        verbose_name = "Intento de Examen"
        verbose_name_plural = "Intentos de Examen"
        db_table = "intentos_examen"
        ordering = ['-fecha_inicio']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.examen.nombre} ({self.estado})"
