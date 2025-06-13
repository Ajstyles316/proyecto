from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from bson import ObjectId, json_util
import json, requests

import logging
from django.views.decorators.csrf import csrf_exempt
from .models import Maquinaria
from .serializers import (
    MaquinariaSerializer,
    RegistroSerializer,
    LoginSerializer,
)
from .models import Usuario
from django.conf import settings
from datetime import datetime

logger = logging.getLogger(__name__)

def format_date(date_str):
    """Formatea una fecha a ISO o retorna None si es inválida"""
    if not date_str:
        return None
    try:
        if isinstance(date_str, datetime):
            return date_str.isoformat()
        return datetime.fromisoformat(date_str.replace('Z', '+00:00')).isoformat()
    except (ValueError, TypeError):
        return None

def clean_machine_data(machine):
    """Limpia y formatea los datos de una máquina"""
    if not isinstance(machine, dict):
        return {}
        
    # Convertir ObjectId a string
    if '_id' in machine:
        machine['_id'] = str(machine['_id'])
    
    # Formatear fechas
    date_fields = ['fechaRegistro', 'fechaAsignacion', 'fechaLiberacion', 'fechaIngreso']
    for field in date_fields:
        if field in machine:
            machine[field] = format_date(machine[field])
    
    # Limpiar campos anidados
    if 'historial' in machine and isinstance(machine['historial'], list):
        for h in machine['historial']:
            if isinstance(h, dict) and 'fechaIngreso' in h:
                h['fechaIngreso'] = format_date(h['fechaIngreso'])
    
    return machine

