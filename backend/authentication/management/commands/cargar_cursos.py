from django.core.management.base import BaseCommand
from authentication.models import Curso, Examen, Pregunta, OpcionRespuesta

class Command(BaseCommand):
    help = 'Carga los cursos iniciales en la base de datos'

    def handle(self, *args, **options):
        self.stdout.write('Cargando cursos en la base de datos...')
        
        # Datos de los cursos
        cursos_data = [
            {
                "nombre": "Líquidos Penetrantes I",
                "descripcion": "Curso básico de inspección por líquidos penetrantes. Aprende los fundamentos de este método de ensayo no destructivo para la detección de discontinuidades superficiales en materiales.",
                "precio": 450.00,
                "duracion_semanas": 8,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop",
                "contenido": ["Fundamentos NDT", "Tipos de penetrantes", "Procedimientos de aplicación", "Interpretación de indicaciones", "Normativas aplicables"],
                "instructor": "Ing. Carlos Mendoza - NDT Level III"
            },
            {
                "nombre": "Líquidos Penetrantes II",
                "descripcion": "Curso avanzado de líquidos penetrantes. Profundiza en técnicas especializadas, evaluación de defectos complejos y certificación de nivel II según normas internacionales.",
                "precio": 550.00,
                "duracion_semanas": 10,
                "nivel": "intermedio",
                "imagen_url": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop",
                "contenido": ["Técnicas avanzadas", "Evaluación de defectos", "Procedimientos especiales", "Certificación Nivel II", "Casos prácticos industriales"],
                "instructor": "Ing. María Rodríguez - NDT Level III"
            },
            {
                "nombre": "VT II - Tipo 1",
                "descripcion": "Ensayo Visual Tipo 1 - Nivel II. Técnicas de inspección visual directa, uso de instrumentos ópticos y evaluación de discontinuidades según códigos y normas.",
                "precio": 520.00,
                "duracion_semanas": 9,
                "nivel": "intermedio",
                "imagen_url": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=200&fit=crop",
                "contenido": ["Inspección visual directa", "Instrumentos ópticos", "Códigos y normas", "Evaluación de defectos", "Documentación técnica"],
                "instructor": "Ing. José Torres - Inspector Certificado"
            },
            {
                "nombre": "Ultrasonido I",
                "descripcion": "Introducción al ultrasonido industrial. Fundamentos físicos, equipos básicos, técnicas de inspección y calibración para detección de defectos internos.",
                "precio": 650.00,
                "duracion_semanas": 12,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop",
                "contenido": ["Fundamentos del ultrasonido", "Equipos y transductores", "Técnicas básicas", "Calibración", "Interpretación básica"],
                "instructor": "Ing. Ana García - Especialista UT"
            },
            {
                "nombre": "Ultrasonido II",
                "descripcion": "Ultrasonido avanzado para certificación Nivel II. Técnicas especializadas, evaluación de soldaduras, medición de espesores y técnicas avanzadas de inspección.",
                "precio": 750.00,
                "duracion_semanas": 14,
                "nivel": "avanzado",
                "imagen_url": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop",
                "contenido": ["Técnicas avanzadas", "Inspección de soldaduras", "Medición de espesores", "Phased Array básico", "Certificación Nivel II"],
                "instructor": "Ing. Roberto Silva - NDT Level III"
            },
            {
                "nombre": "Operador de Retroexcavadora",
                "descripcion": "Curso completo para operación segura de retroexcavadoras. Incluye mantenimiento básico, técnicas de excavación y normativas de seguridad.",
                "precio": 420.00,
                "duracion_semanas": 6,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=200&fit=crop",
                "contenido": ["Operación básica", "Mantenimiento preventivo", "Técnicas de excavación", "Seguridad operacional", "Normativas vigentes"],
                "instructor": "Tec. Luis Morales - Instructor Certificado"
            },
            {
                "nombre": "Operador de Plataforma Aérea",
                "descripcion": "Capacitación para operación segura de plataformas aéreas. Inspecciones pre-operacionales, maniobras seguras y procedimientos de emergencia.",
                "precio": 380.00,
                "duracion_semanas": 5,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop",
                "contenido": ["Tipos de plataformas", "Inspección pre-operacional", "Maniobras seguras", "Procedimientos de emergencia", "Certificación operador"],
                "instructor": "Tec. Patricia Vega - Especialista en Altura"
            },
            {
                "nombre": "Operador de Grúa Puente-Pórtico Tipo 3",
                "descripcion": "Operación especializada de grúas puente y pórtico tipo 3. Incluye cálculos de carga, maniobras complejas y certificación según normativas.",
                "precio": 580.00,
                "duracion_semanas": 8,
                "nivel": "intermedio",
                "imagen_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
                "contenido": ["Sistemas de grúas", "Cálculos de carga", "Maniobras especializadas", "Mantenimiento básico", "Certificación Tipo 3"],
                "instructor": "Ing. Fernando López - Especialista en Grúas"
            },
            {
                "nombre": "Operador de Montacargas",
                "descripcion": "Curso básico para operación de montacargas. Seguridad, manejo de cargas, mantenimiento básico y certificación operacional.",
                "precio": 320.00,
                "duracion_semanas": 4,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=200&fit=crop",
                "contenido": ["Operación básica", "Seguridad en el manejo", "Tipos de montacargas", "Mantenimiento diario", "Certificación operador"],
                "instructor": "Tec. Miguel Santos - Instructor Operacional"
            },
            {
                "nombre": "Supervisor de Izajes",
                "descripcion": "Formación integral para supervisión de operaciones de izaje. Planificación, cálculos estructurales, liderazgo de equipos y gestión de riesgos.",
                "precio": 680.00,
                "duracion_semanas": 10,
                "nivel": "avanzado",
                "imagen_url": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=200&fit=crop",
                "contenido": ["Planificación de izajes", "Cálculos estructurales", "Liderazgo de equipos", "Gestión de riesgos", "Normativas internacionales"],
                "instructor": "Ing. Sandra Huamán - Especialista en Izajes"
            },
            {
                "nombre": "Operador de Polipasto Estacionario",
                "descripcion": "Operación segura de polipastos estacionarios. Inspecciones, procedimientos operacionales y mantenimiento preventivo básico.",
                "precio": 350.00,
                "duracion_semanas": 5,
                "nivel": "principiante",
                "imagen_url": "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=200&fit=crop",
                "contenido": ["Tipos de polipastos", "Procedimientos operacionales", "Inspecciones diarias", "Mantenimiento básico", "Seguridad operacional"],
                "instructor": "Tec. Ricardo Flores - Operador Especializado"
            },
            {
                "nombre": "Operador de Grúa Articulada",
                "descripcion": "Operación especializada de grúas articuladas. Maniobras complejas, cálculos de capacidad, estabilización y certificación operacional.",
                "precio": 620.00,
                "duracion_semanas": 9,
                "nivel": "intermedio",
                "imagen_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=200&fit=crop",
                "contenido": ["Sistemas hidráulicos", "Maniobras complejas", "Cálculos de capacidad", "Estabilización", "Certificación especializada"],
                "instructor": "Ing. Carlos Quispe - Especialista en Grúas Móviles"
            },
            {
                "nombre": "Rigger Certificado",
                "descripcion": "Certificación en rigging para operaciones de izaje. Selección de aparejos, cálculos de carga, señalización y procedimientos seguros.",
                "precio": 480.00,
                "duracion_semanas": 7,
                "nivel": "intermedio",
                "imagen_url": "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=400&h=200&fit=crop",
                "contenido": ["Tipos de aparejos", "Cálculos de carga", "Señalización estándar", "Procedimientos seguros", "Certificación rigger"],
                "instructor": "Tec. Elena Mamani - Rigger Certificada"
            }
        ]
        
        # Crear cursos
        cursos_creados = 0
        for curso_data in cursos_data:
            curso, created = Curso.objects.get_or_create(
                nombre=curso_data["nombre"],
                defaults=curso_data
            )
            if created:
                cursos_creados += 1
                self.stdout.write(f'✓ Curso creado: {curso.nombre}')
                
                # Crear exámenes para cada curso
                self.crear_examenes_para_curso(curso)
            else:
                self.stdout.write(f'○ Curso ya existe: {curso.nombre}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Proceso completado. {cursos_creados} cursos nuevos creados.')
        )

    def crear_examenes_para_curso(self, curso):
        """Crea exámenes teórico y práctico para un curso"""
        
        # Examen Teórico
        examen_teorico, created = Examen.objects.get_or_create(
            curso=curso,
            tipo='teorico',
            defaults={
                'nombre': f'Examen Teórico - {curso.nombre}',
                'descripcion': f'Evaluación teórica de conocimientos del curso {curso.nombre}',
                'cantidad_preguntas': 20,
                'tiempo_limite': 45,
                'puntaje_minimo': 70.00
            }
        )
        
        if created:
            self.stdout.write(f'  → Examen teórico creado para {curso.nombre}')
            self.crear_preguntas_ejemplo(examen_teorico)
        
        # Examen Práctico
        examen_practico, created = Examen.objects.get_or_create(
            curso=curso,
            tipo='practico',
            defaults={
                'nombre': f'Examen Práctico - {curso.nombre}',
                'descripcion': f'Evaluación práctica de habilidades del curso {curso.nombre}',
                'cantidad_preguntas': 10,
                'tiempo_limite': 90,
                'puntaje_minimo': 75.00
            }
        )
        
        if created:
            self.stdout.write(f'  → Examen práctico creado para {curso.nombre}')
            self.crear_preguntas_ejemplo(examen_practico)

    def crear_preguntas_ejemplo(self, examen):
        """Crea preguntas de ejemplo para un examen"""
        
        if 'líquidos penetrantes' in examen.nombre.lower():
            preguntas = [
                {
                    'texto': '¿Cuál es el principio básico del ensayo por líquidos penetrantes?',
                    'opciones': [
                        'Detectar discontinuidades superficiales mediante la penetración capilar',
                        'Detectar defectos internos mediante ondas ultrasónicas',
                        'Medir el espesor de materiales metálicos',
                        'Evaluar la dureza superficial del material'
                    ],
                    'correcta': 0
                },
                {
                    'texto': '¿Qué tipo de defectos puede detectar el ensayo por líquidos penetrantes?',
                    'opciones': [
                        'Defectos internos solamente',
                        'Grietas superficiales y discontinuidades abiertas a la superficie',
                        'Variaciones de densidad en el material',
                        'Cambios en la composición química'
                    ],
                    'correcta': 1
                }
            ]
        elif 'ultrasonido' in examen.nombre.lower():
            preguntas = [
                {
                    'texto': '¿Qué frecuencia típica se utiliza en ultrasonido industrial?',
                    'opciones': [
                        '20 Hz a 20 kHz',
                        '0.5 MHz a 25 MHz',
                        '100 MHz a 1 GHz',
                        '1 GHz a 10 GHz'
                    ],
                    'correcta': 1
                },
                {
                    'texto': '¿Cuál es la ventaja principal del ultrasonido sobre otros métodos NDT?',
                    'opciones': [
                        'Es el método más económico',
                        'Puede detectar defectos internos y medir espesores',
                        'No requiere capacitación especializada',
                        'Funciona en todos los materiales'
                    ],
                    'correcta': 1
                }
            ]
        else:
            # Preguntas generales para otros cursos
            preguntas = [
                {
                    'texto': '¿Cuál es la importancia de seguir los procedimientos de seguridad?',
                    'opciones': [
                        'Evitar accidentes y proteger la integridad personal',
                        'Cumplir con regulaciones únicamente',
                        'Reducir costos operacionales',
                        'Mejorar la velocidad de trabajo'
                    ],
                    'correcta': 0
                },
                {
                    'texto': '¿Qué debe hacer antes de operar cualquier equipo?',
                    'opciones': [
                        'Comenzar inmediatamente el trabajo',
                        'Realizar una inspección pre-operacional',
                        'Verificar el clima',
                        'Consultar con otros operadores'
                    ],
                    'correcta': 1
                }
            ]
        
        for i, pregunta_data in enumerate(preguntas[:3]):  # Máximo 3 preguntas de ejemplo
            pregunta = Pregunta.objects.create(
                examen=examen,
                texto_pregunta=pregunta_data['texto'],
                tipo='multiple',
                puntaje=5.00,
                orden=i + 1
            )
            
            for j, opcion_texto in enumerate(pregunta_data['opciones']):
                OpcionRespuesta.objects.create(
                    pregunta=pregunta,
                    texto_opcion=opcion_texto,
                    es_correcta=(j == pregunta_data['correcta']),
                    orden=j + 1
                )
