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
    return convert(doc)

def serialize_list(docs):
    """Serializa una lista de documentos de PyMongo."""
    try:
        return [serialize_doc(doc.copy()) for doc in docs]
    except Exception as e:
        logger.error(f"Error en serialize_list: {str(e)}")
        raise

def convert_dates_to_str(data):
    for k, v in data.items():
        if isinstance(v, date):
            data[k] = v.strftime('%Y-%m-%d')
        elif isinstance(v, dict):
            data[k] = convert_dates_to_str(v)
        elif isinstance(v, list):
            data[k] = [convert_dates_to_str(i) if isinstance(i, dict) else i for i in v]
    return data

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
            
            # Asegurar que el campo imagen se incluya si está presente en request.data
            if 'imagen' in request.data:
                validated_data['imagen'] = request.data['imagen']
                logger.info(f"Imagen incluida en la actualización: {len(request.data['imagen'])} caracteres")

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

# Agregar función auxiliar para formatear el método como oración
def format_metodo_oracion(metodo):
    if not metodo:
        return "-"
    return metodo.replace('_', ' ').capitalize()

class DepreciacionGeneralView(APIView):
    def determinar_bien_uso_y_vida_util(self, tipo_maquinaria, detalle_maquinaria):
        try:
            # Asegurar que ambos valores sean cadenas antes de usar .lower()
            tipo_lower = str(tipo_maquinaria).lower() if tipo_maquinaria is not None else ""
            detalle_lower = str(detalle_maquinaria).lower() if detalle_maquinaria is not None else ""

            # Validaciones seguras con palabras clave
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
            return "Desconocido", 5  # Valores seguros en caso de fallo

    # Diccionario reducido de bienes de uso relevantes para autos y maquinaria
    BIENES_DE_USO_DS_24051 = {
        'Vehículos automotores': {'vida_util': 5, 'coeficiente': 0.20},
        'Maquinaria en general': {'vida_util': 8, 'coeficiente': 0.125},
        'Maquinaria para la construcción': {'vida_util': 5, 'coeficiente': 0.20},
        'Equipos e instalaciones': {'vida_util': 8, 'coeficiente': 0.125},
        'Equipos de computación': {'vida_util': 4, 'coeficiente': 0.25},
        'Muebles y enseres de oficina': {'vida_util': 10, 'coeficiente': 0.10},
    }

    def generar_detalle_depreciacion(self, metodo, costo_activo, vida_util, fecha_compra_str, valor_residual=0, bien_de_uso=None):
        try:
            coeficiente = None
            if bien_de_uso and bien_de_uso in self.BIENES_DE_USO_DS_24051:
                vida_util = self.BIENES_DE_USO_DS_24051[bien_de_uso]['vida_util']
                coeficiente = self.BIENES_DE_USO_DS_24051[bien_de_uso]['coeficiente']

            if not isinstance(costo_activo, (int, float)) or costo_activo <= 0:
                costo_activo = 1
            if not isinstance(vida_util, int) or vida_util <= 0:
                vida_util = 5
            if not isinstance(valor_residual, (int, float)) or valor_residual < 0:
                valor_residual = 0

            try:
                fecha_compra = datetime.strptime(fecha_compra_str.split('T')[0], "%Y-%m-%d")
            except (ValueError, TypeError):
                fecha_compra = datetime.now()
                advertencia = "Fecha de compra inválida, usando fecha actual."
            else:
                advertencia = ""

            detalle = []
            base = costo_activo - valor_residual
            if base < 0:
                base = 0

            depreciacion_acumulada = 0
            valor_en_libros = costo_activo

            if metodo in ["coeficiente", "ds_24051"] and coeficiente:
                for i in range(vida_util):
                    dep_anual = base * coeficiente
                    if i == vida_util - 1 or base - dep_anual < 0:
                        dep_anual = base
                    base -= dep_anual
                    depreciacion_acumulada += dep_anual
                    valor_en_libros -= dep_anual
                    detalle.append({
                        "anio": fecha_compra.year + i,
                        "valor_anual_depreciado": round(dep_anual, 2),
                        "depreciacion_acumulada": round(depreciacion_acumulada, 2),
                        "valor_en_libros": round(valor_en_libros, 2)
                    })
            elif metodo == "linea_recta":
                depreciacion_anual = base / vida_util
                for i in range(vida_util):
                    if i == vida_util - 1:
                        dep_anual = valor_en_libros - valor_residual
                    else:
                        dep_anual = depreciacion_anual
                    depreciacion_acumulada += dep_anual
                    valor_en_libros -= dep_anual
                    detalle.append({
                        "anio": fecha_compra.year + i,
                        "valor_anual_depreciado": round(dep_anual, 2),
                        "depreciacion_acumulada": round(depreciacion_acumulada, 2),
                        "valor_en_libros": round(valor_en_libros, 2)
                    })
            elif metodo == "saldo_decreciente":
                tasa = (1 / vida_util) * 2
                for i in range(vida_util):
                    dep_anual = valor_en_libros * tasa
                    if i == vida_util - 1 or valor_en_libros - dep_anual < valor_residual:
                        dep_anual = valor_en_libros - valor_residual
                    depreciacion_acumulada += dep_anual
                    valor_en_libros -= dep_anual
                    detalle.append({
                        "anio": fecha_compra.year + i,
                        "valor_anual_depreciado": round(dep_anual, 2),
                        "depreciacion_acumulada": round(depreciacion_acumulada, 2),
                        "valor_en_libros": round(valor_en_libros, 2)
                    })
            elif metodo == "suma_digitos":
                suma_digitos = sum(range(1, vida_util + 1))
                for i in range(vida_util):
                    años_restantes = vida_util - i
                    factor = años_restantes / suma_digitos
                    dep_anual = base * factor
                    depreciacion_acumulada += dep_anual
                    valor_en_libros -= dep_anual
                    detalle.append({
                        "anio": fecha_compra.year + i,
                        "valor_anual_depreciado": round(dep_anual, 2),
                        "depreciacion_acumulada": round(depreciacion_acumulada, 2),
                        "valor_en_libros": round(valor_en_libros, 2)
                    })
            else:
                depreciacion_anual = base / vida_util
                for i in range(vida_util):
                    depreciacion_acumulada += depreciacion_anual
                    valor_en_libros -= depreciacion_anual
                    detalle.append({
                        "anio": fecha_compra.year + i,
                        "valor_anual_depreciado": round(depreciacion_anual, 2),
                        "depreciacion_acumulada": round(depreciacion_acumulada, 2),
                        "valor_en_libros": round(valor_en_libros, 2)
                    })
            # --- Eliminar campo 'valor' si existe en algún objeto y asegurar solo los campos requeridos ---
            for d in detalle:
                if "valor" in d:
                    del d["valor"]
                # Eliminar auditoria y observacion si existen
                d.pop("auditoria", None)
                d.pop("observacion", None)
            return detalle, advertencia
        except Exception as e:
            logger.error(f"Error generando tabla de depreciación: {e}")
            return [], "Error al generar tabla de depreciación"

    def get(self, request):
        try:
            maquinaria_collection = get_collection("maquinaria")
            depreciaciones_collection = get_collection("depreciaciones")
            maquinarias = list(maquinaria_collection.find({}, {
                "_id": 1, "placa": 1, "detalle": 1, "codigo": 1,
                "metodo_depreciacion": 1, "adqui": 1, "fecha_registro": 1,
                "tipo": 1
            }))
            resultado = []
            for m in maquinarias:
                try:
                    # Extraer valores base
                    tipo_maquinaria = m.get("tipo")
                    detalle_maquinaria = m.get("detalle")
                    adqui = m.get("adqui")  # Valor de adquisición (no es costo_activo)
                    fecha_registro_raw = m.get("fecha_registro")

                    # Buscar depreciación existente para obtener costo_activo real
                    depreciacion_existente = depreciaciones_collection.find_one(
                        {"maquinaria": m["_id"]},
                        sort=[("fecha_creacion", -1)]  # Obtener el más reciente
                    )

                    # Procesar valor de adquisición (solo como referencia)
                    try:
                        adqui = float(adqui) if adqui else 0
                    except (ValueError, TypeError):
                        adqui = 0

                    # Procesar fecha
                    if isinstance(fecha_registro_raw, datetime):
                        fecha_compra_str = fecha_registro_raw.strftime('%Y-%m-%d')
                    elif isinstance(fecha_registro_raw, str):
                        fecha_compra_str = fecha_registro_raw.split('T')[0]
                    else:
                        fecha_compra_str = datetime.now().strftime('%Y-%m-%d')

                    # Determinar bien de uso y vida útil
                    bien_de_uso, vida_util = self.determinar_bien_uso_y_vida_util(tipo_maquinaria, detalle_maquinaria)

                    # Usar datos de depreciación existente si hay
                    if depreciacion_existente:
                        costo_activo = depreciacion_existente.get("costo_activo")
                        metodo = depreciacion_existente.get("metodo", m.get("metodo_depreciacion", "linea_recta"))
                        fecha_compra = depreciacion_existente.get("fecha_compra")
                        if isinstance(fecha_compra, datetime):
                            fecha_compra_str = fecha_compra.strftime('%Y-%m-%d')
                        depreciacion_por_anio = depreciacion_existente.get("depreciacion_por_anio", [])
                        # --- Asegurar que cada objeto tenga los campos requeridos ---
                        for d in depreciacion_por_anio:
                            d.setdefault("anio", None)
                            d.setdefault("valor_anual_depreciado", d.get("valor", None))
                            d.setdefault("depreciacion_acumulada", None)
                            d.setdefault("valor_en_libros", None)
                        advertencia = "Datos de depreciación guardados en el sistema."
                    else:
                        costo_activo = None
                        metodo = m.get("metodo_depreciacion", "linea_recta")
                        depreciacion_por_anio, advertencia = self.generar_detalle_depreciacion(
                            metodo, adqui, vida_util, fecha_compra_str
                        )
                        # --- Asegurar que cada objeto tenga los campos requeridos ---
                        for d in depreciacion_por_anio:
                            d.setdefault("anio", None)
                            d.setdefault("valor_anual_depreciado", d.get("valor", None))
                            d.setdefault("depreciacion_acumulada", None)
                            d.setdefault("valor_en_libros", None)

                    # Agregar a resultado
                    resultado.append({
                        "maquinaria_id": str(m["_id"]),
                        "placa": m.get("placa"),
                        "detalle": m.get("detalle"),
                        "codigo": m.get("codigo"),
                        # --- Mostrar el método como oración ---
                        "metodo_depreciacion": format_metodo_oracion(metodo),
                        "costo_activo": costo_activo,  # Ahora incluye el valor real si existe
                        "adqui": adqui,  # Valor de adquisición como referencia
                        "vida_util": vida_util,
                        "depreciacion_por_anio": depreciacion_por_anio,
                        "bien_de_uso": bien_de_uso,
                        "fecha_compra": fecha_compra_str,
                        "advertencia": advertencia,
                    })
                except Exception as inner_error:
                    logger.warning(f"Error procesando máquina {m.get('_id')}: {inner_error}")
                    continue  # Saltar máquinas con errores

            return Response(resultado)
        except Exception as e:
            logger.error(f"Error en DepreciacionGeneralView: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DepreciacionListView(APIView):
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
        
        # Log para depuración
        logger.info(f"Datos recibidos en POST depreciación: {data}")
        
        serializer = DepreciacionSerializer(data=data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()
            
            collection = get_collection('depreciaciones')
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)
        
        # Log de errores de validación
        logger.error(f"Errores de validación en depreciación: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DepreciacionDetailView(APIView):
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

            # Depreciación total acumulada (sumar todos los valores de depreciacion_por_anio de la colección depreciaciones)
            depreciacion_total = 0
            try:
                depreciaciones_collection = get_collection("depreciaciones")
                for dep in depreciaciones_collection.find({}):
                    for entry in dep.get("depreciacion_por_anio", []):
                        depreciacion_total += float(entry.get("valor", 0))
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
                'coeficiente': round(float(a.get('coeficiente', 0)) * 100, 2) if a.get('coeficiente') is not None else ''
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
            dias = (datetime.today().date() - data["fecha_asig"]).days

            predecir_mantenimiento = cargar_funcion_pronostico()
            resultado = predecir_mantenimiento({
                "dias": dias,
                "recorrido": data["recorrido"],
                "horas_op": data["horas_op"]
            })

            pronostico_data = {
                "placa": data["placa"],
                "fecha_asig": data["fecha_asig"].isoformat(),
                "horas_op": data["horas_op"],
                "recorrido": data["recorrido"],
                **resultado,
                "creado_en": datetime.now().isoformat()
            }

            print('Intentando guardar pronóstico en la base de datos:', pronostico_data)
            inserted_id = Pronostico().insert(pronostico_data)
            print('Pronóstico guardado con ID:', inserted_id)
            inserted_doc = Pronostico().find_one({"_id": inserted_id})
            
            # Serializar el documento para la respuesta
            return Response(serialize_doc(inserted_doc), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        registros = Pronostico().find_all()
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