@csrf_exempt
def maquinaria_list(request):
    if request.method == "GET":
        try:
            # Obtener todas las máquinas
            maquinarias = list(settings.MAQUINARIA_COLLECTION.find())
            
            # Limpiar y formatear cada máquina
            cleaned_data = [clean_machine_data(m) for m in maquinarias]
            
            return JsonResponse(cleaned_data, safe=False)
        except Exception as e:
            logger.error(f"Error al obtener maquinarias: {str(e)}")
            return JsonResponse({"error": f"Error al obtener datos: {str(e)}"}, status=500)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            required_fields = ['placa', 'gestion', 'detalle', 'unidad', 'tipo', 'marca', 'modelo']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return JsonResponse({
                    "error": f"Campos requeridos faltantes: {', '.join(missing_fields)}"
                }, status=400)
            
            # Verificar si la placa ya existe
            if settings.MAQUINARIA_COLLECTION.find_one({"placa": data['placa']}):
                return JsonResponse({"error": "Ya existe una máquina con esta placa"}, status=400)
            
            # Limpiar y formatear datos antes de insertar
            cleaned_data = clean_machine_data(data)
            
            # Insertar la máquina
            result = settings.MAQUINARIA_COLLECTION.insert_one(cleaned_data)
            cleaned_data['_id'] = str(result.inserted_id)
            
            return JsonResponse(cleaned_data, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            logger.error(f"Error al crear maquinaria: {str(e)}")
            return JsonResponse({"error": f"Error al crear registro: {str(e)}"}, status=500)

@csrf_exempt
def maquinaria_detail(request, id):
    if not ObjectId.is_valid(id):
        return JsonResponse({"error": "ID inválido"}, status=400)

    try:
        maquinaria = settings.MAQUINARIA_COLLECTION.find_one({"_id": ObjectId(id)})
        if not maquinaria:
            return JsonResponse({"error": "Máquina no encontrada"}, status=404)
            
        # Limpiar y formatear datos
        maquinaria = clean_machine_data(maquinaria)

        if request.method == "GET":
            return JsonResponse(maquinaria)

        elif request.method == "PUT":
            try:
                data = json.loads(request.body)
                # Limpiar y formatear datos antes de actualizar
                cleaned_data = clean_machine_data(data)
                
                # Actualizar la máquina
                settings.MAQUINARIA_COLLECTION.update_one(
                    {"_id": ObjectId(id)},
                    {"$set": cleaned_data}
                )
                return JsonResponse({**maquinaria, **cleaned_data})
                
            except json.JSONDecodeError:
                return JsonResponse({"error": "JSON inválido"}, status=400)
            except Exception as e:
                logger.error(f"Error al actualizar maquinaria: {str(e)}")
                return JsonResponse({"error": str(e)}, status=500)

        elif request.method == "DELETE":
            try:
                settings.MAQUINARIA_COLLECTION.delete_one({"_id": ObjectId(id)})
                return JsonResponse({"status": "Eliminado"})
            except Exception as e:
                logger.error(f"Error al eliminar maquinaria: {str(e)}")
                return JsonResponse({"error": str(e)}, status=500)

    except Exception as e:
        logger.error(f"Error en maquinaria_detail: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

RECAPTCHA_SECRET_KEY = '6LeCz1orAAAAAANrHmd4oJFnaoSyPglm2I6bb4Z9'
class RegistroView(APIView):
    model_class = Usuario
    serializer_class = RegistroSerializer

    def post(self, request):
        try:
            data = dict(request.data)
            print("Datos recibidos:", data)  # ✅ Imprime todo el payload para validar

            # Validar reCAPTCHA
            captcha_token = data.get('captchaToken')
            if not captcha_token:
                return Response({'error': 'El CAPTCHA es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar con Google
            verify_url = 'https://www.google.com/recaptcha/api/siteverify' 
            response = requests.post(verify_url, data={
                'secret': RECAPTCHA_SECRET_KEY,
                'response': captcha_token
            })
            result = response.json()

            if not result.get('success'):
                return Response({'error': 'Fallo en la verificación del CAPTCHA'}, status=status.HTTP_400_BAD_REQUEST)

            # Validación del serializador
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                print("Errores del serializador:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Eliminar campos innecesarios
            data.pop("confirmPassword", None)
            data.pop("captchaToken", None)

            # Encriptar contraseña
            data["Password"] = bcrypt.hashpw(
                data["Password"].encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            # Guardar en MongoDB
            collection = get_collection(self.model_class)
            result_db = collection.insert_one(data)
            inserted = collection.find_one({"_id": result_db.inserted_id})

            return Response(json.loads(json_util.dumps(inserted)), status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Error al registrar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    model_class = Usuario
    serializer_class = LoginSerializer  # ✅ Cambiamos el serializador

    def post(self, request):
        try:
            data = dict(request.data)
            print("Datos recibidos:", data)

            # Usamos el nuevo LoginSerializer
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                print("Errores del serializador:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            collection = get_collection(self.model_class)
            user = collection.find_one({"Email": data["Email"]})
            if not user:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            if not bcrypt.checkpw(data["Password"].encode("utf-8"), user["Password"].encode("utf-8")):
                return Response({"error": "Contraseña inválida"}, status=status.HTTP_401_UNAUTHORIZED)

            return Response(json.loads(json_util.dumps(user)), status=status.HTTP_200_OK)

        except Exception as e:
            print("Error interno:", str(e))
            return Response(
                {"error": f"Error al iniciar sesión: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
from .mongo_connection import get_collection
import bcrypt
class DashboardStatsView(APIView):
    def get(self, request):
        seguro_col = get_collection(Seguro)
        mantenimiento_col = get_collection(Mantenimiento)
        control_col = get_collection(Control)

        total_seguros = seguro_col.count_documents({})
        mantenimientos_pendientes = mantenimiento_col.count_documents({"estado": "PENDIENTE"})
        unidades_en_control = control_col.count_documents({})
        horas_totales_operativas = sum(doc.get('horasOperacion', 0) for doc in mantenimiento_col.find())

        data = [
            {"title": "Total de Seguros", "value": str(total_seguros), "icon": "mdi:file-document-outline", "color": "primary.main"},
            {"title": "Mantenimientos Pendientes", "value": str(mantenimientos_pendientes), "icon": "mdi:wrench", "color": "warning.main"},
            {"title": "Unidades en Control", "value": str(unidades_en_control), "icon": "mdi:truck-fast", "color": "success.main"},
            {"title": "Horas Totales Operativas", "value": f"{horas_totales_operativas:,}", "icon": "mdi:clock-time-eight", "color": "info.main"},
        ]
        return Response(data)

@csrf_exempt
def maquinaria_options(request):
    if request.method == "GET":
        try:
            # Obtener todas las máquinas
            maquinarias = list(settings.MAQUINARIA_COLLECTION.find())
            
            # Inicializar diccionario de opciones
            options = {
                'unidades': set(),
                'tipos': set(),
                'marcas': set(),
                'modelos': set(),
                'colores': set(),
                'adquisiciones': set(),
                'gestiones': set(),
                'ubicaciones': set(),
                'gerentes': set(),
                'encargados': set(),
                'lugares_mantenimiento': set()
            }
            
            # Extraer valores únicos
            for m in maquinarias:
                # Campos básicos
                if isinstance(m, dict):
                    if m.get('unidad'): options['unidades'].add(str(m['unidad']))
                    if m.get('tipo'): options['tipos'].add(str(m['tipo']))
                    if m.get('marca'): options['marcas'].add(str(m['marca']))
                    if m.get('modelo'): options['modelos'].add(str(m['modelo']))
                    if m.get('color'): options['colores'].add(str(m['color']))
                    if m.get('adqui'): options['adquisiciones'].add(str(m['adqui']))
                    if m.get('gestion'): options['gestiones'].add(str(m['gestion']))
                    
                    # Historial
                    if isinstance(m.get('historial'), list):
                        for h in m['historial']:
                            if isinstance(h, dict):
                                if h.get('ubicacion'): options['ubicaciones'].add(str(h['ubicacion']))
                                if h.get('gerente'): options['gerentes'].add(str(h['gerente']))
                                if h.get('encargado'): options['encargados'].add(str(h['encargado']))
                    
                    # Mantenimiento
                    if isinstance(m.get('mantenimiento'), dict):
                        if m['mantenimiento'].get('lugar'):
                            options['lugares_mantenimiento'].add(str(m['mantenimiento']['lugar']))
            
            # Convertir sets a listas ordenadas y filtrar valores vacíos
            for key in options:
                options[key] = sorted([v for v in options[key] if v and v.strip()])
            
            return JsonResponse(options)
            
        except Exception as e:
            logger.error(f"Error al obtener opciones: {str(e)}")
            return JsonResponse({"error": f"Error al obtener opciones: {str(e)}"}, status=500)
    
    return JsonResponse({"error": "Método no permitido"}, status=405)