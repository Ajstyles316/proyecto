from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

class CorsMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Agregar headers CORS a todas las respuestas
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Email, X-CSRFToken, Accept, Origin, User-Agent'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        
        # Log para debug
        logger.info(f"CORS headers added to {request.path}")
        
        return response

    def process_request(self, request):
        # Manejar preflight requests
        if request.method == 'OPTIONS':
            response = JsonResponse({})
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Email, X-CSRFToken, Accept, Origin, User-Agent'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'
            return response
        return None
