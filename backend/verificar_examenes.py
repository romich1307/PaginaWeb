#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import Examen, Curso, Pregunta, IntentarExamen, CustomUser

print("🔍 === VERIFICACIÓN DE EXÁMENES ===")
print()

# Verificar exámenes existentes
print("📚 EXÁMENES DISPONIBLES:")
examenes = Examen.objects.all()
if examenes.exists():
    for examen in examenes:
        preguntas_count = examen.preguntas.filter(activo=True).count()
        print(f"   ID: {examen.id} | {examen.nombre}")
        print(f"   Curso: {examen.curso.nombre} | Tipo: {examen.tipo}")
        print(f"   Activo: {examen.activo} | Preguntas: {preguntas_count}")
        print("   " + "-"*50)
else:
    print("   ❌ No hay exámenes creados")

print()

# Verificar cursos
print("🏫 CURSOS DISPONIBLES:")
cursos = Curso.objects.all()
for curso in cursos:
    examenes_curso = Examen.objects.filter(curso=curso).count()
    print(f"   ID: {curso.id} | {curso.nombre} | Exámenes: {examenes_curso}")

print()

# Verificar usuarios e intentos
print("👥 USUARIOS E INTENTOS:")
usuarios = CustomUser.objects.all()
for usuario in usuarios:
    intentos = IntentarExamen.objects.filter(usuario=usuario).count()
    print(f"   {usuario.email} | Intentos: {intentos}")

print()

# Verificar curso específico "Líquidos Penetrantes II"
print("🔬 VERIFICACIÓN ESPECÍFICA - LÍQUIDOS PENETRANTES II:")
try:
    curso_lp2 = Curso.objects.get(nombre__icontains="Líquidos Penetrantes II")
    print(f"   ✅ Curso encontrado: {curso_lp2.nombre} (ID: {curso_lp2.id})")
    
    examenes_lp2 = Examen.objects.filter(curso=curso_lp2)
    print(f"   📝 Exámenes en este curso: {examenes_lp2.count()}")
    
    for examen in examenes_lp2:
        preguntas = examen.preguntas.filter(activo=True).count()
        print(f"      - {examen.nombre} ({examen.tipo}) - {preguntas} preguntas - Activo: {examen.activo}")
        
except Curso.DoesNotExist:
    print("   ❌ Curso 'Líquidos Penetrantes II' no encontrado")

print()
print("✅ Verificación completada")
