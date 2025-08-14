from django.db import models
from .user import CustomUser
from .curso import Curso


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


class ExamenUsuario(models.Model):
    """Modelo para asociar usuarios específicos con exámenes y programar su horario"""
    ESTADO_CHOICES = [
        ('programado', 'Programado'),
        ('activo', 'Activo'),
        ('completado', 'Completado'),
        ('expirado', 'Expirado'),
    ]
    
    RESULTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('desaprobado', 'Desaprobado'),
    ]
    
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name="Usuario")
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, verbose_name="Examen")
    
    # Programación del examen
    fecha_programada = models.DateField(verbose_name="Fecha Programada")
    hora_inicio = models.TimeField(verbose_name="Hora de Inicio")
    duracion_minutos = models.PositiveIntegerField(verbose_name="Duración (minutos)")
    
    # Estado y resultados
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='programado', verbose_name="Estado")
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES, default='pendiente', verbose_name="Resultado")
    nota_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Nota Final")
    
    # Fechas de control
    fecha_asignacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Asignación")
    fecha_realizacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Realización")
    
    class Meta:
        verbose_name = "Examen Asignado"
        verbose_name_plural = "Exámenes Asignados"
        db_table = "examenes_usuarios"
        unique_together = ['usuario', 'examen']
        ordering = ['fecha_programada', 'hora_inicio']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.examen.nombre} ({self.estado})"


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
    
    # Control de pregunta activa
    activo = models.BooleanField(default=True, verbose_name="Pregunta Activa")
    
    # Para preguntas con imagen
    imagen_pregunta = models.URLField(blank=True, null=True, verbose_name="URL de Imagen de la Pregunta")
    
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
    
    # Preguntas seleccionadas para este intento (IDs de preguntas)
    preguntas_seleccionadas = models.JSONField(default=list, verbose_name="Preguntas Seleccionadas")
    
    # Campos específicos para exámenes prácticos
    RESULTADO_PRACTICO_CHOICES = [
        ('aprobado', 'Aprobado'),
        ('desaprobado', 'Desaprobado'),
        ('pendiente', 'Pendiente'),
    ]
    resultado_practico = models.CharField(
        max_length=20, 
        choices=RESULTADO_PRACTICO_CHOICES, 
        blank=True, 
        null=True,
        verbose_name="Resultado Práctico"
    )
    observaciones_practico = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Observaciones del Examen Práctico"
    )
    evaluador = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Nombre del Evaluador"
    )
    fecha_evaluacion_practica = models.DateTimeField(
        blank=True, 
        null=True, 
        verbose_name="Fecha de Evaluación Práctica"
    )
    fecha_programada_practica = models.DateField(
        blank=True,
        null=True,
        verbose_name="Fecha Programada para Examen Práctico"
    )
    hora_programada_practica = models.TimeField(
        blank=True,
        null=True,
        verbose_name="Hora Programada para Examen Práctico"
    )
    duracion_programada = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Duración Programada (minutos)"
    )
    
    class Meta:
        verbose_name = "Intento de Examen"
        verbose_name_plural = "Intentos de Examen"
        db_table = "intentos_examen"
        ordering = ['-fecha_inicio']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.examen.nombre} ({self.estado})"
    
    def seleccionar_preguntas_aleatorias(self):
        """Selecciona aleatoriamente las preguntas para este intento"""
        import random
        
        # Obtener todas las preguntas del examen
        todas_las_preguntas = list(self.examen.preguntas.values_list('id', flat=True))
        
        # Determinar cuántas preguntas seleccionar (máximo 20)
        cantidad_disponible = len(todas_las_preguntas)
        cantidad_a_seleccionar = min(20, self.examen.cantidad_preguntas, cantidad_disponible)
        
        if cantidad_disponible == 0:
            self.preguntas_seleccionadas = []
        else:
            # Seleccionar aleatoriamente
            preguntas_elegidas = random.sample(todas_las_preguntas, cantidad_a_seleccionar)
            self.preguntas_seleccionadas = preguntas_elegidas
        
        self.save()
        return self.preguntas_seleccionadas
    
    def obtener_preguntas_del_intento(self):
        """Obtiene las preguntas específicas para este intento en orden aleatorio"""
        if not self.preguntas_seleccionadas:
            return self.examen.preguntas.none()
        
        # Obtener las preguntas seleccionadas y mantener el orden aleatorio
        from django.db import models
        preguntas = Pregunta.objects.filter(id__in=self.preguntas_seleccionadas)
        
        # Crear un diccionario para ordenar según el orden de selección
        order_dict = {id: index for index, id in enumerate(self.preguntas_seleccionadas)}
        
        return sorted(preguntas, key=lambda p: order_dict.get(p.id, 999))
