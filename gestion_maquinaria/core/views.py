from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.views import APIView
from bson import json_util, ObjectId
from bson.json_util import dumps
import datetime
from dateutil import parser
import requests
import json
import logging
from pymongo import MongoClient
logger = logging.getLogger(__name__)

from .serializers import (
    MaquinariaSerializer,
    ControlSerializer,
    MantenimientoSerializer,
    AsignacionSerializer,
    SeguroSerializer,
    ImpuestoSerializer,
    ITVSerializer,
    RegistroSerializer,
    LoginSerializer,
    MantenimientoActSerializer,
)
from .mongo_connection import get_collection
from .models import Maquinaria, Control, Mantenimiento, Asignacion, Seguro, Impuesto, ITV, Usuario, MantenimientoAct
import bcrypt

class BaseViewSet(ViewSet):
    model_class = None
    serializer_class = None

    def get_collection(self):
        return get_collection(self.model_class)

    def list(self, request):
        try:
            collection = self.get_collection()
            items = list(collection.find())
            return Response(json.loads(json_util.dumps(items)))
        except Exception as e:
            logger.error(f"Error al listar: {str(e)}")
            return Response({"error": f"Error al obtener datos: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            # Convertir request.data a dict seguro
            data = dict(request.data)  # ← Aquí el cambio importante
            print("Datos recibidos:", data)
            # Validación del serializador
            serializer = self.serializer_class(data=data)
            if serializer.is_valid():
                collection = self.get_collection()
                result = collection.insert_one(serializer.validated_data)
                inserted = collection.find_one({"_id": result.inserted_id})
                return Response(json.loads(json_util.dumps(inserted)), status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error al crear recurso: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Error al crear recurso: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, pk=None):
        try:
            try:
                obj_id = ObjectId(pk)
            except Exception:
                return Response({"error": "ID inválido"}, status=status.HTTP_400_BAD_REQUEST)

            collection = self.get_collection()
            item = collection.find_one({"_id": obj_id})

            if not item:
                return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)

            return Response(json.loads(json_util.dumps(item)))

        except Exception as e:
            logger.error(f"Error al obtener recurso: {str(e)}", exc_info=True)
            return Response({"error": f"Error al obtener recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        try:
            data = dict(request.data)  # ← Aquí también usamos dict() para evitar problemas
            print("Datos actualizados:", data)

            serializer = self.serializer_class(data=data, partial=True)
            if serializer.is_valid():
                collection = self.get_collection()
                result = collection.update_one(
                    {"_id": ObjectId(pk)},
                    {"$set": serializer.validated_data}
                )
                if result.matched_count == 0:
                    return Response({"error": "No encontrado"}, status=404)
                updated = collection.find_one({"_id": ObjectId(pk)})
                return Response(json.loads(json_util.dumps(updated)))
            return Response(serializer.errors, status=400)

        except Exception as e:
            logger.error(f"Error al actualizar recurso: {str(e)}", exc_info=True)
            return Response({"error": f"Error al actualizar recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        try:
            try:
                obj_id = ObjectId(pk)
            except Exception:
                return Response({"error": "ID inválido"}, status=status.HTTP_400_BAD_REQUEST)

            collection = self.get_collection()
            result = collection.delete_one({"_id": obj_id})

            if result.deleted_count == 0:
                return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Error al eliminar recurso: {str(e)}", exc_info=True)
            return Response({"error": f"Error al eliminar recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === Mis ViewSets ===
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

class MaquinariaViewSet(BaseViewSet):
    model_class = Maquinaria
    serializer_class = MaquinariaSerializer


class ControlViewSet(BaseViewSet):
    model_class = Control
    serializer_class = ControlSerializer


class MantenimientoViewSet(BaseViewSet):
    model_class = Mantenimiento
    serializer_class = MantenimientoSerializer

class MantenimientoActViewSet(BaseViewSet):
    model_class = MantenimientoAct
    serializer_class = MantenimientoActSerializer
    
class AsignacionViewSet(BaseViewSet):
    model_class = Asignacion
    serializer_class = AsignacionSerializer

    def list(self, request):
        try:
            return super().list(request)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImpuestoViewSet(BaseViewSet):
    model_class = Impuesto
    serializer_class = ImpuestoSerializer


class ITVViewSet(BaseViewSet):
    model_class = ITV
    serializer_class = ITVSerializer


class SeguroViewSet(BaseViewSet):
    model_class = Seguro
    serializer_class = SeguroSerializer


# === Vista para Dashboard ===

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