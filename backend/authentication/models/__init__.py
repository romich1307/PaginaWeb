# Importamos todos los modelos para que estén disponibles
from .user import CustomUser
from .curso import Curso
from .inscripcion import Inscripcion
from .examen import Examen, ExamenUsuario, Pregunta, OpcionRespuesta, IntentarExamen

# Exportamos todos los modelos
__all__ = [
    'CustomUser',
    'Curso', 
    'Inscripcion',
    'Examen',
    'ExamenUsuario',
    'Pregunta',
    'OpcionRespuesta',
    'IntentarExamen',
]
