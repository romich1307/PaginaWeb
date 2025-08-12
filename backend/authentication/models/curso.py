from django.db import models


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
