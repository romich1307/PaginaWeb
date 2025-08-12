# Instrucciones para configurar Supabase

## Paso 1: Crear cuenta y proyecto en Supabase

1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Haz clic en "New Project"
5. Selecciona tu organización
6. Completa los campos:
   - Name: "PaginaWeb" (o el nombre que prefieras)
   - Database Password: Crea una contraseña segura (¡GUÁRDALA!)
   - Region: Selecciona la más cercana a tu ubicación
7. Haz clic en "Create new project"

## Paso 2: Obtener credenciales de conexión

1. Una vez creado el proyecto, ve a Settings (Configuración) en el menú lateral
2. Haz clic en "Database"
3. Busca la sección "Connection string" o "Connection info"
4. Anota los siguientes datos:
   - Host: algo como db.xxxxxxxxxxxxxx.supabase.co
   - Database name: postgres
   - Port: 5432
   - User: postgres
   - Password: la que creaste en el paso anterior

## Paso 3: Actualizar archivo .env

Abre el archivo backend/.env y actualiza con tus credenciales reales:

```
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real
DB_HOST=db.xxxxxxxxxxxxxx.supabase.co
DB_PORT=5432
```

## Paso 4: Probar conexión

Una vez que hayas actualizado el .env, ejecuta:
```bash
cd backend
python manage.py check
```

Si no hay errores, continúa con:
```bash
python manage.py migrate
```

## Nota importante:
- Guarda bien tus credenciales de Supabase
- La base de datos estará disponible desde cualquier computadora con internet
- Los datos se sincronizarán automáticamente
