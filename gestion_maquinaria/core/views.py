from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from bson import ObjectId, json_util
import json, requests, logging, nbformat, os, traceback
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, date, timedelta
from rest_framework import viewsets
from rest_framework.decorators import api_view
from nbconvert.preprocessors import ExecutePreprocessor
from .models import Maquinaria, HistorialControl, ActaAsignacion, Mantenimiento, Seguro, ITV, SOAT, Impuesto, Usuario, Pronostico
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
    ImpuestoSerializer,
    DepreciacionSerializer,
    ActivoSerializer,
    PronosticoInputSerializer
)
from django.conf import settings
from .mongo_connection import get_collection, get_collection_from_activos_db # Asegúrate de importar la nueva función
import bcrypt
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

# --- Funciones auxiliares para PyMongo y serialización ---

def serialize_doc(doc):
    """Convierte un documento de PyMongo a un formato JSON serializable (recursivo)."""
    if not doc:
        return None
    from bson import ObjectId
    from datetime import datetime, date
    def convert(value):
        if isinstance(value, ObjectId):
            return str(value)
        elif isinstance(value, (datetime, date)):
            return value.isoformat()
        elif isinstance(value, dict):
            return {k: convert(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [convert(v) for v in value]
        else:
            return value
    doc = convert(doc)
    # --- Asegurar maquinaria_id como string si existe ---
    if 'maquinaria' in doc:
        doc['maquinaria_id'] = str(doc['maquinaria'])
        doc['bien_de_uso'] = doc.get('bien_uso', '')
        doc['vida_util'] = doc.get('vida_util', '')
        doc['costo_activo'] = doc.get('costo_activo', 0)
    return doc

def serialize_list(docs):
    """Serializa una lista de documentos de PyMongo."""
    try:
        return [serialize_doc(doc.copy()) for doc in docs]
    except Exception as e:
        logger.error(f"Error en serialize_list: {str(e)}")
        raise

def convert_dates_to_str(obj):
    if isinstance(obj, dict):
        return {k: convert_dates_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_dates_to_str(item) for item in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    else:
        return obj

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
                validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
            
            # Asegurar que el campo imagen se incluya si está presente en request.data
            if 'imagen' in request.data:
                validated_data['imagen'] = request.data['imagen']
                logger.info(f"Imagen incluida en la actualización: {len(request.data['imagen'])} caracteres")

            # Actualizar en MongoDB
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    

# Utilidad para paginación y proyección

def paginar_cursor(cursor, page=1, page_size=50):
    page = max(1, int(page))
    page_size = max(1, int(page_size))
    skip = (page - 1) * page_size
    return cursor.skip(skip).limit(page_size)

# --- Optimización de BaseSectionAPIView y BaseSectionDetailAPIView ---
class BaseSectionAPIView(APIView):
    collection_class = None 
    serializer_class = None 
    projection = None  # Añadido para optimización
    
    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection(self.collection_class)
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        filtro = {'maquinaria': ObjectId(maquinaria_id)}
        cursor = collection.find(filtro, self.projection or None)
        cursor = paginar_cursor(cursor, page, page_size)
        records = list(cursor)
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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id}, self.projection or None)
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BaseSectionDetailAPIView(APIView):
    collection_class = None
    serializer_class = None
    projection = None

    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection(self.collection_class)
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)}, self.projection or None)
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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)}, self.projection or None)
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear control: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistorialControlDetailView(BaseSectionDetailAPIView):
    collection_class = HistorialControl
    serializer_class = HistorialControlSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear asignación: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActaAsignacionDetailView(BaseSectionDetailAPIView):
    collection_class = ActaAsignacion
    serializer_class = ActaAsignacionSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear mantenimiento: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MantenimientoDetailView(BaseSectionDetailAPIView):
    collection_class = Mantenimiento
    serializer_class = MantenimientoSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear seguro: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SeguroDetailView(BaseSectionDetailAPIView):
    collection_class = Seguro
    serializer_class = SeguroSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear ITV: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ITVDetailView(BaseSectionDetailAPIView):
    collection_class = ITV
    serializer_class = ITVSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear SOAT: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SOATDetailView(BaseSectionDetailAPIView):
    collection_class = SOAT
    serializer_class = SOATSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear impuesto: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImpuestoDetailView(BaseSectionDetailAPIView):
    collection_class = Impuesto
    serializer_class = ImpuestoSerializer
    projection = {'_id': 1, 'maquinaria': 1, 'fecha': 1, 'detalle': 1, 'costo': 1, 'estado': 1, 'fecha_creacion': 1}

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

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
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

