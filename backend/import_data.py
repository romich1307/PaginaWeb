#!/usr/bin/env python
"""
Script para importar datos JSON a PostgreSQL después de la migración
"""
import os
import sys
import django
import json
from django.core import serializers
from django.core.management import call_command

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def importar_datos():
    """Importa todos los datos de los archivos JSON a PostgreSQL"""
    
    backup_dir = 'data_backup'
    
    # Verificar que los archivos existan
    archivos_requeridos = ['usuarios.json', 'cursos.json', 'inscripciones.json']
    for archivo in archivos_requeridos:
        if not os.path.exists(f'{backup_dir}/{archivo}'):
            print(f"❌ Error: No se encontró el archivo {archivo}")
            return
    
    print("🔄 Importando datos a PostgreSQL...")
    
    # Orden de importación (importante por las relaciones)
    orden_importacion = [
        ('usuarios.json', 'Usuarios'),
        ('cursos.json', 'Cursos'),
        ('inscripciones.json', 'Inscripciones'),
        ('examenes.json', 'Exámenes'),
        ('preguntas.json', 'Preguntas')
    ]
    
    for archivo, descripcion in orden_importacion:
        archivo_path = f'{backup_dir}/{archivo}'
        if os.path.exists(archivo_path):
            try:
                print(f"📥 Importando {descripcion}...")
                call_command('loaddata', archivo_path)
                print(f"✅ {descripcion} importados correctamente")
            except Exception as e:
                print(f"❌ Error importando {descripcion}: {e}")
        else:
            print(f"⚠️  Archivo {archivo} no encontrado, saltando...")
    
    print("\n🎉 Proceso de importación completado!")
    print("Verifica que todos los datos se hayan importado correctamente.")

if __name__ == '__main__':
    print("⚠️  IMPORTANTE: Asegúrate de que:")
    print("1. La configuración de PostgreSQL esté correcta en .env")
    print("2. Las migraciones se hayan ejecutado (python manage.py migrate)")
    print("3. La base de datos esté vacía o preparada para recibir datos")
    print()
    
    respuesta = input("¿Continuar con la importación? (s/n): ")
    if respuesta.lower() in ['s', 'si', 'sí', 'y', 'yes']:
        importar_datos()
    else:
        print("Importación cancelada.")
