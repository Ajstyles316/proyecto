from django.core.wsgi import get_wsgi_application
import os
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_maquinaria.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

application = get_wsgi_application()
