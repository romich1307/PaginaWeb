import requests

# Configura estos valores con los datos de tu proyecto Supabase
SUPABASE_URL = "https://<tu-proyecto>.supabase.co"  # Ejemplo: https://abcd1234.supabase.co
SUPABASE_BUCKET = "media"  # El nombre del bucket que creaste
SUPABASE_API_KEY = "<TU_API_KEY>"  # Usa la API Key de servicio (service_role)

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
