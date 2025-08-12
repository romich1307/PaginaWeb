#!/usr/bin/env python
"""
Script para probar la conexión a PostgreSQL/Supabase
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def probar_conexion():
    """Prueba la conexión a la base de datos"""
    
    # Probar con DATABASE_URL
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        print("🔄 Probando conexión con DATABASE_URL...")
        try:
            conn = psycopg2.connect(database_url)
            print("✅ Conexión exitosa con DATABASE_URL!")
            conn.close()
            return True
        except Exception as e:
            print(f"❌ Error con DATABASE_URL: {e}")
    
    # Probar con variables individuales
    host = os.getenv('DB_HOST')
    if host:
        print("🔄 Probando conexión con variables individuales...")
        try:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                port=os.getenv('DB_PORT', '5432'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
                database=os.getenv('DB_NAME')
            )
            print("✅ Conexión exitosa con variables individuales!")
            conn.close()
            return True
        except Exception as e:
            print(f"❌ Error con variables individuales: {e}")
    
    print("❌ No se pudo establecer conexión con ningún método")
    return False

if __name__ == '__main__':
    print("Probando conexión a PostgreSQL/Supabase...")
    print(f"HOST: {os.getenv('DB_HOST')}")
    print(f"PORT: {os.getenv('DB_PORT')}")
    print(f"USER: {os.getenv('DB_USER')}")
    print(f"DATABASE: {os.getenv('DB_NAME')}")
    print()
    
    probar_conexion()
