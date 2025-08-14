#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import CustomUser, Curso, Examen, IntentarExamen
from django.utils import timezone

def crear_datos_examenes_practicos():
    print("🔄 Creando datos de prueba para exámenes prácticos...")
    
    # Buscar exámenes prácticos existentes
    examenes_practicos = Examen.objects.filter(tipo='practico')
    print(f"📝 Exámenes prácticos encontrados: {examenes_practicos.count()}")
    
    if examenes_practicos.exists():
        # Usar exámenes existentes
        examen = examenes_practicos.first()
        print(f"✅ Usando examen existente: {examen.nombre}")
    else:
        # Crear un examen práctico de prueba
        curso = Curso.objects.first()
        if not curso:
            print("❌ No hay cursos disponibles. Ejecuta import_data.py primero.")
            return
        
        examen = Examen.objects.create(
            curso=curso,
            nombre='Examen Práctico de Excel Avanzado',
            tipo='practico',
            descripcion='Examen práctico donde el estudiante debe demostrar sus habilidades en Excel creando tablas dinámicas, gráficos y fórmulas complejas.',
            cantidad_preguntas=0,  # No tiene preguntas, es evaluación práctica
            tiempo_limite=120,     # 2 horas
            puntaje_minimo=70.0
        )
        print(f"✅ Examen práctico creado: {examen.nombre}")
    
    # Buscar usuarios estudiantes (no admin)
    usuarios = CustomUser.objects.filter(is_staff=False, email__isnull=False)[:4]
    
    if not usuarios.exists():
        print("❌ No hay usuarios estudiantes. Creando algunos...")
        # Crear algunos usuarios de prueba
        for i in range(3):
            usuario = CustomUser.objects.create_user(
                email=f'estudiante{i+1}@test.com',
                password='test123',
                first_name=f'Estudiante{i+1}',
                last_name=f'Apellido{i+1}'
            )
            usuarios = list(usuarios) + [usuario]
    
    print(f"👥 Usuarios encontrados: {len(usuarios)}")
    
    # Crear intentos de examen práctico pendientes
    intentos_creados = 0
    for i, usuario in enumerate(usuarios):
        # Verificar si ya existe un intento para este usuario y examen
        intento_existente = IntentarExamen.objects.filter(
            usuario=usuario,
            examen=examen
        ).first()
        
        if not intento_existente:
            intento = IntentarExamen.objects.create(
                usuario=usuario,
                examen=examen,
                estado='iniciado',
                resultado_practico='pendiente',
                fecha_inicio=timezone.now()
            )
            print(f"📋 Intento creado para: {usuario.email}")
            intentos_creados += 1
        else:
            print(f"⚠️  Intento ya existe para: {usuario.email}")
    
    print(f"\n🎉 Proceso completado!")
    print(f"📊 Total intentos creados: {intentos_creados}")
    print(f"📝 Examen: {examen.nombre}")
    print(f"🏫 Curso: {examen.curso.nombre}")
    
    # Mostrar resumen
    pendientes = IntentarExamen.objects.filter(
        examen__tipo='practico',
        resultado_practico__in=['pendiente', None]
    ).count()
    
    print(f"\n📈 Resumen actual:")
    print(f"🎯 Exámenes prácticos pendientes: {pendientes}")

if __name__ == '__main__':
    crear_datos_examenes_practicos()
