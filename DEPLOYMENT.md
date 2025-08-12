# 🚀 Instrucciones de Despliegue - Sistema de Gestión de Cursos

## 📋 Requisitos Previos
- Python 3.10 o superior
- Node.js 16 o superior
- Git

## 🔧 Configuración del Backend

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd PaginaWeb
```

### 2. Crear entorno virtual
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

### 3. Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
Crear archivo `.env` en la carpeta `backend/` con:
```
DATABASE_URL=postgresql://postgres.cmfyuqfevyzesbqfzmbx:M1Proyecto2025!@aws-0-us-east-2.pooler.supabase.com:6543/postgres
SECRET_KEY=django-insecure-change-this-key
DEBUG=True
```

### 5. Ejecutar migraciones
```bash
python manage.py migrate
```

### 6. Importar datos (opcional)
```bash
python import_data.py
```

### 7. Crear superusuario (opcional)
```bash
python manage.py createsuperuser
```

### 8. Iniciar servidor backend
```bash
python manage.py runserver
```
El backend estará disponible en: http://localhost:8000

## 🎨 Configuración del Frontend

### 1. Navegar a la carpeta frontend
```bash
cd frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
El frontend estará disponible en: http://localhost:5173

## 🔑 Credenciales de Administrador
- Email: jiji@gmail.com
- Contraseña: (configurar durante el proceso)

## 📊 Base de Datos
- **Producción**: PostgreSQL en Supabase (configurado automáticamente)
- **Desarrollo local**: SQLite (si no se configura Supabase)

## 🌐 URLs del Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:5173/admin

## 🛠️ Funcionalidades Principales
- ✅ Gestión completa de cursos
- ✅ Sistema de inscripciones
- ✅ Panel de administración
- ✅ Autenticación de usuarios
- ✅ Base de datos en la nube
- ✅ Edición en tiempo real
- ✅ Interfaz responsiva

## 🔄 Actualizaciones
Para actualizar el sistema en otra computadora:
1. `git pull` para obtener cambios
2. `pip install -r requirements.txt` para nuevas dependencias
3. `python manage.py migrate` para nuevas migraciones
4. `npm install` para nuevas dependencias de frontend

## 📝 Notas Importantes
- La base de datos está en Supabase y es accesible desde cualquier computadora
- Los datos se sincronizan automáticamente
- Asegúrate de tener las credenciales correctas en el archivo `.env`
