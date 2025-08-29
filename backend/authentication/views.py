from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Curso, Inscripcion, Examen, ExamenUsuario, Pregunta, OpcionRespuesta, IntentarExamen
from .serializers import (
    UserSerializer, UserRegistrationSerializer, CursoSerializer, 
    InscripcionCreateSerializer, InscripcionSerializer,
    ExamenSerializer, ExamenListSerializer, PreguntaSerializer, 
    OpcionRespuestaSerializer, IntentarExamenSerializer
)
import json
from django.db import transaction
import random
from supabase_upload import upload_file_to_supabase

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
    print("URL final comprobante:", supabase_url if 'supabase_url' in locals() else None)
    serializer = InscripcionCreateSerializer(data=data_serializer)
    print("Datos para serializer:", data_serializer)
    """
    Vista pública para que los usuarios autenticados puedan inscribirse a cursos
    """
    print("FILES:", request.FILES)
    print("DATA:", request.data)
    try:
        print("FILES:", request.FILES)
        print("DATA:", request.data)
        # El usuario debe estar autenticado pero no necesita ser admin
        inscripcion_data = request.data.copy()
        inscripcion_data['usuario'] = request.user.id
        # Subir comprobante_pago a Supabase si se envía archivo
        comprobante_pago = request.FILES.get('comprobante_pago', None)
        supabase_url = None
        if comprobante_pago:
            file_path = f"/tmp/{comprobante_pago.name}"
            with open(file_path, 'wb+') as destination:
                for chunk in comprobante_pago.chunks():
                    destination.write(chunk)
            supabase_url = upload_file_to_supabase(file_path, comprobante_pago.name)
        # Crear dict limpio para el serializer
        data_serializer = dict(inscripcion_data)
        if supabase_url:
            data_serializer['comprobante_pago'] = supabase_url
        serializer = InscripcionCreateSerializer(data=data_serializer)
        
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
        # Subir comprobante_pago a Supabase si se envía archivo
        comprobante_pago = request.FILES.get('comprobante_pago', None)
        if comprobante_pago:
            file_path = f"/tmp/{comprobante_pago.name}"
            with open(file_path, 'wb+') as destination:
                for chunk in comprobante_pago.chunks():
                    destination.write(chunk)
            supabase_url = upload_file_to_supabase(file_path, comprobante_pago.name)
            inscripcion_data['comprobante_pago'] = supabase_url
        
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
    cursos = Curso.objects.all().order_by('nombre')
    cursos_con_examenes = []
    for curso in cursos:
        examenes_curso = Examen.objects.filter(curso=curso).order_by('-fecha_creacion')
        examenes_data = []
        for examen in examenes_curso:
            # ...lógica de exámenes...
            total_preguntas = examen.preguntas.count()
            intentos_count = IntentarExamen.objects.filter(examen=examen).count()
            intentos_completados = IntentarExamen.objects.filter(examen=examen, estado='completado').count()
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
                'curso_id': examen.curso.id if examen.curso else None,
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
        estudiantes_inscritos = curso.inscripcion_set.filter(estado_pago='verificado').count()
        # Asegura que todos los cursos tengan la propiedad 'examenes', aunque esté vacía
        cursos_con_examenes.append({
            'id': curso.id,
            'nombre': curso.nombre,
            'descripcion': curso.descripcion,
            'instructor': curso.instructor,
            'estudiantes_inscritos': estudiantes_inscritos,
            'examenes': examenes_data if examenes_data else [],
            'total_examenes': len(examenes_data),
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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_preguntas(request):
    """
    Obtener lista de todas las preguntas para administración
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)

    from .models import Pregunta, Examen


    if request.method == 'POST':
        # Crear nueva pregunta asociada automáticamente al examen teórico del curso
        data = request.POST
        files = request.FILES
        curso_id = data.get('curso_id')
        texto = data.get('texto')
        tipo = data.get('tipo', 'multiple')
        opcion_a = data.get('opcion_a', '')
        opcion_b = data.get('opcion_b', '')
        opcion_c = data.get('opcion_c', '')
        opcion_d = data.get('opcion_d', '')
        respuesta_correcta = data.get('respuesta_correcta', '')
        imagen_pregunta = files.get('imagen_pregunta', None)
        # Subir imagen a Supabase si se envía archivo
        if imagen_pregunta:
            from supabase_upload import upload_file_to_supabase
            file_path = f"/tmp/{imagen_pregunta.name}"
            with open(file_path, 'wb+') as destination:
                for chunk in imagen_pregunta.chunks():
                    destination.write(chunk)
            supabase_url = upload_file_to_supabase(file_path, imagen_pregunta.name)
            imagen_pregunta = supabase_url
        # Buscar examen teórico del curso
        from .models import Curso
        try:
            curso = Curso.objects.get(id=curso_id)
        except Curso.DoesNotExist:
            return Response({'error': 'Curso no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        examen = Examen.objects.filter(curso=curso, tipo='teorico').first()
        if not examen:
            # Crear examen teórico automáticamente si no existe
            examen = Examen.objects.create(
                curso=curso,
                nombre=f"Examen Teórico de {curso.nombre}",
                tipo='teorico',
                descripcion=f"Examen teórico generado automáticamente para el curso {curso.nombre}",
                cantidad_preguntas=0,
                tiempo_limite=60,
                puntaje_minimo=70.0,
                activo=True
            )
        # Crear pregunta
        # Calcular el siguiente orden disponible para el examen
        orden_existentes = set(Pregunta.objects.filter(examen=examen).values_list('orden', flat=True))
        nuevo_orden = 1
        while nuevo_orden in orden_existentes:
            nuevo_orden += 1
        pregunta = Pregunta.objects.create(
            examen=examen,
            texto_pregunta=texto,
            tipo=tipo,
            puntaje=1.0,
            orden=nuevo_orden,
            activo=True,
            imagen_pregunta=imagen_pregunta,
            respuesta_correcta=respuesta_correcta if tipo == 'texto' else None
        )
        # Solo crear opciones si la pregunta es de opción múltiple o verdadero/falso
        if tipo in ['multiple', 'verdadero_falso']:
            from .models import OpcionRespuesta
            opciones = [opcion_a, opcion_b, opcion_c, opcion_d]
            letras = ['A', 'B', 'C', 'D']
            for idx, texto_opcion in enumerate(opciones):
                if texto_opcion:
                    OpcionRespuesta.objects.create(
                        pregunta=pregunta,
                        texto_opcion=texto_opcion,
                        es_correcta=(letras[idx] == respuesta_correcta),
                        orden=idx+1
                    )
        return Response({'message': 'Pregunta creada correctamente', 'id': pregunta.id}, status=status.HTTP_201_CREATED)

    # GET: Listar preguntas
    preguntas = Pregunta.objects.select_related('examen').all().order_by('-id')
    preguntas_data = []
    for pregunta in preguntas:
        opciones = []
        for opcion in pregunta.opciones.all().order_by('orden'):
            opciones.append({
                'id': opcion.id,
                'texto_opcion': opcion.texto_opcion,
                'es_correcta': opcion.es_correcta,
                'orden': opcion.orden
            })
        preguntas_data.append({
            'id': pregunta.id,
            'texto': pregunta.texto_pregunta,
            'tipo': pregunta.tipo,
            'respuesta_correcta': pregunta.respuesta_correcta,
            'opciones': opciones,
            'examen_id': pregunta.examen.id if pregunta.examen else None,
            'examen_titulo': pregunta.examen.nombre if pregunta.examen else 'Sin examen',
            'activo': pregunta.activo,
            'imagen_pregunta': pregunta.imagen_pregunta.url if pregunta.imagen_pregunta else None,
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
            'texto': pregunta.texto_pregunta,
            'tipo': pregunta.tipo,
            'opcion_a': '',
            'opcion_b': '',
            'opcion_c': '',
            'opcion_d': '',
            'respuesta_correcta': pregunta.respuesta_correcta,
            'examen_id': pregunta.examen.id if pregunta.examen else None,
            'activo': pregunta.activo,
        }
        # Si la pregunta es de opción múltiple, incluir opciones
        if pregunta.tipo == 'multiple':
            opciones = pregunta.opciones.all().order_by('orden')
            for idx, opcion in enumerate(opciones):
                data[f'opcion_{chr(97+idx)}'] = opcion.texto_opcion
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
    from django.utils import timezone
    from django.db import models
    from django.db.models import Q
    from datetime import date
    
    # Obtener la fecha de hoy
    hoy = date.today()
    
    # Obtener intentos de exámenes prácticos pendientes o programados para hoy
    intentos_pendientes = IntentarExamen.objects.select_related('usuario', 'examen', 'examen__curso').filter(
        examen__tipo='practico',
        resultado_practico__in=['pendiente', None],
        estado__in=['iniciado', 'en_progreso']
    ).filter(
        Q(fecha_programada_practica=hoy) | 
        Q(fecha_programada_practica__isnull=True)
    ).order_by('-fecha_inicio')
    
    intentos_data = []
    for intento in intentos_pendientes:
        # Determinar si es programado para hoy
        es_hoy = intento.fecha_programada_practica == hoy if intento.fecha_programada_practica else False
        
        intentos_data.append({
            'id': intento.id,
            'usuario_id': intento.usuario.id,
            'usuario_nombre': f"{intento.usuario.first_name} {intento.usuario.last_name}".strip() or intento.usuario.email,
            'usuario_email': intento.usuario.email,
            'examen_id': intento.examen.id,
            'examen_titulo': intento.examen.nombre,
            'curso_nombre': intento.examen.curso.nombre,
            'fecha_inicio': intento.fecha_inicio,
            'fecha_programada': intento.fecha_programada_practica,
            'es_programado_hoy': es_hoy,
            'resultado_practico': intento.resultado_practico or 'pendiente',
            'evaluador': intento.evaluador,
        })
    
    return Response(intentos_data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def programar_examen_practico(request):
    """
    Programar un examen práctico para una fecha específica
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import IntentarExamen
    from datetime import datetime, time
    
    try:
        intento_id = request.data.get('intento_id')
        fecha_programada = request.data.get('fecha_programada')
        hora_programada = request.data.get('hora_programada')  # Format: "HH:MM"
        duracion_programada = request.data.get('duracion_programada')  # En minutos
        
        if not intento_id or not fecha_programada:
            return Response({
                'error': 'Se requiere intento_id y fecha_programada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el intento
        intento = IntentarExamen.objects.get(
            id=intento_id,
            examen__tipo='practico'
        )
        
        # Convertir fecha string a date object
        fecha_obj = datetime.strptime(fecha_programada, '%Y-%m-%d').date()
        
        # Convertir hora string a time object si se proporciona
        hora_obj = None
        if hora_programada:
            try:
                hora_obj = datetime.strptime(hora_programada, '%H:%M').time()
            except ValueError:
                return Response({
                    'error': 'Formato de hora inválido. Use HH:MM'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar los campos
        intento.fecha_programada_practica = fecha_obj
        if hora_obj:
            intento.hora_programada_practica = hora_obj
        if duracion_programada:
            intento.duracion_programada = int(duracion_programada)
        intento.save()
        
        return Response({
            'message': f'Examen práctico programado para {fecha_programada}' + 
                      (f' a las {hora_programada}' if hora_programada else '') +
                      (f' por {duracion_programada} minutos' if duracion_programada else ''),
            'intento_id': intento_id,
            'fecha_programada': fecha_programada,
            'hora_programada': hora_programada,
            'duracion_programada': duracion_programada
        }, status=status.HTTP_200_OK)
        
    except IntentarExamen.DoesNotExist:
        return Response({
            'error': 'Intento de examen no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({
            'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Error al programar examen: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activar_examen_para_curso(request):
    """
    Activar examen para todos los estudiantes inscritos en un curso
    """
    # Verificar si es admin
    if not (request.user.email == 'jiji@gmail.com' or request.user.is_staff):
        return Response({'error': 'No tienes permisos de administrador'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Examen, IntentarExamen, Inscripcion
    from datetime import datetime, time
    
    try:
        examen_id = request.data.get('examen_id')
        fecha_programada = request.data.get('fecha_programada')
        hora_programada = request.data.get('hora_programada')  # Format: "HH:MM"
        duracion_programada = request.data.get('duracion_programada')  # En minutos
        
        if not examen_id or not fecha_programada:
            return Response({
                'error': 'Se requiere examen_id y fecha_programada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el examen
        examen = Examen.objects.get(id=examen_id, tipo='practico')
        
        # Convertir fecha string a date object
        fecha_obj = datetime.strptime(fecha_programada, '%Y-%m-%d').date()
        
        # Convertir hora string a time object si se proporciona
        hora_obj = None
        if hora_programada:
            try:
                hora_obj = datetime.strptime(hora_programada, '%H:%M').time()
            except ValueError:
                return Response({
                    'error': 'Formato de hora inválido. Use HH:MM'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener todos los estudiantes inscritos en el curso
        inscripciones = Inscripcion.objects.filter(
            curso=examen.curso,
            estado='aprobado'
        )
        
        intentos_creados = 0
        intentos_actualizados = 0
        
        for inscripcion in inscripciones:
            # Verificar si ya existe un intento para este estudiante y examen
            intento_existente = IntentarExamen.objects.filter(
                usuario=inscripcion.usuario,
                examen=examen
            ).first()
            
            if intento_existente:
                # Actualizar intento existente
                intento_existente.fecha_programada_practica = fecha_obj
                if hora_obj:
                    intento_existente.hora_programada_practica = hora_obj
                if duracion_programada:
                    intento_existente.duracion_programada = int(duracion_programada)
                intento_existente.save()
                intentos_actualizados += 1
            else:
                # Crear nuevo intento
                nuevo_intento = IntentarExamen.objects.create(
                    usuario=inscripcion.usuario,
                    examen=examen,
                    estado='iniciado',
                    fecha_programada_practica=fecha_obj,
                    hora_programada_practica=hora_obj,
                    duracion_programada=int(duracion_programada) if duracion_programada else None,
                    resultado_practico='pendiente'
                )
                intentos_creados += 1
        
        return Response({
            'message': f'Examen activado para {inscripciones.count()} estudiantes',
            'intentos_creados': intentos_creados,
            'intentos_actualizados': intentos_actualizados,
            'fecha_programada': fecha_programada,
            'hora_programada': hora_programada,
            'duracion_programada': duracion_programada,
            'curso': examen.curso.nombre,
            'examen': examen.nombre
        }, status=status.HTTP_200_OK)
        
    except Examen.DoesNotExist:
        return Response({
            'error': 'Examen no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({
            'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Error al activar examen: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_examenes_programados(request):
    """
    Obtener todos los exámenes programados para el usuario
    """
    try:
        from .models import IntentarExamen
        
        # Obtener intentos de examen del usuario con información de programación
        intentos = IntentarExamen.objects.filter(
            usuario=request.user
        ).select_related('examen', 'examen__curso')
        
        examenes_data = []
        for intento in intentos:
                # Obtener la inscripción del usuario para el curso de este examen
                inscripcion = None
                try:
                    inscripcion = Inscripcion.objects.get(usuario=request.user, curso=intento.examen.curso)
                except Inscripcion.DoesNotExist:
                    pass

                examen_info = {
                    'id': intento.id,
                    'examen_id': intento.examen.id,
                    'examen_nombre': intento.examen.nombre,
                    'curso_id': intento.examen.curso.id,
                    'curso_nombre': intento.examen.curso.nombre,
                    'tipo': intento.examen.tipo,
                    'estado': intento.estado,
                    'resultado_practico': intento.resultado_practico,
                    'fecha_inicio': intento.fecha_inicio,
                    'fecha_finalizacion': intento.fecha_finalizacion,
                    'puntaje_obtenido': intento.puntaje_obtenido,
                    'aprobado': intento.aprobado,
                    'fecha_programada_practica': intento.fecha_programada_practica,
                    'hora_programada_practica': intento.hora_programada_practica,
                    'duracion_programada': intento.duracion_programada,
                    # Fechas de la inscripción (para mostrar igual que MisCursosInscritos)
                    'fecha_examen_teorico': inscripcion.fecha_examen_teorico if inscripcion else None,
                    'fecha_examen_practico': inscripcion.fecha_examen_practico if inscripcion else None,
                    'aceptado_admin': getattr(inscripcion, 'aceptado_admin', None) if inscripcion else None,
                }
                examenes_data.append(examen_info)
        
        return Response(examenes_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener exámenes programados: {str(e)}'
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
        
        # Verificar si ya tiene un intento completado
        from django.utils import timezone
        from datetime import timedelta
        
        intento_existente = IntentarExamen.objects.filter(
            usuario=request.user,
            examen=examen
        ).order_by('-fecha_inicio').first()
        
        if intento_existente:
            # Si ya tiene un intento completado, no permitir otro
            if intento_existente.estado == 'completado':
                return Response({
                    'error': 'Ya has completado este examen. No se permiten múltiples intentos.',
                    'resultado': {
                        'aprobado': intento_existente.aprobado,
                        'puntaje': intento_existente.puntaje_obtenido,
                        'fecha_finalizacion': intento_existente.fecha_finalizacion
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Si el intento es reciente (menos de 24 horas) y está iniciado
            elif (intento_existente.estado == 'iniciado' and 
                  timezone.now() - intento_existente.fecha_inicio < timedelta(hours=24)):
                
                return Response({
                    'intento': {
                        'id': intento_existente.id,
                        'estado': intento_existente.estado,
                        'fecha_inicio': intento_existente.fecha_inicio
                    },
                    'examen': {
                        'id': examen.id,
                        'nombre': examen.nombre,
                        'descripcion': examen.descripcion,
                        'tiempo_limite': examen.tiempo_limite,
                        'tipo': examen.tipo
                    },
                    'message': 'Continuando con intento existente'
                }, status=status.HTTP_200_OK)
            
            # Si el intento anterior está iniciado pero es muy antiguo, marcar como abandonado
            elif intento_existente.estado == 'iniciado':
                intento_existente.estado = 'abandonado'
                intento_existente.fecha_finalizacion = timezone.now()
                intento_existente.save()
        
        # Crear nuevo intento
        nuevo_intento = IntentarExamen.objects.create(
            usuario=request.user,
            examen=examen
        )
        
        # Seleccionar preguntas aleatorias
        preguntas_seleccionadas = nuevo_intento.seleccionar_preguntas_aleatorias()
        
        return Response({
            'intento': {
                'id': nuevo_intento.id,
                'estado': nuevo_intento.estado,
                'fecha_inicio': nuevo_intento.fecha_inicio
            },
            'examen': {
                'id': examen.id,
                'nombre': examen.nombre,
                'descripcion': examen.descripcion,
                'tiempo_limite': examen.tiempo_limite,
                'tipo': examen.tipo
            },
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
                'imagen_pregunta': pregunta.imagen_pregunta.url if pregunta.imagen_pregunta else None,
                'opciones': []
            }
            
            # Agregar opciones si es pregunta de opción múltiple
            if pregunta.tipo in ['multiple', 'multiple_choice']:
                opciones = OpcionRespuesta.objects.filter(pregunta=pregunta).order_by('orden')
                for opcion in opciones:
                    pregunta_info['opciones'].append({
                        'id': opcion.id,
                        'texto_opcion': opcion.texto_opcion,
                        'orden': opcion.orden
                    })
            # Agregar opciones si es pregunta de verdadero/falso
            elif pregunta.tipo == 'verdadero_falso':
                pregunta_info['opciones'] = [
                    {'id': 'verdadero', 'texto_opcion': 'Verdadero', 'orden': 1},
                    {'id': 'falso', 'texto_opcion': 'Falso', 'orden': 2}
                ]
            
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
                # DEBUG: Log respuesta recibida y respuesta correcta
            import logging
            logger = logging.getLogger('examen_debug')
            if pregunta.tipo in ['completar', 'abierta', 'texto']:
                logger.warning(f"Pregunta {pregunta.id}: usuario='{respuesta_usuario}', correcta='{pregunta.respuesta_correcta}'")
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

            if pregunta.tipo in ['completar', 'abierta', 'texto']:
                # Corrección automática robusta para preguntas abiertas/completar
                import unicodedata
                def normalizar(texto):
                    if not texto:
                        return ''
                    texto = str(texto).strip().lower()
                    texto = unicodedata.normalize('NFD', texto)
                    texto = ''.join(c for c in texto if unicodedata.category(c) != 'Mn')
                    texto = ' '.join(texto.split())
                    return texto
                respuesta_correcta = normalizar(pregunta.respuesta_correcta)
                respuesta_usuario_normalizada = normalizar(respuesta_usuario)
                # Logging para depuración
                iguales = respuesta_correcta == respuesta_usuario_normalizada
                logger.warning(f"[CORRECCION TEXTO] Pregunta {pregunta.id}: usuario='{respuesta_usuario}' (normalizada='{respuesta_usuario_normalizada}'), correcta='{pregunta.respuesta_correcta}' (normalizada='{respuesta_correcta}'), iguales={iguales}, puntaje={pregunta.puntaje}")
                if respuesta_correcta and iguales:
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_examenes_curso(request, curso_id):
    """
    Obtener los exámenes disponibles para un curso específico
    """
    try:
        # Verificar que el usuario está inscrito en el curso
        inscripcion = Inscripcion.objects.get(
            usuario=request.user, 
            curso_id=curso_id, 
            estado_pago='verificado'
        )
        
        # Obtener los exámenes del curso
        examenes = Examen.objects.filter(curso_id=curso_id).order_by('tipo', 'fecha_creacion')
        
        # Obtener intentos previos del usuario
        intentos = IntentarExamen.objects.filter(
            usuario=request.user,
            examen__curso_id=curso_id
        ).values('examen_id', 'aprobado', 'puntaje_obtenido', 'fecha_finalizacion')
        
        # Crear un diccionario de intentos por examen
        intentos_dict = {}
        for intento in intentos:
            if intento['examen_id'] not in intentos_dict or intento['fecha_finalizacion'] > intentos_dict[intento['examen_id']]['fecha_finalizacion']:
                intentos_dict[intento['examen_id']] = intento
        
        # Serializar exámenes con información de intentos
        examenes_data = []
        for examen in examenes:
            examen_serializer = ExamenListSerializer(examen)
            examen_data = examen_serializer.data
            
            # Agregar información del último intento
            if examen.id in intentos_dict:
                examen_data['ultimo_intento'] = intentos_dict[examen.id]
            else:
                examen_data['ultimo_intento'] = None
                
            examenes_data.append(examen_data)
        
        return Response({
            'curso': CursoSerializer(inscripcion.curso).data,
            'examenes': examenes_data
        }, status=status.HTTP_200_OK)
        
    except Inscripcion.DoesNotExist:
        return Response({
            'error': 'No estás inscrito en este curso o tu pago no ha sido verificado'
        }, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response({
            'error': f'Error al obtener exámenes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_examenes_asignados(request):
    """
    Obtiene los exámenes asignados al usuario autenticado
    """
    try:
        usuario = request.user
        examenes_asignados = ExamenUsuario.objects.filter(usuario=usuario).order_by('fecha_programada', 'hora_inicio')
        
        examenes_data = []
        for examen_asignado in examenes_asignados:
            examen_data = {
                'id': examen_asignado.id,
                'examen': {
                    'id': examen_asignado.examen.id,
                    'nombre': examen_asignado.examen.nombre,
                    'descripcion': examen_asignado.examen.descripcion,
                    'tipo': examen_asignado.examen.tipo,
                    'curso': examen_asignado.examen.curso.nombre
                },
                'fecha_programada': examen_asignado.fecha_programada,
                'hora_inicio': examen_asignado.hora_inicio,
                'duracion_minutos': examen_asignado.duracion_minutos,
                'estado': examen_asignado.estado,
                'resultado': examen_asignado.resultado,
                'nota_final': examen_asignado.nota_final,
                'fecha_realizacion': examen_asignado.fecha_realizacion
            }
            examenes_data.append(examen_data)
        
        return Response({
            'examenes_asignados': examenes_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener exámenes asignados: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def iniciar_examen_asignado(request, examen_asignado_id):
    """
    Inicia un examen asignado específico si está en el horario programado
    """
    try:
        from datetime import datetime, time
        
        usuario = request.user
        examen_asignado = ExamenUsuario.objects.get(id=examen_asignado_id, usuario=usuario)
        
        # Verificar si es el momento correcto para realizar el examen
        ahora = timezone.now()
        fecha_actual = ahora.date()
        hora_actual = ahora.time()
        
        # Verificar fecha
        if fecha_actual != examen_asignado.fecha_programada:
            return Response({
                'error': f'El examen está programado para {examen_asignado.fecha_programada}, no para hoy.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar hora (permitir un margen de 10 minutos antes)
        hora_limite = time(
            examen_asignado.hora_inicio.hour,
            max(0, examen_asignado.hora_inicio.minute - 10)
        )
        
        if hora_actual < hora_limite:
            return Response({
                'error': f'El examen inicia a las {examen_asignado.hora_inicio}. Puedes acceder 10 minutos antes.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el examen ya fue realizado
        if examen_asignado.estado == 'completado':
            return Response({
                'error': 'Ya has completado este examen.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marcar como activo y crear intento
        examen_asignado.estado = 'activo'
        examen_asignado.save()
        
        # Crear o obtener intento de examen
        intento, created = IntentarExamen.objects.get_or_create(
            usuario=usuario,
            examen=examen_asignado.examen,
            defaults={
                'fecha_inicio': timezone.now(),
                'tiempo_limite': examen_asignado.duracion_minutos,
                'estado': 'en_progreso'
            }
        )
        
        if not created and intento.estado == 'finalizado':
            return Response({
                'error': 'Ya has completado este examen.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Seleccionar preguntas aleatorias si es un nuevo intento
        if created:
            intento.seleccionar_preguntas_aleatorias()
        
        # Obtener las preguntas del intento
        preguntas = intento.obtener_preguntas_del_intento()
        
        # Serializar preguntas con opciones
        preguntas_data = []
        for pregunta in preguntas:
            opciones_data = []
            for opcion in pregunta.opciones.all():
                opciones_data.append({
                    'id': opcion.id,
                    'texto': opcion.texto_opcion
                })
            
            preguntas_data.append({
                'id': pregunta.id,
                'texto': pregunta.texto_pregunta,
                'opciones': opciones_data
            })
        
        return Response({
            'intento_id': intento.id,
            'examen': {
                'id': examen_asignado.examen.id,
                'nombre': examen_asignado.examen.nombre,
                'descripcion': examen_asignado.examen.descripcion,
                'duracion': examen_asignado.duracion_minutos
            },
            'preguntas': preguntas_data,
            'tiempo_limite': examen_asignado.duracion_minutos
        }, status=status.HTTP_200_OK)
        
    except ExamenUsuario.DoesNotExist:
        return Response({
            'error': 'Examen asignado no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error al iniciar examen: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_intento_examen_practico(request):
    """
    Crear un intento de examen práctico para un usuario (solo admin)
    """
    # Verificar que el usuario sea admin/staff
    if not request.user.is_staff:
        return Response({
            'error': 'Solo los administradores pueden crear intentos de exámenes prácticos.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuario_id = request.data.get('usuario_id')
        examen_id = request.data.get('examen_id')
        
        # Validar que existan el usuario y el examen
        usuario = CustomUser.objects.get(id=usuario_id)
        examen = Examen.objects.get(id=examen_id, tipo='practico')
        
        # Verificar que no exista ya un intento para este examen
        intento_existente = IntentarExamen.objects.filter(
            usuario=usuario,
            examen=examen
        ).first()
        
        if intento_existente:
            return Response({
                'error': f'El usuario {usuario.get_full_name()} ya tiene un intento registrado para este examen.',
                'intento_existente': {
                    'id': intento_existente.id,
                    'estado': intento_existente.estado,
                    'aprobado': intento_existente.aprobado,
                    'fecha_inicio': intento_existente.fecha_inicio
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el intento de examen práctico
        intento = IntentarExamen.objects.create(
            usuario=usuario,
            examen=examen,
            estado='iniciado',
            fecha_inicio=timezone.now(),
            puntaje_obtenido=0,
            aprobado=False
        )
        
        return Response({
            'message': f'Intento de examen práctico creado exitosamente para {usuario.get_full_name()}',
            'intento': {
                'id': intento.id,
                'usuario': usuario.get_full_name(),
                'examen': examen.nombre,
                'estado': intento.estado,
                'fecha_inicio': intento.fecha_inicio
            }
        }, status=status.HTTP_201_CREATED)
        
    except CustomUser.DoesNotExist:
        return Response({
            'error': 'Usuario no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Examen.DoesNotExist:
        return Response({
            'error': 'Examen práctico no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error al crear intento de examen: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lista_usuarios_examenes(request):
    """
    Obtener lista de usuarios con sus exámenes y notas (solo admin)
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Solo los administradores pueden acceder a esta información.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener todos los usuarios con sus intentos de examen
        usuarios_data = []
        usuarios = CustomUser.objects.all().order_by('apellidos', 'nombres')
        
        for usuario in usuarios:
            # Obtener cursos en los que está inscrito
            inscripciones = Inscripcion.objects.filter(usuario=usuario, estado_pago='verificado', aceptado_admin=True)
            cursos_inscritos = [inscripcion.curso for inscripcion in inscripciones]
            
            # Obtener intentos de examen del usuario
            intentos = IntentarExamen.objects.filter(usuario=usuario).order_by('-fecha_inicio')
            
            intentos_data = []
            for intento in intentos:
                intentos_data.append({
                    'id': intento.id,
                    'examen': {
                        'id': intento.examen.id,
                        'nombre': intento.examen.nombre,
                        'tipo': intento.examen.tipo,
                        'curso': intento.examen.curso.nombre
                    },
                    'estado': intento.estado,
                    'puntaje_obtenido': intento.puntaje_obtenido,
                    'aprobado': intento.aprobado,
                    'fecha_inicio': intento.fecha_inicio,
                    'fecha_finalizacion': intento.fecha_finalizacion
                })
            
            cursos_data = []
            for curso in cursos_inscritos:
                cursos_data.append({
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'nivel': curso.nivel
                })
            
            usuarios_data.append({
                'id': usuario.id,
                'nombres': usuario.nombres,
                'apellidos': usuario.apellidos,
                'email': usuario.email,
                'dni': usuario.dni,
                'cursos_inscritos': cursos_data,
                'intentos_examenes': intentos_data,
                'total_examenes': len(intentos_data),
                'examenes_aprobados': len([i for i in intentos_data if i['aprobado']]),
                'examenes_reprobados': len([i for i in intentos_data if not i['aprobado'] and i['estado'] == 'completado'])
            })
        
        return Response({
            'usuarios': usuarios_data,
            'total_usuarios': len(usuarios_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener información de usuarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