# Agregar función auxiliar para formatear el método como oración
def format_metodo_oracion(metodo):
    if not metodo:
        return "-"
    return metodo.replace('_', ' ').capitalize()

class DepreciacionesGeneralView(APIView):
    def determinar_bien_uso_y_vida_util(self, tipo_maquinaria, detalle_maquinaria):
        try:
            tipo_lower = str(tipo_maquinaria).lower() if tipo_maquinaria is not None else ""
            detalle_lower = str(detalle_maquinaria).lower() if detalle_maquinaria is not None else ""
            if any(p in tipo_lower or p in detalle_lower for p in ['camion', 'camión', 'auto', 'carro', 'vehiculo', 'vehículo', 'truck', 'car']):
                return "Vehículos automotores", 5
            if any(p in tipo_lower or p in detalle_lower for p in ['excavadora', 'bulldozer', 'retroexcavadora', 'cargador', 'loader', 'excavator']):
                return "Maquinaria pesada", 8
            if any(p in tipo_lower or p in detalle_lower for p in ['martillo', 'taladro', 'compresor', 'generador', 'soldadora', 'welder']):
                return "Equipos de construcción", 6
            if any(p in tipo_lower or p in detalle_lower for p in ['herramienta', 'tool', 'equipo menor', 'equipamiento']):
                return "Herramientas menores", 4
            if any(p in tipo_lower or p in detalle_lower for p in ['computadora', 'laptop', 'impresora', 'scanner', 'equipo oficina']):
                return "Equipos de oficina", 5
            if any(p in tipo_lower or p in detalle_lower for p in ['mueble', 'escritorio', 'silla', 'mesa', 'furniture']):
                return "Muebles y enseres", 10
            return "Otros bienes", 5
        except Exception as e:
            logger.warning(f"Error al determinar bien de uso: {e}")
            return "Desconocido", 5

    def get(self, request):
        try:
            depreciaciones_collection = get_collection("depreciaciones")
            depreciaciones = list(depreciaciones_collection.find({}))
            if depreciaciones:
                return Response(serialize_list(depreciaciones))
            # Si no hay depreciaciones reales, devolver ejemplo forzado
            resultado = [{
                "_id": {"$oid": "1"},
                "maquinaria_id": "1",
                "placa": "ABC-123",
                "detalle": "Maquinaria de ejemplo",
                "codigo": "COD-001",
                "metodo_depreciacion": "Línea Recta",
                "costo_activo": 10000,
                "adqui": 10000,
                "vida_util": 5,
                "depreciacion_por_anio": [
                    {"anio": 2025, "valor_anual_depreciado": 2000, "depreciacion_acumulada": 2000, "valor_en_libros": 8000},
                    {"anio": 2026, "valor_anual_depreciado": 2000, "depreciacion_acumulada": 4000, "valor_en_libros": 6000},
                    {"anio": 2027, "valor_anual_depreciado": 2000, "depreciacion_acumulada": 6000, "valor_en_libros": 4000},
                    {"anio": 2028, "valor_anual_depreciado": 2000, "depreciacion_acumulada": 8000, "valor_en_libros": 2000},
                    {"anio": 2029, "valor_anual_depreciado": 2000, "depreciacion_acumulada": 10000, "valor_en_libros": 0}
                ],
                "bien_de_uso": "Ejemplo",
                "fecha_compra": "2025-07-04",
                "advertencia": "Datos de ejemplo forzados.",
            }]
            return Response(resultado)
        except Exception as e:
            logger.error(f"Error en DepreciacionesGeneralView: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DepreciacionesListView(APIView):
    def get(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('depreciaciones')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id)}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        
        # Obtener datos de la maquinaria para determinar bien de uso y vida útil
        maquinaria_collection = get_collection(Maquinaria)
        maquinaria_doc = maquinaria_collection.find_one({"_id": ObjectId(maquinaria_id)})
        tipo_maquinaria = maquinaria_doc.get('tipo', '') if maquinaria_doc else ''
        detalle_maquinaria = maquinaria_doc.get('detalle', '') if maquinaria_doc else ''
        # Usar la lógica del backend para determinar bien de uso y vida útil
        bien_uso, vida_util = DepreciacionesGeneralView().determinar_bien_uso_y_vida_util(tipo_maquinaria, detalle_maquinaria)
        data['bien_uso'] = bien_uso
        data['vida_util'] = vida_util
        
        # Eliminar duplicados: dejar solo la que se va a insertar
        collection = get_collection('depreciaciones')
        collection.delete_many({'maquinaria': ObjectId(maquinaria_id)})
        
        # logger.info(f"Datos recibidos en POST depreciación: {data}")
        
        serializer = DepreciacionSerializer(data=data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()
            validated_data['bien_uso'] = bien_uso
            validated_data['vida_util'] = vida_util
            
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)
        
        logger.error(f"Errores de validación en depreciación: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DepreciacionesDetailView(APIView):
    def get(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('depreciaciones')
        record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not record:
            return Response({"error": "Depreciación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(record))

    def put(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('depreciaciones')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Depreciación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        serializer = DepreciacionSerializer(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            return Response(serialize_doc(updated_record))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('depreciaciones')
        result = collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if result.deleted_count == 0:
            return Response({"error": "Depreciación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
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

            # Si el usuario tiene permiso Denegado, no puede acceder
            if user.get("Permiso", "Editor").lower() == "denegado":
                return Response({"error": "Acceso denegado por el administrador"}, status=status.HTTP_403_FORBIDDEN)

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
            # Total de seguros
            total_seguros = get_collection(Seguro).count_documents({})

            # Mantenimientos pendientes
            mantenimientos_pendientes = get_collection(Mantenimiento).count_documents({"estado": "PENDIENTE"})

            # Unidades en control
            unidades_en_control = get_collection(HistorialControl).count_documents({})

            # Total de maquinarias
            total_maquinarias = get_collection(Maquinaria).count_documents({})

            # Horas totales operativas (sumar horas_op de todos los pronósticos, si existen)
            horas_totales_operativas = 0
            try:
                pronostico_collection = get_collection(Pronostico)
                horas_totales_operativas = sum([
                    float(doc.get("horas_op", 0)) for doc in pronostico_collection.find({})
                ])
            except Exception as e:
                logger.warning(f"No se pudo calcular horas totales operativas: {e}")
                horas_totales_operativas = 0

            # Seguros próximos a vencer (ejemplo: próximos 30 días, si hay campo de fecha_vencimiento)
            seguros_proximos_vencer = 0
            try:
                hoy = datetime.now()
                en_30_dias = hoy.replace(hour=23, minute=59, second=59) + timedelta(days=30)
                seguros_collection = get_collection(Seguro)
                seguros_proximos_vencer = seguros_collection.count_documents({
                    "fecha_vencimiento": {"$gte": hoy, "$lte": en_30_dias}
                })
            except Exception as e:
                seguros_proximos_vencer = 0

            # Mantenimientos realizados este mes
            mantenimientos_este_mes = 0
            try:
                hoy = datetime.now()
                primer_dia_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                mantenimientos_collection = get_collection(Mantenimiento)
                mantenimientos_este_mes = mantenimientos_collection.count_documents({
                    "fecha": {"$gte": primer_dia_mes, "$lte": hoy}
                })
            except Exception as e:
                mantenimientos_este_mes = 0

            depreciacion_total = 0
            try:
                depreciaciones_collection = get_collection("depreciaciones")
                for dep in depreciaciones_collection.find({}):
                    por_anio = dep.get("depreciacion_por_anio", [])
                    if por_anio:
                        ultimo = por_anio[-1]
                        depreciacion_total += float(ultimo.get("depreciacion_acumulada", 0))
            except Exception as e:
                depreciacion_total = 0

            # Próximos mantenimientos según IA (riesgo ALTO en pronóstico)
            proximos_mantenimientos_ia = 0
            try:
                pronostico_collection = get_collection(Pronostico)
                proximos_mantenimientos_ia = pronostico_collection.count_documents({"riesgo": "ALTO"})
            except Exception as e:
                proximos_mantenimientos_ia = 0

            data = [
                {"title": "Total de Maquinarias", "value": str(total_maquinarias), "icon": "mdi:tractor", "color": "secondary.main"},
                {"title": "Total de Seguros", "value": str(total_seguros), "icon": "mdi:file-document-outline", "color": "primary.main"},
                {"title": "Seguros Próximos a Vencer", "value": str(seguros_proximos_vencer), "icon": "mdi:calendar-alert", "color": "error.main"},
                {"title": "Mantenimientos Pendientes", "value": str(mantenimientos_pendientes), "icon": "mdi:wrench", "color": "warning.main"},
                {"title": "Mantenimientos Este Mes", "value": str(mantenimientos_este_mes), "icon": "mdi:calendar-check", "color": "info.main"},
                {"title": "Unidades en Control", "value": str(unidades_en_control), "icon": "mdi:truck-fast", "color": "success.main"},
                {"title": "Horas Totales Operativas", "value": f"{horas_totales_operativas:,.2f}", "icon": "mdi:clock-time-eight", "color": "info.main"},
                {"title": "Depreciación Total Acumulada", "value": f"{depreciacion_total:,.2f}", "icon": "mdi:cash-multiple", "color": "secondary.main"},
                {"title": "Próximos Mantenimientos", "value": str(proximos_mantenimientos_ia), "icon": "mdi:robot", "color": "primary.main"},
            ]
            return Response(data)
        except Exception as e:
            logger.error(f"Error en DashboardStatsView: {str(e)}")
            return Response({"error": f"Error al obtener estadísticas: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaquinariaViewSet(viewsets.ViewSet):
    """
    ViewSet de solo lectura para la Browsable API de DRF.
    """
    def list(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        maquinarias = list(maquinaria_collection.find())
        return Response([serialize_doc(m) for m in maquinarias])

    def retrieve(self, request, pk=None):
        maquinaria_collection = get_collection(Maquinaria)
        from bson import ObjectId
        if not ObjectId.is_valid(pk):
            return Response({"error": "ID inválido"}, status=400)
        m = maquinaria_collection.find_one({"_id": ObjectId(pk)})
        if not m:
            return Response({"error": "No encontrado"}, status=404)
        return Response(serialize_doc(m))

@api_view(['GET'])
def activos_list(request):
    try:
        # Usar la base de datos 'activos' y la colección 'depreciacion'
        collection = get_collection_from_activos_db('depreciacion')
        # Ajusta los campos según la estructura real de tus documentos en 'depreciacion'
        activos = list(collection.find({}, {'_id': 0, 'bien_uso': 1, 'vida_util': 1, 'coeficiente': 1}))
        resultado = [
            {
                'bien_uso': a.get('bien_uso', ''),
                'vida_util': a.get('vida_util', ''),
                'coeficiente': float(a.get('coeficiente', 0)) if a.get('coeficiente') is not None else ''
            }
            for a in activos
        ]
        serializer = ActivoSerializer(resultado, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def cargar_funcion_pronostico():
    """
    Carga la función de pronóstico desde el archivo optimizado
    """
    import sys
    import os
    
    # Agregar el directorio del pronóstico al path
    pronostico_dir = os.path.join(settings.BASE_DIR, "pronostico-v1")
    if pronostico_dir not in sys.path:
        sys.path.insert(0, pronostico_dir)
    
    try:
        from pronostico_model import predecir_mantenimiento
        return predecir_mantenimiento
    except ImportError as e:
        print(f"Error al importar pronostico_model: {e}")
        raise

class PronosticoAPIView(APIView):
    def post(self, request):
        serializer = PronosticoInputSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            # Lanzar predicción automática (import robusto)
            import sys, os
            pronostico_dir = os.path.join(os.path.dirname(__file__), '../pronostico-v1')
            if pronostico_dir not in sys.path:
                sys.path.insert(0, pronostico_dir)
            from pronostico_model import predecir_mantenimiento
            resultado_dict = predecir_mantenimiento(data)
            # Extraer campos del dict
            data['resultado'] = resultado_dict.get('resultado')
            data['recomendaciones'] = resultado_dict.get('recomendaciones')
            data['fechas_futuras'] = resultado_dict.get('fechas_futuras', [])
            data['riesgo'] = resultado_dict.get('riesgo')
            data['probabilidad'] = resultado_dict.get('probabilidad')
            data['fecha_prediccion'] = resultado_dict.get('fecha_prediccion')
            placa = data.get('placa')
            fecha_asig = data.get('fecha_asig')
            # --- Refuerzo: convertir fecha_asig a string ISO para filtro y guardado ---
            if isinstance(fecha_asig, (datetime, date)):
                fecha_asig = fecha_asig.isoformat()
            data['fecha_asig'] = fecha_asig
            collection = get_collection(Pronostico)
            data = convert_dates_to_str(data)
            existing = collection.find_one({'placa': placa, 'fecha_asig': fecha_asig})
            if existing:
                collection.update_one({'_id': existing['_id']}, {'$set': data})
                updated = collection.find_one({'_id': existing['_id']})
                return Response(serialize_doc(updated), status=status.HTTP_200_OK)
            else:
                result = collection.insert_one(data)
                new_doc = collection.find_one({'_id': result.inserted_id})
                return Response(serialize_doc(new_doc), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        # Devolver todos los pronósticos sin paginación
        cursor = Pronostico().collection.find({}, {"_id": 1, "placa": 1, "fecha_asig": 1, "horas_op": 1, "recorrido": 1, "resultado": 1, "creado_en": 1, "recomendaciones": 1, "fechas_futuras": 1})
        registros = list(cursor)
        registros_serializados = [serialize_doc(r) for r in registros]
        return Response(registros_serializados, status=status.HTTP_200_OK)

class PronosticoSummaryView(APIView):
    def get(self, request):
        try:
            pronostico_collection = get_collection(Pronostico)
            pipeline = [
                {
                    "$group": {
                        "_id": "$resultado",
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "name": "$_id",
                        "value": "$count",
                        "_id": 0
                    }
                }
            ]
            summary = list(pronostico_collection.aggregate(pipeline))
            
            # Solo 'Preventivo' y 'Correctivo'
            all_tipos = {"Preventivo", "Correctivo"}
            found_tipos = {s['name'] for s in summary if s['name']}
            missing_tipos = all_tipos - found_tipos
            for tipo in missing_tipos:
                summary.append({"name": tipo, "value": 0})
            summary = [s for s in summary if s['name'] in all_tipos]
            return Response(summary)
        except Exception as e:
            logger.error(f"Error en PronosticoSummaryView: {str(e)}")
            return Response({"error": f"Error al obtener resumen de pronósticos: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaquinariaViewSet(viewsets.ViewSet):
    """
    ViewSet de solo lectura para la Browsable API de DRF.
    """
    def list(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        maquinarias = list(maquinaria_collection.find())
        return Response([serialize_doc(m) for m in maquinarias])

    def retrieve(self, request, pk=None):
        maquinaria_collection = get_collection(Maquinaria)
        from bson import ObjectId
        if not ObjectId.is_valid(pk):
            return Response({"error": "ID inválido"}, status=400)
        m = maquinaria_collection.find_one({"_id": ObjectId(pk)})
        if not m:
            return Response({"error": "No encontrado"}, status=404)
        return Response(serialize_doc(m))

class UsuarioListView(APIView):
    """Solo el encargado puede ver la lista de usuarios."""
    def get(self, request):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user or user.get('Cargo', '').lower() != 'encargado':
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        usuarios = list(collection.find({}, {"_id": 1, "Email": 1, "Cargo": 1, "Permiso": 1, "Nombre": 1}))
        return Response([serialize_doc(u) for u in usuarios], status=status.HTTP_200_OK)

class UsuarioCargoUpdateView(APIView):
    """Solo el encargado puede cambiar el cargo de otros usuarios."""
    def put(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user or user.get('Cargo', '').lower() != 'encargado':
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        # No puede cambiarse a sí mismo
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes cambiar tu propio cargo'}, status=status.HTTP_400_BAD_REQUEST)
        nuevo_cargo = request.data.get('Cargo')
        if not nuevo_cargo:
            return Response({'error': 'Cargo requerido'}, status=status.HTTP_400_BAD_REQUEST)
        result = collection.update_one({'_id': ObjectId(id)}, {'$set': {'Cargo': nuevo_cargo}})
        if result.matched_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        usuario_actualizado = collection.find_one({'_id': ObjectId(id)})
        return Response(serialize_doc(usuario_actualizado), status=status.HTTP_200_OK)

class UsuarioPermisoUpdateView(APIView):
    """Solo el encargado puede cambiar el permiso de otros usuarios."""
    def put(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user or user.get('Cargo', '').lower() != 'encargado':
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes cambiar tu propio permiso'}, status=status.HTTP_400_BAD_REQUEST)
        nuevo_permiso = request.data.get('Permiso')
        if not nuevo_permiso:
            return Response({'error': 'Permiso requerido'}, status=status.HTTP_400_BAD_REQUEST)
        result = collection.update_one({'_id': ObjectId(id)}, {'$set': {'Permiso': nuevo_permiso}})
        if result.matched_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        usuario_actualizado = collection.find_one({'_id': ObjectId(id)})
        return Response(serialize_doc(usuario_actualizado), status=status.HTTP_200_OK)

class UsuarioDeleteView(APIView):
    """Solo el encargado puede eliminar usuarios (no a sí mismo)."""
    def delete(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user or user.get('Cargo', '').lower() != 'encargado':
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes eliminarte a ti mismo'}, status=status.HTTP_400_BAD_REQUEST)
        result = collection.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def sugerir_bien_uso(request):
    tipo = request.data.get('tipo_maquinaria', '')
    detalle = request.data.get('detalle_maquinaria', '')
    view = DepreciacionesGeneralView()
    bien_uso, vida_util = view.determinar_bien_uso_y_vida_util(tipo, detalle)
    coeficientes = {
        'Vehículos automotores': 0.20,
        'Maquinaria pesada': 0.125,
        'Equipos de construcción': 0.20,
        'Herramientas menores': 0.25,
        'Equipos de oficina': 0.25,
        'Muebles y enseres': 0.10,
        'Otros bienes': 0.20,
        'Desconocido': 0.20,
    }
    coeficiente = coeficientes.get(bien_uso, 0.20)
    return Response({
        'bien_uso': bien_uso,
        'vida_util': vida_util,
        'coeficiente': coeficiente
    })

@api_view(['POST'])
def init_depreciaciones(request):
    maquinaria_col = get_collection(Maquinaria)
    depreciaciones_col = get_collection('depreciaciones')
    maquinarias = list(maquinaria_col.find())
    nuevas = 0
    for maq in maquinarias:
        existe = depreciaciones_col.find_one({'maquinaria': maq['_id']})
        if existe:
            continue
        # Lógica igual a la del backend para crear depreciación inicial
        tipo_maquinaria = maq.get('tipo', '')
        detalle_maquinaria = maq.get('detalle', '')
        bien_uso, vida_util = DepreciacionesGeneralView().determinar_bien_uso_y_vida_util(tipo_maquinaria, detalle_maquinaria)
        costo_activo = maq.get('costo_activo', 0)
        fecha_compra = maq.get('fecha_registro', datetime.now())
        metodo = maq.get('metodo_depreciacion', 'linea_recta')
        valor_residual = maq.get('valor_residual', 0)
        tabla = []
        fecha = fecha_compra if isinstance(fecha_compra, datetime) else datetime.now()
        if metodo == 'linea_recta':
            anual = (float(costo_activo) - float(valor_residual)) / float(vida_util) if float(vida_util) else 0
            depreciacionAcumulada = 0
            valorEnLibros = float(costo_activo)
            for i in range(int(vida_util)):
                depreciacionAcumulada += anual
                valorEnLibros -= anual
                tabla.append({
                    'anio': fecha.year + i,
                    'valor_anual_depreciado': round(anual, 2),
                    'depreciacion_acumulada': round(depreciacionAcumulada, 2),
                    'valor_en_libros': round(max(valorEnLibros, 0), 2),
                })
        dep = {
            'maquinaria': maq['_id'],
            'costo_activo': float(costo_activo),
            'fecha_compra': fecha.strftime('%Y-%m-%d'),
            'metodo': metodo,
            'vida_util': int(vida_util),
            'bien_uso': bien_uso,
            'depreciacion_por_anio': tabla,
            'fecha_creacion': datetime.now(),
            'fecha_actualizacion': datetime.now(),
            'advertencia': 'Depreciación generada automáticamente por endpoint.'
        }
        dep = convert_dates_to_str(dep)  # <-- BSON safe
        depreciaciones_col.insert_one(dep)
        nuevas += 1
    return Response({'creadas': nuevas, 'total_maquinarias': len(maquinarias)}, status=200)

class MaquinariasConDepreciacionView(APIView):
    def get(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        depreciaciones_collection = get_collection('depreciaciones')
        try:
            maquinarias = list(maquinaria_collection.find())
            resultado = []
            for maq in maquinarias:
                dep = depreciaciones_collection.find_one(
                    {'maquinaria': maq['_id']},
                    sort=[('fecha_creacion', -1)]
                )
                maquinaria_serializada = serialize_doc(maq)
                if dep:
                    dep_serializada = serialize_doc(dep)
                    maquinaria_serializada['bien_de_uso'] = dep_serializada.get('bien_uso', '')
                    maquinaria_serializada['vida_util'] = dep_serializada.get('vida_util', '')
                    maquinaria_serializada['costo_activo'] = dep_serializada.get('costo_activo', 0)
                resultado.append(maquinaria_serializada)
            return Response(resultado, status=200)
        except Exception as e:
            logger.error(f"Error en MaquinariasConDepreciacionView: {str(e)}")
            return Response({'error': str(e)}, status=500)

class MaquinariaConDepreciacionBuscarView(APIView):
    def get(self, request):
        q = request.GET.get('q', '').strip().lower()
        if not q:
            return Response({'error': 'Debe proporcionar un parámetro de búsqueda.'}, status=400)
        maquinaria_collection = get_collection(Maquinaria)
        depreciaciones_collection = get_collection('depreciaciones')
        maq = maquinaria_collection.find_one({
            '$or': [
                {'placa': {'$regex': q, '$options': 'i'}},
                {'codigo': {'$regex': q, '$options': 'i'}},
                {'detalle': {'$regex': q, '$options': 'i'}},
            ]
        })
        if not maq:
            return Response({'error': 'No se encontró la maquinaria'}, status=404)
        dep = depreciaciones_collection.find_one({'maquinaria': maq['_id']}, sort=[('fecha_creacion', -1)])
        maquinaria_serializada = serialize_doc(maq)
        if dep:
            dep_serializada = serialize_doc(dep)
            maquinaria_serializada['bien_de_uso'] = dep_serializada.get('bien_uso', '')
            maquinaria_serializada['vida_util'] = dep_serializada.get('vida_util', '')
            maquinaria_serializada['costo_activo'] = dep_serializada.get('costo_activo', 0)
        return Response(maquinaria_serializada, status=200)