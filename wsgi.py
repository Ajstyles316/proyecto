import os
import sys
from django.core.wsgi import get_wsgi_application

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gestion_maquinaria'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_maquinaria.settings')

try:
    application = get_wsgi_application()
except Exception as e:
    print(f"Error loading Django: {e}")
    raise
