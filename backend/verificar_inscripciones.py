#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import Inscripcion, CustomUser, Curso

print("📋 === VERIFICACIÓN DE INSCRIPCIONES ===")
print()

# Verificar todas las inscripciones
print("👥 TODAS LAS INSCRIPCIONES:")
inscripciones = Inscripcion.objects.all()
for inscripcion in inscripciones:
    print(f"   Usuario: {inscripcion.usuario.email}")
    print(f"   Curso: {inscripcion.curso.nombre}")
    print(f"   Estado Pago: {inscripcion.estado_pago}")
    print(f"   Método Pago: {inscripcion.metodo_pago}")
    print(f"   Fecha: {inscripcion.fecha_inscripcion}")
    print("   " + "-"*50)

print()

# Verificar específicamente Líquidos Penetrantes II
print("🔬 INSCRIPCIONES EN LÍQUIDOS PENETRANTES II:")
try:
    curso_lp2 = Curso.objects.get(nombre__icontains="Líquidos Penetrantes II")
    inscripciones_lp2 = Inscripcion.objects.filter(curso=curso_lp2)
    
    if inscripciones_lp2.exists():
        for inscripcion in inscripciones_lp2:
            print(f"   👤 {inscripcion.usuario.email}")
            print(f"   📊 Estado Pago: {inscripcion.estado_pago}")
            print(f"   💳 Método: {inscripcion.metodo_pago}")
            print("   " + "-"*30)
    else:
        print("   ❌ No hay inscripciones en este curso")
        
except Curso.DoesNotExist:
    print("   ❌ Curso no encontrado")

print()

# Crear inscripción de prueba si no existe
print("🛠️  CREANDO INSCRIPCIÓN DE PRUEBA...")
try:
    # Buscar usuario admin
    admin_user = CustomUser.objects.filter(email='jiji@gmail.com').first()
    if not admin_user:
        print("   ❌ Usuario admin no encontrado")
    else:
        curso_lp2 = Curso.objects.get(nombre__icontains="Líquidos Penetrantes II")
        
        # Verificar si ya existe inscripción
        inscripcion_existente = Inscripcion.objects.filter(
            usuario=admin_user,
            curso=curso_lp2
        ).first()
        
        if inscripcion_existente:
            print(f"   ℹ️  Inscripción ya existe: {inscripcion_existente.estado_pago}")
            
            # Actualizar para que esté verificada
            inscripcion_existente.estado_pago = 'verificado'
            inscripcion_existente.save()
            print("   ✅ Inscripción actualizada a 'verificado'")
        else:
            # Crear nueva inscripción
            nueva_inscripcion = Inscripcion.objects.create(
                usuario=admin_user,
                curso=curso_lp2,
                estado_pago='verificado',
                metodo_pago='transferencia'
            )
            print(f"   ✅ Nueva inscripción creada para {admin_user.email}")
            
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("✅ Verificación de inscripciones completada")
