from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .user import CustomUser
from .curso import Curso


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
    verificado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='verificaciones', verbose_name="Verificado por")
    
    # Fechas del curso
    fecha_inicio = models.DateField(blank=True, null=True, verbose_name="Fecha de Inicio")
    fecha_examen_teorico = models.DateField(blank=True, null=True, verbose_name="Fecha Examen Teórico")
    fecha_examen_practico = models.DateField(blank=True, null=True, verbose_name="Fecha Examen Práctico")
    
    # Progreso del estudiante
    progreso = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="Progreso (%)")
    certificado_otorgado = models.BooleanField(default=False, verbose_name="Certificado Otorgado")
    fecha_certificado = models.DateTimeField(blank=True, null=True, verbose_name="Fecha del Certificado")

    # Estado de aprobación por el admin
    aceptado_admin = models.BooleanField(null=True, blank=True, default=None, verbose_name="Aprobado por el Admin")
    
    class Meta:
        verbose_name = "Inscripción"
        verbose_name_plural = "Inscripciones"
        db_table = "inscripciones"
        unique_together = ['usuario', 'curso']  # Un usuario no puede inscribirse dos veces al mismo curso
        ordering = ['-fecha_inscripcion']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.curso.nombre} ({self.estado_pago})"
