from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Curso, Inscripcion, Examen, Pregunta, OpcionRespuesta, IntentarExamen

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'nombres', 'apellidos', 'dni', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'nombres', 'apellidos', 'dni', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value
    
    def validate_dni(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El DNI debe contener solo números")
        if len(value) != 8:
            raise serializers.ValidationError("El DNI debe tener exactamente 8 dígitos")
        if CustomUser.objects.filter(dni=value).exists():
            raise serializers.ValidationError("Este DNI ya está registrado")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['password'] = make_password(validated_data['password'])
        # Generate username from email
        validated_data['username'] = validated_data['email']
        return CustomUser.objects.create(**validated_data)


# Serializers para el sistema de cursos e inscripciones
class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__'

# Serializers para exámenes
class OpcionRespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcionRespuesta
        fields = ['id', 'texto_opcion', 'orden']

class PreguntaSerializer(serializers.ModelSerializer):
    opciones = OpcionRespuestaSerializer(many=True, read_only=True, source='opcionrespuesta_set')
    
    class Meta:
        model = Pregunta
        fields = ['id', 'texto_pregunta', 'tipo', 'orden', 'opciones', 'imagen_pregunta', 'respuesta_correcta']

class ExamenSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True, source='pregunta_set')
    
    class Meta:
        model = Examen
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'tiempo_limite', 'puntaje_minimo', 'fecha_creacion', 'preguntas']

class ExamenListSerializer(serializers.ModelSerializer):
    """Serializer para listar exámenes sin incluir las preguntas"""
    class Meta:
        model = Examen
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'tiempo_limite', 'puntaje_minimo', 'fecha_creacion']

class IntentarExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntentarExamen
        fields = ['id', 'examen', 'usuario', 'fecha_inicio', 'fecha_finalizacion', 'puntaje_obtenido', 'aprobado', 'respuestas_json']
        read_only_fields = ['id', 'fecha_inicio', 'puntaje_obtenido', 'aprobado']


class InscripcionSerializer(serializers.ModelSerializer):
    usuario_info = UserSerializer(source='usuario', read_only=True)
    curso_info = CursoSerializer(source='curso', read_only=True)
    
    class Meta:
        model = Inscripcion
        fields = '__all__'


class InscripcionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscripcion
        fields = [
            'usuario', 'curso', 'metodo_pago', 'comprobante_pago', 
            'comentarios', 'estado_pago', 'fecha_inicio', 'fecha_examen_teorico', 'fecha_examen_practico'
        ]


class ExamenSerializer(serializers.ModelSerializer):
    curso_info = CursoSerializer(source='curso', read_only=True)
    
    class Meta:
        model = Examen
        fields = '__all__'


class OpcionRespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcionRespuesta
        fields = '__all__'


class PreguntaSerializer(serializers.ModelSerializer):
    opciones = OpcionRespuestaSerializer(many=True, read_only=True)
    imagen_pregunta = serializers.ImageField(use_url=True, allow_null=True, required=False)
    class Meta:
        model = Pregunta
        fields = '__all__'


class IntentarExamenSerializer(serializers.ModelSerializer):
    usuario_info = UserSerializer(source='usuario', read_only=True)
    examen_info = ExamenSerializer(source='examen', read_only=True)
    
    class Meta:
        model = IntentarExamen
        fields = '__all__'
