from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Curso, Inscripcion
from .serializers import UserSerializer, UserRegistrationSerializer, CursoSerializer, InscripcionCreateSerializer, InscripcionSerializer

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login user
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if email and password:
        user = authenticate(username=email, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Login exitoso'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Email o contraseña incorrectos'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'error': 'Email y contraseña son requeridos'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(request):
    """
    Logout user
    """
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({
            'error': 'Token no encontrado'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get user profile
    """
    return Response({
        'user': UserSerializer(request.user).data,
    }, status=status.HTTP_200_OK)


# Vista pública para mostrar cursos
@api_view(['GET'])
@permission_classes([AllowAny])
def cursos_publicos(request):
    """
    Vista pública para obtener la lista de cursos activos
    """
    try:
        cursos = Curso.objects.filter(activo=True).order_by('nombre')
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener cursos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vista pública para crear inscripciones
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_inscripcion(request):
    """
    Vista pública para que los usuarios autenticados puedan inscribirse a cursos
    """
    try:
        # El usuario debe estar autenticado pero no necesita ser admin
        inscripcion_data = request.data.copy()
        inscripcion_data['usuario'] = request.user.id
        
        # Validar que el curso existe y está activo
        try:
            curso = Curso.objects.get(id=inscripcion_data['curso'], activo=True)
        except Curso.DoesNotExist:
            return Response({
                'error': 'El curso no existe o no está disponible'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el usuario ya está inscrito en este curso
        if Inscripcion.objects.filter(usuario=request.user, curso=curso).exists():
            return Response({
                'error': 'Ya estás inscrito en este curso'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = InscripcionCreateSerializer(data=inscripcion_data)
        if serializer.is_valid():
            inscripcion = serializer.save()
            return Response({
                'message': 'Inscripción creada exitosamente',
                'inscripcion_id': inscripcion.id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Datos inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Error al crear inscripción: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vista para que los usuarios vean sus propias inscripciones
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_inscripciones(request):
    """
    Vista para que los usuarios autenticados vean sus propias inscripciones
    """
    try:
        inscripciones = Inscripcion.objects.filter(usuario=request.user).order_by('-fecha_inscripcion')
        serializer = InscripcionSerializer(inscripciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener inscripciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vistas para el panel de administración
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAdminUser
from .serializers import (
    CursoSerializer, InscripcionSerializer, InscripcionCreateSerializer,
    ExamenSerializer, PreguntaSerializer, IntentarExamenSerializer
)
from .models import Curso, Inscripcion, Examen, Pregunta, IntentarExamen


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_admin_user(request):
    """
    Verificar si el usuario es administrador
    """
    is_admin = request.user.email == 'jiji@gmail.com' or request.user.is_staff
    
    return Response({
        'is_admin': is_admin,
        'user_email': request.user.email,
        'is_staff': request.user.is_staff
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_inscripciones(request):
    """
    Gestionar inscripciones desde el panel admin
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        inscripciones = Inscripcion.objects.all().order_by('-fecha_inscripcion')
        serializer = InscripcionSerializer(inscripciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = InscripcionCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_inscripcion_detail(request, pk):
    """
    Gestionar una inscripción específica
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        inscripcion = Inscripcion.objects.get(pk=pk)
    except Inscripcion.DoesNotExist:
        return Response({'error': 'Inscripción no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = InscripcionSerializer(inscripcion)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = InscripcionSerializer(inscripcion, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        inscripcion.delete()
        return Response({'message': 'Inscripción eliminada'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_cursos(request):
    """
    Gestionar cursos desde el panel admin
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        cursos = Curso.objects.all().order_by('nombre')
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = CursoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_curso_detail(request, pk):
    """
    Gestionar un curso específico
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CursoSerializer(curso)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        # PATCH permite actualizaciones parciales, PUT requiere todos los campos
        partial = request.method == 'PATCH'
        serializer = CursoSerializer(curso, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        curso.delete()
        return Response({'message': 'Curso eliminado'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_estudiantes(request):
    """
    Obtener lista de todos los estudiantes
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    estudiantes = CustomUser.objects.filter(is_staff=False).order_by('-date_joined')
    serializer = UserSerializer(estudiantes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============= VISTAS DE ADMINISTRACIÓN DE EXÁMENES =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_examenes(request):
    """
    Obtener lista de todos los exámenes organizados por curso para administración
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Examen, Curso
    from .models.examen import IntentarExamen
    
    # Obtener todos los cursos con sus exámenes
    cursos_con_examenes = []
    cursos = Curso.objects.all().order_by('nombre')
    
    for curso in cursos:
        examenes_curso = Examen.objects.filter(curso=curso).order_by('-fecha_creacion')
        
        examenes_data = []
        for examen in examenes_curso:
            # Contar preguntas del examen
            total_preguntas = examen.preguntas.count()
            
            # Contar intentos del examen
            intentos_count = IntentarExamen.objects.filter(examen=examen).count()
            intentos_completados = IntentarExamen.objects.filter(examen=examen, estado='completado').count()
            
            # Para exámenes prácticos, obtener intentos pendientes de evaluación
            examenes_practicos_pendientes = []
            if examen.tipo == 'practico':
                intentos_pendientes = IntentarExamen.objects.filter(
                    examen=examen,
                    estado='completado',
                    resultado_practico__isnull=True
                ).select_related('usuario')
                
                for intento in intentos_pendientes:
                    examenes_practicos_pendientes.append({
                        'id': intento.id,
                        'usuario_nombre': intento.usuario.get_full_name() or intento.usuario.email,
                        'usuario_email': intento.usuario.email,
                        'fecha_intento': intento.fecha_intento,
                    })
            
            examenes_data.append({
                'id': examen.id,
                'titulo': examen.nombre,
                'descripcion': examen.descripcion,
                'tipo': examen.tipo,
                'duracion_minutos': examen.tiempo_limite,
                'numero_preguntas': examen.cantidad_preguntas,
                'total_preguntas_creadas': total_preguntas,
                'activo': examen.activo,
                'fecha_creacion': examen.fecha_creacion,
                'total_intentos': intentos_count,
                'intentos_completados': intentos_completados,
                'examenes_practicos_pendientes': examenes_practicos_pendientes,
            })
        
        # Contar estudiantes inscritos en el curso
        estudiantes_inscritos = curso.inscripcion_set.filter(estado_pago='verificado').count()
        
        cursos_con_examenes.append({
            'id': curso.id,
            'nombre': curso.nombre,
            'descripcion': curso.descripcion,
            'instructor': curso.instructor,
            'estudiantes_inscritos': estudiantes_inscritos,
            'examenes': examenes_data,
            'total_examenes': len(examenes_data),
        })
    
    return Response(cursos_con_examenes, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_examen_detalle(request, examen_id):
    """
    Obtener o actualizar un examen específico
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Examen
    
    try:
        examen = Examen.objects.get(id=examen_id)
    except Examen.DoesNotExist:
        return Response({'error': 'Examen no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        data = {
            'id': examen.id,
            'titulo': examen.nombre,  # Usar 'nombre'
            'descripcion': examen.descripcion,
            'curso_id': examen.curso.id if examen.curso else None,
            'curso_nombre': examen.curso.nombre if examen.curso else 'Sin curso',
            'duracion_minutos': examen.tiempo_limite,  # Usar 'tiempo_limite'
            'numero_preguntas': examen.cantidad_preguntas,  # Usar 'cantidad_preguntas'
            'activo': examen.activo,
        }
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Mapear campos frontend a backend
        field_mapping = {
            'titulo': 'nombre',
            'duracion_minutos': 'tiempo_limite',
            'numero_preguntas': 'cantidad_preguntas'
        }
        
        # Actualizar campos proporcionados
        for field, value in request.data.items():
            # Usar el mapeo si existe, si no usar el campo directamente
            backend_field = field_mapping.get(field, field)
            if hasattr(examen, backend_field):
                setattr(examen, backend_field, value)
        
        examen.save()
        return Response({'message': 'Examen actualizado correctamente'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_preguntas(request):
    """
    Obtener lista de todas las preguntas para administración
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Pregunta
    
    preguntas = Pregunta.objects.select_related('examen').all().order_by('-id')
    preguntas_data = []
    
    for pregunta in preguntas:
        preguntas_data.append({
            'id': pregunta.id,
            'texto': pregunta.texto_pregunta,  # Usar 'texto_pregunta'
            'opcion_a': getattr(pregunta, 'opcion_a', ''),  # Campos que pueden no existir
            'opcion_b': getattr(pregunta, 'opcion_b', ''),
            'opcion_c': getattr(pregunta, 'opcion_c', ''),
            'opcion_d': getattr(pregunta, 'opcion_d', ''),
            'respuesta_correcta': getattr(pregunta, 'respuesta_correcta', ''),
            'examen_id': pregunta.examen.id if pregunta.examen else None,
            'examen_titulo': pregunta.examen.nombre if pregunta.examen else 'Sin examen',  # Usar 'nombre'
            'activo': pregunta.activo,
        })
    
    return Response(preguntas_data, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_pregunta_detalle(request, pregunta_id):
    """
    Obtener, actualizar o eliminar una pregunta específica
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Pregunta
    
    try:
        pregunta = Pregunta.objects.get(id=pregunta_id)
    except Pregunta.DoesNotExist:
        return Response({'error': 'Pregunta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        data = {
            'id': pregunta.id,
            'texto': pregunta.texto_pregunta,  # Usar 'texto_pregunta'
            'opcion_a': getattr(pregunta, 'opcion_a', ''),
            'opcion_b': getattr(pregunta, 'opcion_b', ''),
            'opcion_c': getattr(pregunta, 'opcion_c', ''),
            'opcion_d': getattr(pregunta, 'opcion_d', ''),
            'respuesta_correcta': getattr(pregunta, 'respuesta_correcta', ''),
            'examen_id': pregunta.examen.id if pregunta.examen else None,
            'activo': pregunta.activo,
        }
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Mapear campos frontend a backend
        field_mapping = {
            'texto': 'texto_pregunta'
        }
        
        # Actualizar campos proporcionados
        for field, value in request.data.items():
            backend_field = field_mapping.get(field, field)
            if hasattr(pregunta, backend_field):
                setattr(pregunta, backend_field, value)
        
        pregunta.save()
        return Response({'message': 'Pregunta actualizada correctamente'}, status=status.HTTP_200_OK)
    
    elif request.method == 'DELETE':
        pregunta.delete()
        return Response({'message': 'Pregunta eliminada correctamente'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_intentos_examen(request):
    """
    Obtener lista de todos los intentos de examen para administración
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import IntentarExamen
    
    intentos = IntentarExamen.objects.select_related('usuario', 'examen').all().order_by('-fecha_inicio')
    intentos_data = []
    
    for intento in intentos:
        # Verificar si el intento está completado
        completado = intento.estado == 'completado'
        
        intentos_data.append({
            'id': intento.id,
            'usuario_id': intento.usuario.id,
            'usuario_nombre': f"{intento.usuario.first_name} {intento.usuario.last_name}".strip() or intento.usuario.email,
            'examen_id': intento.examen.id,
            'examen_titulo': intento.examen.nombre,  # Usar 'nombre'
            'fecha_inicio': intento.fecha_inicio,
            'fecha_finalizacion': intento.fecha_finalizacion,
            'completado': completado,
            'puntaje': intento.puntaje_obtenido,  # Usar 'puntaje_obtenido'
            'preguntas_seleccionadas': intento.preguntas_seleccionadas,
        })
    
    return Response(intentos_data, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_examen_practico_resultado(request, intento_id):
    """
    Gestionar resultados de exámenes prácticos (solo para administradores)
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import IntentarExamen
    
    try:
        intento = IntentarExamen.objects.select_related('usuario', 'examen').get(id=intento_id)
    except IntentarExamen.DoesNotExist:
        return Response({'error': 'Intento de examen no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verificar que sea un examen práctico
    if intento.examen.tipo != 'practico':
        return Response({'error': 'Este endpoint es solo para exámenes prácticos'}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'GET':
        data = {
            'id': intento.id,
            'usuario_nombre': f"{intento.usuario.first_name} {intento.usuario.last_name}".strip() or intento.usuario.email,
            'examen_titulo': intento.examen.nombre,
            'curso_nombre': intento.examen.curso.nombre,
            'fecha_inicio': intento.fecha_inicio,
            'resultado_practico': intento.resultado_practico,
            'observaciones_practico': intento.observaciones_practico,
            'evaluador': intento.evaluador,
            'fecha_evaluacion_practica': intento.fecha_evaluacion_practica,
        }
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Actualizar resultado del examen práctico
        resultado = request.data.get('resultado_practico')
        observaciones = request.data.get('observaciones_practico', '')
        evaluador = request.data.get('evaluador', '')
        
        if resultado in ['aprobado', 'desaprobado']:
            intento.resultado_practico = resultado
            intento.observaciones_practico = observaciones
            intento.evaluador = evaluador
            intento.fecha_evaluacion_practica = timezone.now()
            intento.estado = 'completado'
            
            # Establecer aprobación basada en el resultado
            intento.aprobado = (resultado == 'aprobado')
            
            # Para exámenes prácticos, el puntaje es binario: 100 si aprobado, 0 si desaprobado
            intento.puntaje_obtenido = 100.0 if resultado == 'aprobado' else 0.0
            intento.fecha_finalizacion = timezone.now()
            
            intento.save()
            
            return Response({
                'message': f'Resultado actualizado a: {resultado}',
                'resultado': resultado,
                'aprobado': intento.aprobado
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Resultado debe ser "aprobado" o "desaprobado"'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_examenes_practicos_pendientes(request):
    """
    Obtener lista de exámenes prácticos pendientes de evaluación
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import IntentarExamen
    
    # Obtener intentos de exámenes prácticos pendientes
    intentos_pendientes = IntentarExamen.objects.select_related('usuario', 'examen', 'examen__curso').filter(
        examen__tipo='practico',
        resultado_practico__in=['pendiente', None],
        estado__in=['iniciado', 'en_progreso']
    ).order_by('-fecha_inicio')
    
    intentos_data = []
    for intento in intentos_pendientes:
        intentos_data.append({
            'id': intento.id,
            'usuario_id': intento.usuario.id,
            'usuario_nombre': f"{intento.usuario.first_name} {intento.usuario.last_name}".strip() or intento.usuario.email,
            'usuario_email': intento.usuario.email,
            'examen_id': intento.examen.id,
            'examen_titulo': intento.examen.nombre,
            'curso_nombre': intento.examen.curso.nombre,
            'fecha_inicio': intento.fecha_inicio,
            'resultado_practico': intento.resultado_practico or 'pendiente',
            'evaluador': intento.evaluador,
        })
    
    return Response(intentos_data, status=status.HTTP_200_OK)


# ============= VISTAS DE EXÁMENES =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def examenes_disponibles(request, curso_id):
    """
    Obtener exámenes disponibles para un curso específico
    """
    try:
        from .models import Examen, Inscripcion
        
        # Verificar que el usuario esté inscrito en el curso
        inscripcion = Inscripcion.objects.filter(
            usuario=request.user, 
            curso_id=curso_id, 
            estado_pago='verificado'
        ).first()
        
        if not inscripcion:
            return Response({
                'error': 'No estás inscrito en este curso o tu inscripción no está verificada'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener exámenes activos del curso
        examenes = Examen.objects.filter(curso_id=curso_id, activo=True)
        
        examenes_data = []
        for examen in examenes:
            total_preguntas = examen.preguntas.filter(activo=True).count()
            examenes_data.append({
                'id': examen.id,
                'nombre': examen.nombre,
                'tipo': examen.tipo,
                'descripcion': examen.descripcion,
                'cantidad_preguntas': examen.cantidad_preguntas,
                'total_preguntas_disponibles': total_preguntas,
                'tiempo_limite': examen.tiempo_limite,
                'puntaje_minimo': examen.puntaje_minimo,
            })
        
        return Response(examenes_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener exámenes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def iniciar_examen(request, examen_id):
    """
    Iniciar un nuevo intento de examen
    """
    try:
        from .models import Examen, IntentarExamen, Inscripcion
        
        # Verificar que el examen existe
        examen = Examen.objects.get(id=examen_id, activo=True)
        
        # Verificar que el usuario esté inscrito en el curso
        inscripcion = Inscripcion.objects.filter(
            usuario=request.user, 
            curso=examen.curso, 
            estado_pago='verificado'
        ).first()
        
        if not inscripcion:
            return Response({
                'error': 'No estás inscrito en este curso'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar si ya tiene un intento activo
        intento_activo = IntentarExamen.objects.filter(
            usuario=request.user,
            examen=examen,
            estado='iniciado'
        ).first()
        
        if intento_activo:
            return Response({
                'error': 'Ya tienes un intento activo para este examen',
                'intento_id': intento_activo.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear nuevo intento
        nuevo_intento = IntentarExamen.objects.create(
            usuario=request.user,
            examen=examen
        )
        
        # Seleccionar preguntas aleatorias
        preguntas_seleccionadas = nuevo_intento.seleccionar_preguntas_aleatorias()
        
        return Response({
            'intento_id': nuevo_intento.id,
            'examen_nombre': examen.nombre,
            'tiempo_limite': examen.tiempo_limite,
            'cantidad_preguntas': len(preguntas_seleccionadas),
            'fecha_inicio': nuevo_intento.fecha_inicio.isoformat(),
            'message': f'Examen iniciado. Se han seleccionado {len(preguntas_seleccionadas)} preguntas.'
        }, status=status.HTTP_201_CREATED)
        
    except Examen.DoesNotExist:
        return Response({
            'error': 'Examen no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error al iniciar examen: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_preguntas_examen(request, intento_id):
    """
    Obtener las preguntas para un intento específico
    """
    try:
        from .models import IntentarExamen, OpcionRespuesta
        
        # Verificar que el intento pertenece al usuario
        intento = IntentarExamen.objects.get(
            id=intento_id,
            usuario=request.user,
            estado='iniciado'
        )
        
        # Obtener las preguntas específicas de este intento
        preguntas = intento.obtener_preguntas_del_intento()
        
        preguntas_data = []
        for i, pregunta in enumerate(preguntas, 1):
            pregunta_info = {
                'id': pregunta.id,
                'numero': i,
                'texto_pregunta': pregunta.texto_pregunta,
                'tipo': pregunta.tipo,
                'puntaje': float(pregunta.puntaje),
                'imagen_pregunta': pregunta.imagen_pregunta,
                'opciones': []
            }
            
            # Agregar opciones si es pregunta de opción múltiple
            if pregunta.tipo == 'multiple':
                opciones = OpcionRespuesta.objects.filter(pregunta=pregunta).order_by('orden')
                for opcion in opciones:
                    pregunta_info['opciones'].append({
                        'id': opcion.id,
                        'texto_opcion': opcion.texto_opcion,
                        'orden': opcion.orden
                    })
            
            preguntas_data.append(pregunta_info)
        
        return Response({
            'intento_id': intento.id,
            'examen_nombre': intento.examen.nombre,
            'tiempo_limite': intento.examen.tiempo_limite,
            'preguntas': preguntas_data,
            'total_preguntas': len(preguntas_data)
        }, status=status.HTTP_200_OK)
        
    except IntentarExamen.DoesNotExist:
        return Response({
            'error': 'Intento de examen no encontrado o no tienes permisos'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error al obtener preguntas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_respuestas_examen(request, intento_id):
    """
    Enviar respuestas del examen y calcular puntaje
    """
    try:
        from .models import IntentarExamen, OpcionRespuesta
        from django.utils import timezone
        
        # Verificar que el intento pertenece al usuario
        intento = IntentarExamen.objects.get(
            id=intento_id,
            usuario=request.user,
            estado='iniciado'
        )
        
        respuestas = request.data.get('respuestas', {})
        
        # Calcular puntaje
        puntaje_total = 0
        puntaje_maximo = 0
        respuestas_correctas = 0
        total_preguntas = 0
        
        preguntas = intento.obtener_preguntas_del_intento()
        
        for pregunta in preguntas:
            total_preguntas += 1
            puntaje_maximo += float(pregunta.puntaje)
            
            respuesta_usuario = respuestas.get(str(pregunta.id), '')
            
            if pregunta.tipo == 'multiple':
                # Verificar respuesta de opción múltiple
                try:
                    opcion_seleccionada = OpcionRespuesta.objects.get(
                        id=int(respuesta_usuario),
                        pregunta=pregunta
                    )
                    if opcion_seleccionada.es_correcta:
                        puntaje_total += float(pregunta.puntaje)
                        respuestas_correctas += 1
                except (ValueError, OpcionRespuesta.DoesNotExist):
                    pass
            
            elif pregunta.tipo == 'verdadero_falso':
                # Para verdadero/falso, necesitamos configurar la respuesta correcta
                # Por ahora, asumimos que se configura en las opciones
                opcion_correcta = OpcionRespuesta.objects.filter(
                    pregunta=pregunta, 
                    es_correcta=True
                ).first()
                
                if opcion_correcta and respuesta_usuario.lower() == opcion_correcta.texto_opcion.lower():
                    puntaje_total += float(pregunta.puntaje)
                    respuestas_correctas += 1
        
        # Calcular porcentaje
        porcentaje = (puntaje_total / puntaje_maximo * 100) if puntaje_maximo > 0 else 0
        aprobado = porcentaje >= float(intento.examen.puntaje_minimo)
        
        # Actualizar intento
        intento.estado = 'completado'
        intento.fecha_finalizacion = timezone.now()
        intento.puntaje_obtenido = porcentaje
        intento.aprobado = aprobado
        intento.respuestas = respuestas
        
        # Calcular tiempo utilizado
        tiempo_usado = (intento.fecha_finalizacion - intento.fecha_inicio).total_seconds() / 60
        intento.tiempo_utilizado = int(tiempo_usado)
        
        intento.save()
        
        return Response({
            'message': 'Examen completado exitosamente',
            'puntaje_obtenido': float(porcentaje),
            'puntaje_minimo': float(intento.examen.puntaje_minimo),
            'aprobado': aprobado,
            'respuestas_correctas': respuestas_correctas,
            'total_preguntas': total_preguntas,
            'tiempo_utilizado': intento.tiempo_utilizado,
            'fecha_finalizacion': intento.fecha_finalizacion.isoformat()
        }, status=status.HTTP_200_OK)
        
    except IntentarExamen.DoesNotExist:
        return Response({
            'error': 'Intento de examen no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error al procesar respuestas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
