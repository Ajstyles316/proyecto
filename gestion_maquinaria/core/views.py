from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from bson import ObjectId, json_util
import json, requests
import logging
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, date
import traceback

from .models import Maquinaria, HistorialControl, ActaAsignacion, Mantenimiento, Seguro, ITV, SOAT, Impuesto, Usuario # Importa los modelos como clases planas
from .serializers import (
    MaquinariaSerializer,
    RegistroSerializer,
    LoginSerializer,
    HistorialControlSerializer,
    ActaAsignacionSerializer,
    MantenimientoSerializer,
    SeguroSerializer,
    ITVSerializer,
    SOATSerializer,
    ImpuestoSerializer
)
from django.conf import settings
from .mongo_connection import get_collection # Asegúrate de que este archivo exista y contenga get_collection
import bcrypt

logger = logging.getLogger(__name__)

# --- Funciones auxiliares para PyMongo y serialización ---

def serialize_doc(doc):
    """Convierte un documento de PyMongo a un formato JSON serializable."""
    if not doc:
        return None
    try:
        doc['_id'] = str(doc['_id'])
        for key, value in doc.items():
            if isinstance(value, datetime):
                doc[key] = value.isoformat().split('T')[0]
            elif isinstance(value, ObjectId):
                doc[key] = str(value)
        return doc
    except Exception as e:
        logger.error(f"Error en serialize_doc: {str(e)}")
        raise

def serialize_list(docs):
    """Serializa una lista de documentos de PyMongo."""
    try:
        return [serialize_doc(doc.copy()) for doc in docs]
    except Exception as e:
        logger.error(f"Error en serialize_list: {str(e)}")
        raise

# --- Vistas para Maquinaria Principal ---

