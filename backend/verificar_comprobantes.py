#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import Inscripcion

print("🔍 === VERIFICACIÓN DE COMPROBANTES EN BD ===")
print()

inscripciones = Inscripcion.objects.all().order_by('-fecha_inscripcion')

for inscripcion in inscripciones:
    print(f"📋 Inscripción ID: {inscripcion.id}")
    print(f"   Usuario: {inscripcion.usuario.email}")
    print(f"   Curso: {inscripcion.curso.nombre}")
    print(f"   Fecha: {inscripcion.fecha_inscripcion}")
    print(f"   Comprobante (BD): '{inscripcion.comprobante_pago}'")
    print(f"   Comprobante (archivo): {inscripcion.comprobante_pago.name if inscripcion.comprobante_pago else 'Sin archivo'}")
    if inscripcion.comprobante_pago:
        print(f"   Ruta completa: {inscripcion.comprobante_pago.path if hasattr(inscripcion.comprobante_pago, 'path') else 'No disponible'}")
        print(f"   URL: {inscripcion.comprobante_pago.url if hasattr(inscripcion.comprobante_pago, 'url') else 'No disponible'}")
    print("   " + "-"*50)
    print()

print("✅ Verificación completada")
