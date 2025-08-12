# Importamos todos los modelos para que estén disponibles
from .user import CustomUser
from .curso import Curso
from .inscripcion import Inscripcion
from .examen import Examen, Pregunta, OpcionRespuesta, IntentarExamen

# Exportamos todos los modelos
__all__ = [
    'CustomUser',
    'Curso', 
    'Inscripcion',
    'Examen',
    'Pregunta',
    'OpcionRespuesta',
    'IntentarExamen',
]