class MaquinariaListView(APIView):
    def get(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        try:
            maquinarias_cursor = maquinaria_collection.find()
            maquinarias_data = serialize_list(maquinarias_cursor)
            return Response(maquinarias_data)
        except Exception as e:
            logger.error(f"Error al obtener lista de maquinarias: {str(e)}")
            return Response({"error": f"Error al obtener datos: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        try:
            data = request.data.copy()
            
            # Ensure fecha_registro is in the correct format
            if 'fecha_registro' in data and isinstance(data['fecha_registro'], str):
                try:
                    data['fecha_registro'] = datetime.strptime(data['fecha_registro'], '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {"error": "Invalid date format for fecha_registro. Use YYYY-MM-DD"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = MaquinariaSerializer(data=data)
            if serializer.is_valid():
                validated_data = serializer.validated_data

                # Verificar si la placa ya existe
                if maquinaria_collection.find_one({"placa": validated_data['placa']}):
                    return Response({"error": "Ya existe una máquina con esta placa"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Convert date to datetime for MongoDB
                if 'fecha_registro' in validated_data:
                    validated_data['fecha_registro'] = datetime.combine(validated_data['fecha_registro'], datetime.min.time())
                if 'imagen' in data:
                    validated_data['imagen'] = data['imagen']
                result = maquinaria_collection.insert_one(validated_data)
                new_maquinaria = maquinaria_collection.find_one({"_id": result.inserted_id})
                return Response(serialize_doc(new_maquinaria), status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al crear maquinaria: {str(e)}")
            return Response({"error": f"Error al crear registro: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaquinariaDetailView(APIView):
    def convert_date_to_datetime(self, data):
        if not isinstance(data, dict):
           return data
        converted = {}
        for key, value in data.items():
            if isinstance(value, date):  # ✅ Usar 'date' en lugar de 'datetime.date'
               converted[key] = datetime.combine(value, datetime.min.time())
            elif isinstance(value, dict):
               converted[key] = self.convert_date_to_datetime(value)
            else:
               converted[key] = value
        return converted

    def clean_data(self, data):
        """Limpia y formatea los datos antes de guardarlos"""
        cleaned = {}
        for key, value in data.items():
            if value is None or value == '':
                continue
            if isinstance(value, dict):
                cleaned[key] = self.clean_data(value)
            elif key == 'fecha_registro' and isinstance(value, str):
                try:
                    cleaned[key] = datetime.strptime(value, '%Y-%m-%d').date()
                except ValueError:
                    continue
            else:
                cleaned[key] = value
        return cleaned

    def get(self, request, id):
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            maquinaria_doc = maquinaria_collection.find_one({"_id": ObjectId(id)})
            if not maquinaria_doc:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            # Solo devolver los datos de la maquinaria principal, sin anidar sub-secciones
            return Response(serialize_doc(maquinaria_doc))

        except Exception as e:
            logger.error(f"Error al obtener detalle de maquinaria: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, id):
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en PUT: {request.data}")
            
            existing_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            if not existing_maquinaria:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            # Validar con el serializer
            serializer = MaquinariaSerializer(data=request.data, partial=True)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            # Convertir fechas a datetime
            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Datos convertidos: {validated_data}")
            

            # Actualizar en MongoDB
            maquinaria_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": validated_data}
            )
            
            # Obtener y devolver el registro actualizado
            updated_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            return Response(serialize_doc(updated_maquinaria))

        except Exception as e:
            logger.error(f"Error al actualizar maquinaria: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, id):
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Eliminar maquinaria principal
            result = maquinaria_collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            # Eliminar registros asociados en todas las colecciones de sub-secciones
            get_collection(HistorialControl).delete_many({'maquinaria': ObjectId(id)})
            get_collection(ActaAsignacion).delete_many({'maquinaria': ObjectId(id)})
            get_collection(Mantenimiento).delete_many({'maquinaria': ObjectId(id)})
            get_collection(Seguro).delete_many({'maquinaria': ObjectId(id)})
            get_collection(ITV).delete_many({'maquinaria': ObjectId(id)})
            get_collection(SOAT).delete_many({'maquinaria': ObjectId(id)})
            get_collection(Impuesto).delete_many({'maquinaria': ObjectId(id)})

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error al eliminar maquinaria y sus registros asociados: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaquinariaOptionsView(APIView):
    def get(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        historial_control_collection = get_collection(HistorialControl)
        mantenimiento_collection = get_collection(Mantenimiento)

        try:
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
            
            for m in maquinaria_collection.find({}):
                if m.get('unidad'): options['unidades'].add(str(m['unidad']))
                if m.get('tipo'): options['tipos'].add(str(m['tipo']))
                if m.get('marca'): options['marcas'].add(str(m['marca']))
                if m.get('modelo'): options['modelos'].add(str(m['modelo']))
                if m.get('color'): options['colores'].add(str(m['color']))
                if m.get('adqui'): options['adquisiciones'].add(str(m['adqui']))
                if m.get('gestion'): options['gestiones'].add(str(m['gestion']))

            for hc in historial_control_collection.find({}):
                if hc.get('ubicacion'): options['ubicaciones'].add(str(hc['ubicacion']))
                if hc.get('gerente'): options['gerentes'].add(str(hc['gerente']))
                if hc.get('encargado'): options['encargados'].add(str(hc['encargado']))
            
            for m in mantenimiento_collection.find({}):
                if m.get('lugar'): options['lugares_mantenimiento'].add(str(m['lugar']))

            for key in options:
                options[key] = sorted([v for v in options[key] if v and v.strip()])
            
            return Response(options)
            
        except Exception as e:
            logger.error(f"Error al obtener opciones: {str(e)}")
            return Response({"error": f"Error al obtener opciones: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class BaseSectionAPIView(APIView):
    collection_class = None 
    serializer_class = None 
    
    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection(self.collection_class)
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)

        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection(self.collection_class)
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Base APIView para operaciones de detalle/actualización/eliminación de sub-secciones
class BaseSectionDetailAPIView(APIView):
    collection_class = None
    serializer_class = None

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection(self.collection_class)
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection(self.collection_class)
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection(self.collection_class)
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- Vistas Específicas para cada Sección ---

class HistorialControlListView(BaseSectionAPIView):
    collection_class = HistorialControl
    serializer_class = HistorialControlSerializer

    def convert_date_to_datetime(self, data):
        if not isinstance(data, dict):
           return data
        converted = {}
        for key, value in data.items():
            if isinstance(value, date):  # ✅ Usar 'date' en lugar de 'datetime.date'
               converted[key] = datetime.combine(value, datetime.min.time())
            elif isinstance(value, dict):
               converted[key] = self.convert_date_to_datetime(value)
            else:
               converted[key] = value
        return converted

    def clean_data(self, data):
        """Limpia y formatea los datos antes de guardarlos"""
        cleaned = {}
        for key, value in data.items():
            if value is None or value == '':
                continue
            if isinstance(value, dict):
                cleaned[key] = self.clean_data(value)
            elif key == 'fecha_ingreso' and isinstance(value, str):
                try:
                    cleaned[key] = datetime.strptime(value, '%Y-%m-%d').date()
                except ValueError:
                    continue
            else:
                cleaned[key] = value
        return cleaned

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('historial_control')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            # Preparar datos para el serializer
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            # Validar con el serializer
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            # Convertir fechas a datetime
            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Datos convertidos: {validated_data}")

            # Insertar en MongoDB
            collection = get_collection('historial_control')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear control: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistorialControlDetailView(BaseSectionDetailAPIView):
    collection_class = HistorialControl
    serializer_class = HistorialControlSerializer

    def convert_date_to_datetime(self, data):
        if not isinstance(data, dict):
           return data
        converted = {}
        for key, value in data.items():
            if isinstance(value, date):  # ✅ Usar 'date' en lugar de 'datetime.date'
               converted[key] = datetime.combine(value, datetime.min.time())
            elif isinstance(value, dict):
               converted[key] = self.convert_date_to_datetime(value)
            else:
               converted[key] = value
        return converted

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('historial_control')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Control no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('historial_control')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Control no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            # Convertir fechas a datetime
            validated_data = self.convert_date_to_datetime(validated_data)

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('historial_control')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Control no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class ActaAsignacionListView(BaseSectionAPIView):
    collection_class = ActaAsignacion
    serializer_class = ActaAsignacionSerializer

    def convert_date_to_datetime(self, data):
        if not isinstance(data, dict):
           return data
        converted = {}
        for key, value in data.items():
            if isinstance(value, date):
               converted[key] = datetime.combine(value, datetime.min.time())
            elif isinstance(value, dict):
               converted[key] = self.convert_date_to_datetime(value)
            else:
               converted[key] = value
        return converted

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('acta_asignacion')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Datos convertidos: {validated_data}")

            collection = get_collection('acta_asignacion')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear asignación: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActaAsignacionDetailView(BaseSectionDetailAPIView):
    collection_class = ActaAsignacion
    serializer_class = ActaAsignacionSerializer

    def convert_date_to_datetime(self, data):
        if not isinstance(data, dict):
           return data
        converted = {}
        for key, value in data.items():
            if isinstance(value, date):
               converted[key] = datetime.combine(value, datetime.min.time())
            elif isinstance(value, dict):
               converted[key] = self.convert_date_to_datetime(value)
            else:
               converted[key] = value
        return converted

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('acta_asignacion')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('acta_asignacion')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('acta_asignacion')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class MantenimientoListView(BaseSectionAPIView):
    collection_class = Mantenimiento
    serializer_class = MantenimientoSerializer

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('mantenimiento')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection('mantenimiento')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear mantenimiento: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MantenimientoDetailView(BaseSectionDetailAPIView):
    collection_class = Mantenimiento
    serializer_class = MantenimientoSerializer

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('mantenimiento')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Mantenimiento no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('mantenimiento')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Mantenimiento no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('mantenimiento')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Mantenimiento no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SeguroListView(BaseSectionAPIView):
    collection_class = Seguro
    serializer_class = SeguroSerializer

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('seguro')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection('seguro')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear seguro: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SeguroDetailView(BaseSectionDetailAPIView):
    collection_class = Seguro
    serializer_class = SeguroSerializer

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('seguro')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Seguro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('seguro')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Seguro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('seguro')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Seguro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class ITVListView(BaseSectionAPIView):
    collection_class = ITV
    serializer_class = ITVSerializer

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('itv')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection('itv')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear ITV: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ITVDetailView(BaseSectionDetailAPIView):
    collection_class = ITV
    serializer_class = ITVSerializer

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('itv')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "ITV no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('itv')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "ITV no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('itv')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "ITV no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SOATListView(BaseSectionAPIView):
    collection_class = SOAT
    serializer_class = SOATSerializer

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('soat')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection('soat')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear SOAT: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SOATDetailView(BaseSectionDetailAPIView):
    collection_class = SOAT
    serializer_class = SOATSerializer

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('soat')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "SOAT no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('soat')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "SOAT no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('soat')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "SOAT no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class ImpuestoListView(BaseSectionAPIView):
    collection_class = Impuesto
    serializer_class = ImpuestoSerializer

    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('impuesto')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            collection = get_collection('impuesto')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear impuesto: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImpuestoDetailView(BaseSectionDetailAPIView):
    collection_class = Impuesto
    serializer_class = ImpuestoSerializer

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('impuesto')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Impuesto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('impuesto')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Impuesto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('impuesto')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Impuesto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- Views de Autenticación y Dashboard (ya son APIView) ---

RECAPTCHA_SECRET_KEY = '6LeCz1orAAAAAANrHmd4oJFnaoSyPglm2I6bb4Z9'
class RegistroView(APIView):
    serializer_class = RegistroSerializer

    def post(self, request):
        try:
            data = request.data
            print("Datos recibidos:", data) 

            captcha_token = data.get('captchaToken')
            if not captcha_token:
                return Response({'error': 'El CAPTCHA es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

            verify_url = 'https://www.google.com/recaptcha/api/siteverify' 
            response = requests.post(verify_url, data={
                'secret': RECAPTCHA_SECRET_KEY,
                'response': captcha_token
            })
            result = response.json()

            if not result.get('success'):
                return Response({'error': 'Fallo en la verificación del CAPTCHA'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                print("Errores del serializador:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            data.pop("confirmPassword", None)
            data.pop("captchaToken", None)

            data["Password"] = bcrypt.hashpw(
                data["Password"].encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            collection = get_collection(Usuario) # Usar Usuario directamente
            result_db = collection.insert_one(data)
            inserted = collection.find_one({"_id": result_db.inserted_id})

            return Response(json.loads(json_util.dumps(serialize_doc(inserted))), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al registrar: {str(e)}")
            return Response(
                {"error": f"Error al registrar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    serializer_class = LoginSerializer  

    def post(self, request):
        try:
            data = request.data
            print("Datos recibidos:", data)

            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                print("Errores del serializador:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            collection = get_collection(Usuario)
            user = collection.find_one({"Email": data["Email"]})
            if not user:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            if not bcrypt.checkpw(data["Password"].encode("utf-8"), user["Password"].encode("utf-8")):
                return Response({"error": "Contraseña inválida"}, status=status.HTTP_401_UNAUTHORIZED)

            return Response(json.loads(json_util.dumps(serialize_doc(user))), status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error interno en LoginView: {str(e)}")
            return Response(
                {"error": f"Error al iniciar sesión: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class DashboardStatsView(APIView):
    def get(self, request):
        try:
            total_seguros = get_collection(Seguro).count_documents({})
            mantenimientos_pendientes = get_collection(Mantenimiento).count_documents({"estado": "PENDIENTE"}) 
            unidades_en_control = get_collection(HistorialControl).count_documents({}) 
            horas_totales_operativas = 0 # Esta lógica necesita ser revisada si el campo no existe o la estructura cambia

            data = [
                {"title": "Total de Seguros", "value": str(total_seguros), "icon": "mdi:file-document-outline", "color": "primary.main"},
                {"title": "Mantenimientos Pendientes", "value": str(mantenimientos_pendientes), "icon": "mdi:wrench", "color": "warning.main"},
                {"title": "Unidades en Control", "value": str(unidades_en_control), "icon": "mdi:truck-fast", "color": "success.main"},
                {"title": "Horas Totales Operativas", "value": f"{horas_totales_operativas:,}", "icon": "mdi:clock-time-eight", "color": "info.main"},
            ]
            return Response(data)
        except Exception as e:
            logger.error(f"Error en DashboardStatsView: {str(e)}")
            return Response({"error": f"Error al obtener estadísticas: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)