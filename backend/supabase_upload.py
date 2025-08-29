import requests

# Configura estos valores con los datos de tu proyecto Supabase
SUPABASE_URL = "https://cmfyuqfevyzesbqfzmbx.supabase.co"  # URL real de tu proyecto
SUPABASE_BUCKET = "media"  # El nombre del bucket que creaste
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZnl1cWZldnl6ZXNicWZ6bWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk2MTc2NywiZXhwIjoyMDcwNTM3NzY3fQ.UF5ypJSRj33yJhPj5fLmkKWTDpYnVXJfKFrZn25J0xY"  # API Key real

def upload_file_to_supabase(file_path, file_name):
    """
    Sube un archivo a Supabase Storage y retorna la URL pública.
    file_path: ruta local del archivo
    file_name: nombre con el que se guardará en Supabase
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/octet-stream"
    }
    with open(file_path, "rb") as f:
        response = requests.put(url, headers=headers, data=f)
    if response.status_code == 200:
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_name}"
        return public_url
    else:
        print("Error al subir:", response.text)
        return None
