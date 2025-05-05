from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.views import APIView
from bson import json_util, ObjectId
import json
import logging

logger = logging.getLogger(__name__)

from .serializers import MaquinariaSerializer, ControlSerializer, MantenimientoSerializer, AsignacionSerializer, SeguroSerializer, ImpuestoSerializer, ITVSerializer
from .mongo_connection import get_collection
from .models import Maquinaria, Control, Mantenimiento, Asignacion, Seguro, Impuesto, ITV

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
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                collection = self.get_collection()
                result = collection.insert_one(serializer.validated_data)
                inserted = collection.find_one({"_id": result.inserted_id})
                return Response(json.loads(json_util.dumps(inserted)), status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al crear: {str(e)}")
            return Response({"error": f"Error al crear recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.error(f"Error al obtener: {str(e)}")
            return Response({"error": f"Error al obtener recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        try:
            try:
                obj_id = ObjectId(pk)
            except Exception:
                return Response({"error": "ID inválido"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.serializer_class(data=request.data, partial=True)
            if serializer.is_valid():
                collection = self.get_collection()
                result = collection.update_one({"_id": obj_id}, {"$set": serializer.validated_data})
                if result.matched_count == 0:
                    return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
                updated = collection.find_one({"_id": obj_id})
                return Response(json.loads(json_util.dumps(updated)))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error al actualizar: {str(e)}")
            return Response({"error": f"Error al actualizar recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        try:
            try:
                obj_id = ObjectId(pk)
            except Exception as e:
                return Response({"error": "ID inválido", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            collection = self.get_collection()
            result = collection.delete_one({"_id": obj_id})

            if result.deleted_count == 0:
                return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"error": f"Error al eliminar recurso: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaquinariaViewSet(BaseViewSet):
    model_class = Maquinaria
    serializer_class = MaquinariaSerializer
    
class ControlViewSet(BaseViewSet):
    model_class = Control
    serializer_class = ControlSerializer

class MantenimientoViewSet(BaseViewSet):
    model_class = Mantenimiento
    serializer_class = MantenimientoSerializer


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