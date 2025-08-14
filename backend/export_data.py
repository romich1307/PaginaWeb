#!/usr/bin/env python
"""
Script para exportar datos de SQLite a JSON antes de migrar a PostgreSQL
"""
import os
import sys
import django
import json
from django.core import serializers

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import CustomUser, Curso, Inscripcion, Examen, Pregunta, IntentarExamen

def exportar_datos():
    """Exporta todos los datos importantes a archivos JSON"""
    
    # Crear directorio de backup si no existe
    backup_dir = 'data_backup'
    os.makedirs(backup_dir, exist_ok=True)
    
    # Exportar usuarios
    usuarios = CustomUser.objects.all()
    with open(f'{backup_dir}/usuarios.json', 'w', encoding='utf-8') as f:
        serialized_data = serializers.serialize('json', usuarios, indent=2)
        f.write(serialized_data)
    print(f"✅ Exportados {usuarios.count()} usuarios")
    
    # Exportar cursos
    cursos = Curso.objects.all()
    with open(f'{backup_dir}/cursos.json', 'w', encoding='utf-8') as f:
        serialized_data = serializers.serialize('json', cursos, indent=2)
        f.write(serialized_data)
    print(f"✅ Exportados {cursos.count()} cursos")
    
    # Exportar inscripciones
    inscripciones = Inscripcion.objects.all()
    with open(f'{backup_dir}/inscripciones.json', 'w', encoding='utf-8') as f:
        serialized_data = serializers.serialize('json', inscripciones, indent=2)
        f.write(serialized_data)
    print(f"✅ Exportadas {inscripciones.count()} inscripciones")
    
    # Exportar exámenes
    examenes = Examen.objects.all()
    if examenes.exists():
        with open(f'{backup_dir}/examenes.json', 'w', encoding='utf-8') as f:
            serialized_data = serializers.serialize('json', examenes, indent=2)
            f.write(serialized_data)
        print(f"✅ Exportados {examenes.count()} exámenes")
    
    # Exportar preguntas
    preguntas = Pregunta.objects.all()
    if preguntas.exists():
        with open(f'{backup_dir}/preguntas.json', 'w', encoding='utf-8') as f:
            serialized_data = serializers.serialize('json', preguntas, indent=2)
            f.write(serialized_data)
        print(f"✅ Exportadas {preguntas.count()} preguntas")
    
    print(f"\n🎉 Datos exportados exitosamente en el directorio '{backup_dir}'")
    print("Estos archivos se pueden usar para importar los datos en PostgreSQL")

if __name__ == '__main__':
    exportar_datos()
