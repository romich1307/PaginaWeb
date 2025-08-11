from django.shortcuts import render
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


@api_view(['GET', 'PUT', 'DELETE'])
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
    
    elif request.method == 'PUT':
        serializer = CursoSerializer(curso, data=request.data, partial=True)
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
