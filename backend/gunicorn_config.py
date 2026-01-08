# Configuración optimizada de Gunicorn para Render Free Tier
import multiprocessing
import os

# Número de workers (reducido para ahorrar memoria)
workers = 1

# Tipo de worker
worker_class = 'sync'

# Timeout incrementado para requests lentos
timeout = 120

# Mantener conexiones vivas
keepalive = 5

# Bind
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Preload app para ahorrar memoria
preload_app = True

# Max requests por worker (reinicia workers para evitar memory leaks)
max_requests = 100
max_requests_jitter = 20
