#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import Inscripcion, CustomUser, Curso

print("🎯 === ASEGURAR ACCESO A EXÁMENES ===")
print()

# Crear inscripciones para TODOS los usuarios en Líquidos Penetrantes II
print("👥 CREANDO INSCRIPCIONES PARA TODOS LOS USUARIOS...")

try:
    curso_lp2 = Curso.objects.get(nombre__icontains="Líquidos Penetrantes II")
    print(f"✅ Curso encontrado: {curso_lp2.nombre} (ID: {curso_lp2.id})")
    
    # Obtener todos los usuarios
    usuarios = CustomUser.objects.all()
    print(f"📋 Total de usuarios: {usuarios.count()}")
    
    for usuario in usuarios:
        # Verificar si ya tiene inscripción
        inscripcion_existente = Inscripcion.objects.filter(
            usuario=usuario,
            curso=curso_lp2
        ).first()
        
        if inscripcion_existente:
            # Asegurar que esté verificada
            inscripcion_existente.estado_pago = 'verificado'
            inscripcion_existente.save()
            print(f"   ✅ {usuario.email} - inscripción verificada")
        else:
            # Crear nueva inscripción
            nueva_inscripcion = Inscripcion.objects.create(
                usuario=usuario,
                curso=curso_lp2,
                estado_pago='verificado',
                metodo_pago='transferencia'
            )
            print(f"   🆕 {usuario.email} - nueva inscripción creada")
    
    print()
    print("🔍 VERIFICACIÓN FINAL - USUARIOS CON ACCESO:")
    inscripciones_verificadas = Inscripcion.objects.filter(
        curso=curso_lp2,
        estado_pago='verificado'
    )
    
    for inscripcion in inscripciones_verificadas:
        print(f"   ✅ {inscripcion.usuario.email} - VERIFICADO")
    
    print()
    print(f"🎉 Total usuarios con acceso: {inscripciones_verificadas.count()}")
    print("💡 Ahora CUALQUIER usuario puede ver los exámenes de Líquidos Penetrantes II")
    
except Curso.DoesNotExist:
    print("❌ Curso 'Líquidos Penetrantes II' no encontrado")
except Exception as e:
    print(f"❌ Error: {e}")

print()
print("✅ Proceso completado")
