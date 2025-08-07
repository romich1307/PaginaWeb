from django.db import models
from django.contrib.auth.models import AbstractUser

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
