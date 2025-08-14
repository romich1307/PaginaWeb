import os
import django
import sys
from datetime import date, timedelta

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import CustomUser, Curso, Examen, IntentarExamen

def crear_datos_prueba_examenes():
    """
    Crear algunos intentos de examen práctico para probar la funcionalidad del admin
    """
    print("🚀 Creando datos de prueba para exámenes prácticos...")
    
    try:
        # Obtener algunos usuarios (estudiantes)
        estudiantes = CustomUser.objects.filter(is_staff=False)[:3]
        if not estudiantes:
            print("❌ No hay estudiantes disponibles. Creando estudiantes de prueba...")
            # Crear estudiantes de prueba
            estudiante1 = CustomUser.objects.create_user(
                email='estudiante1@test.com',
                username='estudiante1@test.com',
                password='password123',
                first_name='Juan',
                last_name='Pérez'
            )
            estudiante2 = CustomUser.objects.create_user(
                email='estudiante2@test.com',
                username='estudiante2@test.com',
                password='password123',
                first_name='María',
                last_name='García'
            )
            estudiante3 = CustomUser.objects.create_user(
                email='estudiante3@test.com',
                username='estudiante3@test.com',
                password='password123',
                first_name='Carlos',
                last_name='López'
            )
            estudiantes = [estudiante1, estudiante2, estudiante3]
            print("✅ Estudiantes de prueba creados")
        
        # Obtener exámenes prácticos
        examenes_practicos = Examen.objects.filter(tipo='practico')
        if not examenes_practicos:
            print("❌ No hay exámenes prácticos disponibles")
            return
        
        print(f"📚 Encontrados {examenes_practicos.count()} exámenes prácticos")
        
        # Crear intentos de examen práctico
        hoy = date.today()
        manana = hoy + timedelta(days=1)
        
        intentos_creados = 0
        
        for i, estudiante in enumerate(estudiantes):
            for j, examen in enumerate(examenes_practicos[:2]):  # Solo los primeros 2 exámenes
                # Verificar si ya existe un intento
                existe = IntentarExamen.objects.filter(
                    usuario=estudiante,
                    examen=examen
                ).exists()
                
                if not existe:
                    # Crear intento de examen práctico
                    intento = IntentarExamen.objects.create(
                        usuario=estudiante,
                        examen=examen,
                        estado='iniciado',
                        resultado_practico='pendiente'
                    )
                    
                    # Programar algunos para hoy y otros sin programar
                    if intentos_creados % 2 == 0:
                        intento.fecha_programada_practica = hoy
                        intento.save()
                        print(f"  📅 Examen de {estudiante.first_name} programado para HOY ({examen.nombre})")
                    else:
                        print(f"  ⏳ Examen de {estudiante.first_name} sin programar ({examen.nombre})")
                    
                    intentos_creados += 1
        
        print(f"\n✅ ¡Datos de prueba creados exitosamente!")
        print(f"📊 Resumen:")
        print(f"   - Estudiantes: {len(estudiantes)}")
        print(f"   - Intentos de examen creados: {intentos_creados}")
        print(f"   - Programados para hoy: {IntentarExamen.objects.filter(fecha_programada_practica=hoy).count()}")
        print(f"   - Sin programar: {IntentarExamen.objects.filter(fecha_programada_practica__isnull=True, resultado_practico='pendiente').count()}")
        
        print(f"\n🎯 Para ver los exámenes en el admin:")
        print(f"   1. Ve al panel de administración")
        print(f"   2. Haz clic en 'Exámenes'")
        print(f"   3. Selecciona 'Programados Hoy' para ver los exámenes de hoy")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    crear_datos_prueba_examenes()
