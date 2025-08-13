from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from bson import ObjectId, json_util
import json, requests, logging, os, traceback
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, date, timedelta
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from .models import Maquinaria, HistorialControl, ActaAsignacion, Mantenimiento, Seguro, ITV, SOAT, Impuesto, Usuario, Pronostico, Seguimiento, VerificacionRegistro
from .serializers import (
    MaquinariaSerializer,
    RegistroSerializer,
    LoginSerializer,
    VerificarCodigoSerializer,
    ReenviarCodigoSerializer,
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
from .mongo_connection import get_collection, get_collection_from_activos_db
import bcrypt
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail, EmailMultiAlternatives
import ast
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)

# --- Funciones auxiliares para PyMongo y serialización ---

def create_default_admin():
    """Crea un usuario admin por defecto si no existe ninguno"""
    try:
        usuarios_collection = get_collection(Usuario)
        # Verificar si ya existe un admin
        admin_exists = usuarios_collection.find_one({"Cargo": "admin"})
        if not admin_exists:
            # Crear usuario admin por defecto
            admin_data = {
                "Nombre": "Administrador",
                "Cargo": "admin",
                "Unidad": "Sistema",
                "Email": "admin123@gmail.com",
                "Password": bcrypt.hashpw("Aleatorio12$".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "Permiso": "Admin",
                "permisos": {
                    "Dashboard": {"ver": True, "crear": True, "editar": True, "eliminar": True},
                    "Maquinaria": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Control": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Asignación": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Mantenimiento": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "SOAT": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Impuestos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Seguros": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Inspección Técnica Vehicular": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Depreciaciones": {"ver": True, "crear": True, "editar": True, "eliminar": False},
                    "Activos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Pronóstico": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "Reportes": {"ver": True, "crear": True, "editar": True, "eliminar": True},
                    "Usuarios": {"ver": True, "crear": True, "editar": True, "eliminar": True}
                },
                "activo": True,
                "fecha_creacion": datetime.now()
            }
            usuarios_collection.insert_one(admin_data)
            logger.info("Usuario admin por defecto creado exitosamente")
            return True
        return False
    except Exception as e:
        logger.error(f"Error al crear usuario admin por defecto: {str(e)}")
        return False

def check_user_permissions(user, required_role=None, required_permission=None, module=None):
    if not user:
        return False
    
    cargo = user.get('Cargo', '').lower()
    
    # Verificar rol requerido
    if required_role:
        if required_role == 'admin' and cargo != 'admin':
            return False
        elif required_role == 'encargado' and cargo not in ['admin', 'encargado']:
            return False
        elif required_role == 'tecnico' and cargo not in ['admin', 'encargado', 'tecnico', 'técnico']:
            return False
    
    # Si es admin, tiene acceso completo excepto modificar maquinaria
    if cargo == 'admin':
        # Restricciones específicas del admin
        if module == 'Maquinaria' and required_permission in ['crear', 'editar', 'eliminar']:
            return False
        # Para todo lo demás, el admin tiene acceso completo
        return True
    
    # Si es encargado, tiene permisos completos excepto gestión de roles
    if cargo == 'encargado':
        if module == 'Usuarios' and required_permission in ['crear', 'editar', 'eliminar']:
            return False
        return True
    
    # Si es técnico, verificar permisos granulares
    if cargo == 'tecnico' or cargo == 'técnico':
        if not module or not required_permission:
            return True
        
        # Para maquinaria, el técnico solo puede crear, no editar ni eliminar
        if module == 'Maquinaria':
            if required_permission == 'crear':
                logger.info(f"check_user_permissions - técnico puede crear maquinaria, returning True")
                return True
            elif required_permission in ['editar', 'eliminar']:
                logger.info(f"check_user_permissions - técnico NO puede {required_permission} maquinaria, returning False")
                return False
        
        # Para control, asignación, mantenimiento, seguros, ITV, impuestos, SOAT, el técnico solo puede crear
        if module in ['HistorialControl', 'ActaAsignacion', 'Mantenimiento', 'Seguro', 'ITV', 'Impuesto', 'SOAT']:
            if required_permission == 'crear':
                logger.info(f"check_user_permissions - técnico puede crear {module}, returning True")
                return True
            elif required_permission in ['editar', 'eliminar']:
                logger.info(f"check_user_permissions - técnico NO puede {required_permission} {module}, returning False")
                return False
        
        permisos = user.get('permisos', {})
        module_permissions = permisos.get(module, {})
        
        # Para depreciaciones, técnicos pueden crear por defecto
        if module == 'Depreciaciones' and required_permission == 'crear':
            # Técnicos pueden crear depreciaciones sin restricciones
            return True
        
        return module_permissions.get(required_permission, False)
    
    return False

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
            # Formato consistente: yyyy-mm-dd
            if isinstance(value, datetime):
                # Si es solo fecha sin hora específica, mostrar solo fecha
                if value.hour == 0 and value.minute == 0 and value.second == 0:
                    return value.strftime('%Y-%m-%d')
                else:
                    return value.strftime('%Y-%m-%d')
            else:
                return value.strftime('%Y-%m-%d')
        elif isinstance(value, dict):
            return {k: convert(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [convert(v) for v in value]
        else:
            return value
    doc = convert(doc)
    
    # Quitar la contraseña si existe
    if 'Password' in doc:
        del doc['Password']
    
    # Quitar campos que no queremos mostrar (pero mantener _id y maquinaria_id para reactivación)
    campos_a_quitar = ['maquinaria', 'activo']
    for campo in campos_a_quitar:
        if campo in doc:
            del doc[campo]
    
    # Convertir maquinaria a maquinaria_id si existe
    if 'maquinaria' in doc:
        doc['maquinaria_id'] = str(doc['maquinaria'])
        del doc['maquinaria']
    
    # --- Asegurar maquinaria_id como string si existe ---
    if 'maquinaria_id' in doc:
        # Obtener la placa de la maquinaria en lugar del ID
        try:
            maquinaria_collection = get_collection('maquinaria')
            maquinaria = maquinaria_collection.find_one({"_id": ObjectId(doc['maquinaria_id'])})
            if maquinaria:
                doc['Maquinaria'] = maquinaria.get('placa', 'Sin placa')
            else:
                doc['Maquinaria'] = 'Maquinaria no encontrada'
        except:
            doc['Maquinaria'] = 'Error al obtener maquinaria'
        # NO eliminar maquinaria_id, lo necesitamos para reactivación
    
    # Solo mapear campos que realmente necesitan ser renombrados
    mapeo_campos = {
        'fecha_asignacion': 'fecha_asignacion',
        'fecha_liberacion': 'fecha_liberacion'
    }
    
    # Aplicar mapeo de campos solo si existen
    for campo_original, campo_nuevo in mapeo_campos.items():
        if campo_original in doc:
            doc[campo_nuevo] = doc.pop(campo_original)
    

    
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
        return obj.strftime('%Y-%m-%d')
    else:
        return obj

# --- Vistas para Maquinaria Principal ---

class MaquinariaListView(APIView):
    def get(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        try:
            # Solo mostrar maquinarias activas (activo=True o no tiene campo activo)
            maquinarias_cursor = maquinaria_collection.find({
                "$or": [
                    {"activo": True},
                    {"activo": {"$exists": False}}
                ]
            })
            
            # Serializar sin mapeo de campos para maquinaria
            def serialize_maquinaria(doc):
                if not doc:
                    return None
                from bson import ObjectId
                from datetime import datetime, date
                def convert(value):
                    if isinstance(value, ObjectId):
                        return str(value)
                    elif isinstance(value, (datetime, date)):
                        if isinstance(value, datetime):
                            if value.hour == 0 and value.minute == 0 and value.second == 0:
                                return value.strftime('%d/%m/%Y')
                            else:
                                return value.strftime('%d/%m/%Y %H:%M:%S')
                        else:
                            return value.strftime('%d/%m/%Y')
                    elif isinstance(value, dict):
                        return {k: convert(v) for k, v in value.items()}
                    elif isinstance(value, list):
                        return [convert(v) for v in value]
                    else:
                        return value
                return convert(doc)
            
            maquinarias_data = [serialize_maquinaria(doc) for doc in maquinarias_cursor]
            return Response(maquinarias_data)
        except Exception as e:
            logger.error(f"Error al obtener lista de maquinarias: {str(e)}")
            return Response({"error": f"Error al obtener datos: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        maquinaria_collection = get_collection(Maquinaria)
        try:
            # Verificar permisos
            actor_email = request.headers.get('X-User-Email')
            user = get_collection(Usuario).find_one({"Email": actor_email}) if actor_email else None
            
            if not check_user_permissions(user, required_permission='crear', module='Maquinaria'):
                return Response({"error": "No tienes permisos para crear maquinaria"}, status=status.HTTP_403_FORBIDDEN)
            
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
                # Agregar el campo registrado_por con el nombre del usuario
                validated_data['registrado_por'] = user['Nombre'] if user and 'Nombre' in user else actor_email
                # Por defecto, los registros son activos
                validated_data['activo'] = True
                validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
                result = maquinaria_collection.insert_one(validated_data)
                new_maquinaria = maquinaria_collection.find_one({"_id": result.inserted_id})
                # --- REGISTRO DE ACTIVIDAD ---
                try:
                    actor_email = request.headers.get('X-User-Email')
                    mensaje = f"Creó maquinaria con placa {validated_data.get('placa', '')}"
                    registrar_actividad(
                        actor_email,
                        'crear_maquinaria',
                        'Maquinaria',
                        mensaje,
                        {'datos': serialize_doc(new_maquinaria)}
                    )
                except Exception as e:
                    logger.error(f"Error al registrar actividad de creación de maquinaria: {str(e)}")
                # --- FIN REGISTRO DE ACTIVIDAD ---
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

            # Serializar sin mapeo de campos para maquinaria
            def serialize_maquinaria_detail(doc):
                if not doc:
                    return None
                from bson import ObjectId
                from datetime import datetime, date
                def convert(value):
                    if isinstance(value, ObjectId):
                        return str(value)
                    elif isinstance(value, (datetime, date)):
                        if isinstance(value, datetime):
                            if value.hour == 0 and value.minute == 0 and value.second == 0:
                                return value.strftime('%d/%m/%Y')
                            else:
                                return value.strftime('%d/%m/%Y %H:%M:%S')
                        else:
                            return value.strftime('%d/%m/%Y')
                    elif isinstance(value, dict):
                        return {k: convert(v) for k, v in value.items()}
                    elif isinstance(value, list):
                        return [convert(v) for v in value]
                    else:
                        return value
                return convert(doc)

            # Solo devolver los datos de la maquinaria principal, sin anidar sub-secciones
            return Response(serialize_maquinaria_detail(maquinaria_doc))

        except Exception as e:
            logger.error(f"Error al obtener detalle de maquinaria: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, id):
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Verificar permisos
            actor_email = request.headers.get('X-User-Email')
            user = get_collection(Usuario).find_one({"Email": actor_email})
            
            if not check_user_permissions(user, required_permission='editar', module='Maquinaria'):
                return Response({"error": "No tienes permisos para editar maquinaria"}, status=status.HTTP_403_FORBIDDEN)
            
            data = request.data.copy()
            # --- RESTRICCIÓN DE CAMPOS POR ROL ---
            cargo = user.get('Cargo', '').lower() if user else ''
            if cargo != 'encargado':
                data.pop('validado_por', None)
                data.pop('autorizado_por', None)
            logger.info(f"Datos recibidos en PUT: {data}")
            
            existing_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            if not existing_maquinaria:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            # Validar con el serializer
            serializer = MaquinariaSerializer(data=data, partial=True)
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

            # Agregar o actualizar el campo registrado_por con el nombre del usuario
            validated_data['registrado_por'] = user['Nombre'] if user and 'Nombre' in user else actor_email

            # Actualizar en MongoDB
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            maquinaria_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": validated_data}
            )
            
            # Obtener y devolver el registro actualizado
            updated_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó maquinaria con placa {existing_maquinaria.get('placa', id)}"
                registrar_actividad(
                    actor_email,
                    'editar_maquinaria',
                    'Maquinaria',
                    mensaje,
                    {'antes': serialize_doc(existing_maquinaria), 'despues': serialize_doc(updated_maquinaria)}
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de maquinaria: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_maquinaria))

        except Exception as e:
            logger.error(f"Error al actualizar maquinaria: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, id):
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Verificar permisos
            actor_email = request.headers.get('X-User-Email')
            user = get_collection(Usuario).find_one({"Email": actor_email})

            existing_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            if not existing_maquinaria:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            permanent = str(request.query_params.get('permanent', 'false')).lower() in ['1', 'true', 'yes']
            if permanent:
                # Solo admin puede eliminar permanentemente
                if not user or user.get('Cargo', '').lower() != 'admin':
                    return Response({"error": "Solo el administrador puede eliminar maquinaria permanentemente"}, status=status.HTTP_403_FORBIDDEN)
                maquinaria_collection.delete_one({"_id": ObjectId(id)})
                try:
                    mensaje = f"Eliminó permanentemente maquinaria con placa {existing_maquinaria.get('placa', id)}"
                    registrar_actividad(
                        actor_email,
                        'eliminar_permanente_maquinaria',
                        'Maquinaria',
                        mensaje,
                        {'datos': serialize_doc(existing_maquinaria)}
                    )
                except Exception:
                    pass
                return Response({"success": True})

            # Soft delete si no es permanente
            if not check_user_permissions(user, required_permission='eliminar', module='Maquinaria'):
                return Response({"error": "No tienes permisos para desactivar maquinaria"}, status=status.HTTP_403_FORBIDDEN)

            maquinaria_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
            )
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                mensaje = f"Desactivó maquinaria con placa {existing_maquinaria.get('placa', id)}"
                registrar_actividad(
                    actor_email,
                    'desactivar_maquinaria',
                    'Maquinaria',
                    mensaje,
                    {'datos': serialize_doc(existing_maquinaria)}
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de desactivación de maquinaria: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response({"success": True})
        except Exception as e:
            logger.error(f"Error al desactivar maquinaria: {str(e)}")
            return Response({"error": f"Error al desactivar registro: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, id):
        """Reactivar una maquinaria desactivada"""
        # Verificar permisos de ADMINISTRADOR únicamente
        actor_email = request.headers.get('X-User-Email')
        if not actor_email:
            return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_collection(Usuario).find_one({"Email": actor_email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({"error": "Solo los administradores pueden reactivar maquinarias"}, status=status.HTTP_403_FORBIDDEN)
        
        maquinaria_collection = get_collection(Maquinaria)
        if not ObjectId.is_valid(id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            existing_maquinaria = maquinaria_collection.find_one({"_id": ObjectId(id)})
            if not existing_maquinaria:
                return Response({"error": "Máquina no encontrada"}, status=status.HTTP_404_NOT_FOUND)
            
            # Reactivar la maquinaria
            maquinaria_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"activo": True, "fecha_reactivacion": datetime.now()}}
            )
            
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Reactivó maquinaria con placa {existing_maquinaria.get('placa', id)}"
                registrar_actividad(
                    actor_email,
                    'reactivar_maquinaria',
                    'Maquinaria',
                    mensaje,
                    {'datos': serialize_doc(existing_maquinaria)}
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de reactivación de maquinaria: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            
            return Response({"success": True})
        except Exception as e:
            logger.error(f"Error al reactivar maquinaria: {str(e)}")
            return Response({"error": f"Error al reactivar registro: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        # Solo mostrar registros activos
        filtro = {
            'maquinaria': ObjectId(maquinaria_id),
            "$or": [
                {"activo": True},
                {"activo": {"$exists": False}}
            ]
        }
        cursor = collection.find(filtro, self.projection or None)
        cursor = paginar_cursor(cursor, page, page_size)
        records = list(cursor)
        
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        # --- RESTRICCIÓN DE CAMPOS POR ROL ---
        actor_email = request.headers.get('X-User-Email')
        user = get_collection(Usuario).find_one({"Email": actor_email})
        cargo = user.get('Cargo', '').lower() if user else ''
        if cargo != 'encargado':
            data.pop('validado_por', None)
            data.pop('autorizado_por', None)
        data['maquinaria'] = str(maquinaria_id)
        
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()
            # Por defecto, los registros son activos
            validated_data['activo'] = True
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
        data = request.data.copy()
        # --- RESTRICCIÓN DE CAMPOS POR ROL ---
        actor_email = request.headers.get('X-User-Email')
        user = get_collection(Usuario).find_one({"Email": actor_email})
        cargo = user.get('Cargo', '').lower() if user else ''
        if cargo != 'encargado':
            data.pop('validado_por', None)
            data.pop('autorizado_por', None)
        collection = get_collection(self.collection_class)
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)}, self.projection or None)
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                maquinaria_placa = get_maquinaria_info(maquinaria_id)
                record_desc = get_record_description(existing_record, self.collection_class.__name__)
                mensaje = f"Editó {record_desc} para maquinaria {maquinaria_placa}"
                registrar_actividad(
                    actor_email,
                    'editar_' + self.collection_class.__name__.lower(),
                    self.collection_class.__name__,
                    mensaje,
                    {'antes': serialize_doc(existing_record), 'despues': serialize_doc(updated_record)}
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de {self.collection_class.__name__}: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection(self.collection_class)
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # ¿Eliminación permanente?
        permanent = str(request.query_params.get('permanent', 'false')).lower() in ['1', 'true', 'yes']
        if permanent:
            # Requerir ADMIN para eliminación permanente
            actor_email = request.headers.get('X-User-Email')
            user = get_collection(Usuario).find_one({"Email": actor_email})
            if not user or user.get('Cargo', '').lower() != 'admin':
                return Response({"error": "Solo los administradores pueden eliminar permanentemente"}, status=status.HTTP_403_FORBIDDEN)

            collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                maquinaria_placa = get_maquinaria_info(maquinaria_id)
                record_desc = get_record_description(existing_record, self.collection_class.__name__)
                mensaje = f"Eliminó permanentemente {record_desc} para maquinaria {maquinaria_placa}"
                registrar_actividad(
                    actor_email,
                    'eliminar_permanente_' + self.collection_class.__name__.lower(),
                    self.collection_class.__name__,
                    mensaje,
                    {'datos': serialize_doc(existing_record)}
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de eliminación permanente de {self.collection_class.__name__}: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response({"success": True})

        # Soft delete por defecto
        collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, self.collection_class.__name__)
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_' + self.collection_class.__name__.lower(),
                self.collection_class.__name__,
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de {self.collection_class.__name__}: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

    def patch(self, request, maquinaria_id, record_id):
        """Reactivar un registro desactivado"""
        # Verificar permisos de ADMINISTRADOR únicamente
        actor_email = request.headers.get('X-User-Email')
        if not actor_email:
            return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_collection(Usuario).find_one({"Email": actor_email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({"error": "Solo los administradores pueden reactivar registros"}, status=status.HTTP_403_FORBIDDEN)
        
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection(self.collection_class)
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": f"{self.collection_class.__name__} no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # Reactivar el registro
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": True, "fecha_reactivacion": datetime.now()}}
        )
        
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, self.collection_class.__name__)
            mensaje = f"Reactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'reactivar_' + self.collection_class.__name__.lower(),
                self.collection_class.__name__,
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de reactivación de {self.collection_class.__name__}: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        
        return Response({"success": True})

# --- Vistas Específicas para cada Sección ---

class HistorialControlListView(BaseSectionAPIView):
    collection_class = HistorialControl
    serializer_class = HistorialControlSerializer
    projection = None  # Incluir todos los campos

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
        # Solo mostrar registros activos
        records = list(collection.find({
            'maquinaria': ObjectId(maquinaria_id),
            "$or": [
                {"activo": True},
                {"activo": {"$exists": False}}
            ]
        }))
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
            # Por defecto, los registros son activos
            validated_data['activo'] = True

            # Convertir fechas a datetime
            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Datos convertidos: {validated_data}")

            # Insertar en MongoDB
            collection = get_collection('historial_control')
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó control para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'crear_control',
                    'HistorialControl',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'control_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de control: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear control: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistorialControlDetailView(BaseSectionDetailAPIView):
    collection_class = HistorialControl
    serializer_class = HistorialControlSerializer
    projection = None  # Incluir todos los campos

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
        # Solo deja los campos válidos para el serializer
        valid_fields = set(self.serializer_class().get_fields().keys())
        data = {k: v for k, v in data.items() if k in valid_fields}
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó control para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_control',
                    'HistorialControl',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'control_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de control: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('historial_control')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Control no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            placa_maquinaria = get_maquinaria_info(maquinaria_id)
            descripcion = get_record_description(existing_record, 'historial_control')
            mensaje = f"Desactivó {descripcion} para maquinaria {placa_maquinaria}"
            registrar_actividad(
                actor_email,
                'Desactivar control',
                'HistorialControl',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de control: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

class ActaAsignacionListView(BaseSectionAPIView):
    collection_class = ActaAsignacion
    serializer_class = ActaAsignacionSerializer
    projection = None  # Incluir todos los campos

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
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")
            maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})

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
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó asignación para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'crear_asignacion',
                    'ActaAsignacion',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'asignacion_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de asignación: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear asignación: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActaAsignacionDetailView(BaseSectionDetailAPIView):
    collection_class = ActaAsignacion
    serializer_class = ActaAsignacionSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó asignación para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_asignacion',
                    'ActaAsignacion',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'asignacion_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de asignación: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('acta_asignacion')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'ActaAsignacion')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_asignacion',
                'Asignación',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de asignación: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

class MantenimientoListView(BaseSectionAPIView):
    collection_class = Mantenimiento
    serializer_class = MantenimientoSerializer
    projection = None  # Incluir todos los campos

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
        
        collection = get_collection('mantenimiento')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Mantenimiento POST - Datos recibidos: {request.data}")
            logger.info(f"Mantenimiento POST - Headers: {request.headers}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Mantenimiento POST - Datos preparados: {data}")
            
            # Verificar conexión a MongoDB
            try:
                collection = get_collection('mantenimiento')
                logger.info("Conexión a MongoDB exitosa")
            except Exception as mongo_error:
                logger.error(f"Error de conexión a MongoDB: {str(mongo_error)}")
                return Response({"error": f"Error de conexión a base de datos: {str(mongo_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Mantenimiento POST - Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Mantenimiento POST - Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Mantenimiento POST - Datos convertidos: {validated_data}")

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            logger.info(f"Mantenimiento POST - Datos finales para MongoDB: {validated_data}")
            
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó mantenimiento para maquinaria {maquinaria_id}"
                registrar_actividad(
                    actor_email,
                    'crear_mantenimiento',
                    'Mantenimiento',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'mantenimiento_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de mantenimiento: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear mantenimiento: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": f"Error interno del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MantenimientoDetailView(BaseSectionDetailAPIView):
    collection_class = Mantenimiento
    serializer_class = MantenimientoSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó mantenimiento para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_mantenimiento',
                    'Mantenimiento',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'mantenimiento_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de mantenimiento: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('mantenimiento')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Mantenimiento no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'Mantenimiento')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_mantenimiento',
                'Mantenimiento',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de mantenimiento: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

class SeguroListView(BaseSectionAPIView):
    collection_class = Seguro
    serializer_class = SeguroSerializer
    projection = None  # Incluir todos los campos

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
        
        collection = get_collection('seguro')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Seguro POST - Datos recibidos: {request.data}")
            logger.info(f"Seguro POST - Headers: {request.headers}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Seguro POST - Datos preparados: {data}")
            
            # Verificar conexión a MongoDB
            try:
                collection = get_collection('seguro')
                logger.info("Conexión a MongoDB exitosa")
            except Exception as mongo_error:
                logger.error(f"Error de conexión a MongoDB: {str(mongo_error)}")
                return Response({"error": f"Error de conexión a base de datos: {str(mongo_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"Seguro POST - Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"Seguro POST - Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"Seguro POST - Datos convertidos: {validated_data}")

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            logger.info(f"Seguro POST - Datos finales para MongoDB: {validated_data}")
            
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó seguro para maquinaria {maquinaria_id}"
                registrar_actividad(
                    actor_email,
                    'crear_seguro',
                    'Seguro',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'seguro_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de seguro: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear seguro: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": f"Error interno del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SeguroDetailView(BaseSectionDetailAPIView):
    collection_class = Seguro
    serializer_class = SeguroSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó seguro para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_seguro',
                    'Seguro',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'seguro_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de seguro: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('seguro')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Seguro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'Seguro')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_seguro',
                'Seguro',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de seguro: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

class ITVListView(BaseSectionAPIView):
    collection_class = ITV
    serializer_class = ITVSerializer
    projection = None  # Incluir todos los campos

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
        
        collection = get_collection('itv')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")
            maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})

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
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó ITV para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'crear_itv',
                    'ITV',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'itv_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de ITV: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear ITV: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ITVDetailView(BaseSectionDetailAPIView):
    collection_class = ITV
    serializer_class = ITVSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó ITV para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_itv',
                    'ITV',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'itv_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de ITV: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('itv')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "ITV no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'ITV')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_itv',
                'ITV',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de ITV: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

class SOATListView(BaseSectionAPIView):
    collection_class = SOAT
    serializer_class = SOATSerializer
    projection = None  # Incluir todos los campos

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
        
        collection = get_collection('soat')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"SOAT POST - Datos recibidos: {request.data}")
            logger.info(f"SOAT POST - Headers: {request.headers}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"SOAT POST - Datos preparados: {data}")
            
            # Verificar conexión a MongoDB
            try:
                collection = get_collection('soat')
                logger.info("Conexión a MongoDB exitosa")
            except Exception as mongo_error:
                logger.error(f"Error de conexión a MongoDB: {str(mongo_error)}")
                return Response({"error": f"Error de conexión a base de datos: {str(mongo_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            serializer = self.serializer_class(data=data)
            if not serializer.is_valid():
                logger.error(f"SOAT POST - Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            logger.info(f"SOAT POST - Datos validados: {validated_data}")

            validated_data['fecha_creacion'] = datetime.now()
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = self.convert_date_to_datetime(validated_data)
            logger.info(f"SOAT POST - Datos convertidos: {validated_data}")

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            logger.info(f"SOAT POST - Datos finales para MongoDB: {validated_data}")
            
            result = collection.insert_one(validated_data)
            new_record = collection.find_one({"_id": result.inserted_id})
            
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó SOAT para maquinaria {maquinaria_id}"
                registrar_actividad(
                    actor_email,
                    'crear_soat',
                    'SOAT',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'soat_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de SOAT: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear SOAT: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": f"Error interno del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SOATDetailView(BaseSectionDetailAPIView):
    collection_class = SOAT
    serializer_class = SOATSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó SOAT para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_soat',
                    'SOAT',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'soat_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de SOAT: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        
        collection = get_collection('soat')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "SOAT no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'SOAT')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_soat',
                'SOAT',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de SOAT: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        
        return Response({"success": True})

class ImpuestoListView(BaseSectionAPIView):
    collection_class = Impuesto
    serializer_class = ImpuestoSerializer
    projection = None  # Incluir todos los campos

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
        
        collection = get_collection('impuesto')
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        return Response(serialize_list(records))

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"Datos recibidos en POST: {request.data}")
            
            data = request.data.copy()
            data['maquinaria'] = str(maquinaria_id)
            logger.info(f"Datos preparados: {data}")
            maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})

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
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó impuesto para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'crear_impuesto',
                    'Impuesto',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'impuesto_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de impuesto: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(new_record), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear impuesto: {str(e)}\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImpuestoDetailView(BaseSectionDetailAPIView):
    collection_class = Impuesto
    serializer_class = ImpuestoSerializer
    projection = None  # Incluir todos los campos

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
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        
        serializer = self.serializer_class(existing_record, data=data, partial=True)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()

            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó impuesto para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_impuesto',
                    'Impuesto',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'impuesto_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de impuesto: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('impuesto')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Impuesto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        # En lugar de eliminar, desactivar
        result = collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'Impuesto')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_impuesto',
                'Impuesto',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de impuesto: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

# Agregar función auxiliar para formatear el método como oración
def format_metodo_oracion(metodo):
    if not metodo:
        return "-"
    return metodo.replace('_', ' ').capitalize()

def get_maquinaria_info(maquinaria_id):
    """Obtiene información descriptiva de una maquinaria para usar en mensajes."""
    try:
        maquinaria = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        if maquinaria:
            return maquinaria.get('placa', 'Sin placa')
        return 'Maquinaria no encontrada'
    except:
        return 'Maquinaria no encontrada'

def get_record_description(record, collection_name):
    """Obtiene una descripción legible de un registro para usar en mensajes."""
    if collection_name == 'HistorialControl':
        return f"Control de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'Mantenimiento':
        return f"Mantenimiento de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'Seguro':
        return f"Seguro de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'ITV':
        return f"ITV de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'SOAT':
        return f"SOAT de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'Impuesto':
        return f"Impuesto de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'ActaAsignacion':
        return f"Asignación de {record.get('detalle', 'sin detalle')}"
    elif collection_name == 'Depreciacion':
        return f"Depreciación de {record.get('detalle', 'sin detalle')}"
    else:
        return f"Registro de {collection_name}"

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
        records = list(collection.find({'maquinaria': ObjectId(maquinaria_id), 'activo': {'$ne': False}}))
        
        # Serializar sin mapeo de campos para depreciaciones
        def serialize_depreciaciones(doc):
            if not doc:
                return None
            from bson import ObjectId
            from datetime import datetime, date
            def convert(value):
                if isinstance(value, ObjectId):
                    return str(value)
                elif isinstance(value, (datetime, date)):
                    if isinstance(value, datetime):
                        if value.hour == 0 and value.minute == 0 and value.second == 0:
                            return value.strftime('%d/%m/%Y')
                        else:
                            return value.strftime('%d/%m/%Y %H:%M:%S')
                    else:
                        return value.strftime('%d/%m/%Y')
                elif isinstance(value, dict):
                    return {k: convert(v) for k, v in value.items()}
                elif isinstance(value, list):
                    return [convert(v) for v in value]
                else:
                    return value
            return convert(doc)
        
        return Response([serialize_depreciaciones(record) for record in records])

    def post(self, request, maquinaria_id):
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Todos los usuarios pueden crear depreciaciones sin restricciones
        
        data = request.data.copy()
        data['maquinaria'] = str(maquinaria_id)
        maquinaria_collection = get_collection(Maquinaria)
        maquinaria_doc = maquinaria_collection.find_one({"_id": ObjectId(maquinaria_id)})
        tipo_maquinaria = maquinaria_doc.get('tipo', '') if maquinaria_doc else ''
        detalle_maquinaria = maquinaria_doc.get('detalle', '') if maquinaria_doc else ''
        bien_uso, vida_util = DepreciacionesGeneralView().determinar_bien_uso_y_vida_util(tipo_maquinaria, detalle_maquinaria)
        data['bien_uso'] = bien_uso
        data['vida_util'] = vida_util
        collection = get_collection('depreciaciones')
        collection.delete_many({'maquinaria': ObjectId(maquinaria_id)})
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
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Creó depreciación para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'crear_depreciacion',
                    'Depreciaciones',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'depreciacion_id': str(result.inserted_id),
                        'datos': serialize_doc(new_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de creación de depreciación: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
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
        # Parche: aceptar fecha_compra en formato DD/MM/YYYY y convertir a YYYY-MM-DD
        fecha = data.get('fecha_compra')
        if fecha and '/' in fecha:
            try:
                data['fecha_compra'] = datetime.strptime(fecha, '%d/%m/%Y').strftime('%Y-%m-%d')
            except Exception as e:
                print(f"Error al convertir fecha_compra: {e}")
        serializer = DepreciacionSerializer(existing_record, data=data, partial=True)
        maquinaria_doc = get_collection(Maquinaria).find_one({"_id": ObjectId(maquinaria_id)})
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['maquinaria'] = ObjectId(maquinaria_id)
            validated_data['fecha_actualizacion'] = datetime.now()
            validated_data = convert_dates_to_str(validated_data)  # <-- BSON safe
            collection.update_one({'_id': ObjectId(record_id)}, {'$set': validated_data})
            updated_record = collection.find_one({'_id': ObjectId(record_id)})
            # --- REGISTRO DE ACTIVIDAD ---
            try:
                actor_email = request.headers.get('X-User-Email')
                mensaje = f"Editó depreciación para maquinaria {maquinaria_doc.get('placa', maquinaria_id)}"
                registrar_actividad(
                    actor_email,
                    'editar_depreciacion',
                    'Depreciaciones',
                    mensaje,
                    {
                        'maquinaria_id': str(maquinaria_id),
                        'placa': maquinaria_doc.get('placa'),
                        'depreciacion_id': str(record_id),
                        'antes': serialize_doc(existing_record),
                        'despues': serialize_doc(updated_record)
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de edición de depreciación: {str(e)}")
            # --- FIN REGISTRO DE ACTIVIDAD ---
            return Response(serialize_doc(updated_record))
        # Responder el error exacto del serializer en el JSON
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, maquinaria_id, record_id):
        if not ObjectId.is_valid(maquinaria_id) or not ObjectId.is_valid(record_id):
            return Response({"error": "IDs inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        collection = get_collection('depreciaciones')
        existing_record = collection.find_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
        if not existing_record:
            return Response({"error": "Depreciación no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        permanent = str(request.query_params.get('permanent', 'false')).lower() in ['1', 'true', 'yes']
        if permanent:
            # Requerir ADMIN
            actor_email = request.headers.get('X-User-Email')
            user = get_collection(Usuario).find_one({"Email": actor_email})
            if not user or user.get('Cargo', '').lower() != 'admin':
                return Response({"error": "Solo los administradores pueden eliminar permanentemente"}, status=status.HTTP_403_FORBIDDEN)
            collection.delete_one({'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)})
            try:
                maquinaria_placa = get_maquinaria_info(maquinaria_id)
                record_desc = get_record_description(existing_record, 'Depreciacion')
                mensaje = f"Eliminó permanentemente {record_desc} para maquinaria {maquinaria_placa}"
                registrar_actividad(
                    actor_email,
                    'eliminar_permanente_depreciacion',
                    'Depreciaciones',
                    mensaje,
                    {'datos': serialize_doc(existing_record)}
                )
            except Exception:
                pass
            return Response({"success": True})

        # Soft delete por defecto
        collection.update_one(
            {'_id': ObjectId(record_id), 'maquinaria': ObjectId(maquinaria_id)},
            {"$set": {"activo": False, "fecha_desactivacion": datetime.now()}}
        )
        # --- REGISTRO DE ACTIVIDAD ---
        try:
            actor_email = request.headers.get('X-User-Email')
            maquinaria_placa = get_maquinaria_info(maquinaria_id)
            record_desc = get_record_description(existing_record, 'Depreciacion')
            mensaje = f"Desactivó {record_desc} para maquinaria {maquinaria_placa}"
            registrar_actividad(
                actor_email,
                'desactivar_depreciacion',
                'Depreciaciones',
                mensaje,
                {'datos': serialize_doc(existing_record)}
            )
        except Exception as e:
            logger.error(f"Error al registrar actividad de desactivación de depreciación: {str(e)}")
        # --- FIN REGISTRO DE ACTIVIDAD ---
        return Response({"success": True})

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

            # Si el correo ya existe, no hacemos nada (usuarios existentes no se tocan)
            usuarios_collection = get_collection(Usuario)
            existing_user = usuarios_collection.find_one({"Email": data.get("Email")})
            if existing_user:
                return Response({"message": "Usuario ya existente"}, status=status.HTTP_200_OK)

            # Generar código de verificación de 6 dígitos y guardar solicitud temporal
            import random
            codigo = f"{random.randint(0, 999999):06d}"

            verificaciones = get_collection(VerificacionRegistro)
            # upsert por email
            verificaciones.update_one(
                {"Email": data.get("Email")},
                {"$set": {
                    "solicitud": data,
                    "codigo": codigo,
                    "intentos": 0,
                    "creado_en": datetime.now(),
                    "expira_en": datetime.now() + timedelta(minutes=15)
                }},
                upsert=True
            )

            # Enviar correo con el código
            try:
                asunto = "Código de verificación"
                mensaje = f"Tu código de verificación es: {codigo}. Vence en 15 minutos."
                send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [data.get("Email")])
            except Exception as e:
                logger.error(f"Error enviando correo de verificación: {str(e)}")

            # --- REGISTRO DE AUDITORÍA ---
            try:
                # El usuario que realiza el registro puede venir en el header (X-User-Email), si no, usar el email registrado
                actor_email = request.headers.get('X-User-Email') or data.get('Email')
                registrar_actividad(
                    actor_email,
                    'registro_usuario_solicitado',
                    'Usuarios',
                    {
                        'nombre': data.get('Nombre'),
                        'email': data.get('Email'),
                        'cargo': data.get('Cargo'),
                        'unidad': data.get('Unidad')
                    }
                )
            except Exception as e:
                logger.error(f"Error al registrar actividad de registro de usuario: {str(e)}")
            # --- FIN REGISTRO DE AUDITORÍA ---

            return Response({"message": "Código enviado al correo"}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error al registrar: {str(e)}")
            return Response(
                {"error": f"Error al registrar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerificarCodigoRegistroView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = VerificarCodigoSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            email = serializer.validated_data['Email']
            codigo = serializer.validated_data['codigo']

            verificaciones = get_collection(VerificacionRegistro)
            solicitud = verificaciones.find_one({"Email": email})
            if not solicitud:
                return Response({"error": "No hay una solicitud de registro para este correo"}, status=status.HTTP_404_NOT_FOUND)

            if solicitud.get('expira_en') and datetime.now() > solicitud['expira_en']:
                return Response({"error": "El código ha expirado"}, status=status.HTTP_400_BAD_REQUEST)

            if solicitud.get('codigo') != codigo:
                verificaciones.update_one({"Email": email}, {"$inc": {"intentos": 1}})
                return Response({"error": "Código incorrecto"}, status=status.HTTP_400_BAD_REQUEST)

            # Crear usuario definitivo
            usuarios = get_collection(Usuario)
            registro = solicitud.get('solicitud', {})
            if not registro:
                return Response({"error": "Datos de registro no encontrados"}, status=status.HTTP_400_BAD_REQUEST)

            usuarios.insert_one(registro)
            verificaciones.delete_one({"Email": email})

            try:
                registrar_actividad(email, 'registro_usuario_verificado', 'Usuarios', { 'email': email })
            except Exception:
                pass

            return Response({"message": "Registro verificado y creado"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al verificar código: {str(e)}")
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReenviarCodigoRegistroView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = ReenviarCodigoSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            email = serializer.validated_data['Email']
            verificaciones = get_collection(VerificacionRegistro)
            solicitud = verificaciones.find_one({"Email": email})
            if not solicitud:
                return Response({"error": "No hay una solicitud de registro para este correo"}, status=status.HTTP_404_NOT_FOUND)

            import random
            codigo = f"{random.randint(0, 999999):06d}"
            verificaciones.update_one(
                {"Email": email},
                {"$set": {"codigo": codigo, "expira_en": datetime.now() + timedelta(minutes=15), "intentos": 0}}
            )
            try:
                asunto = "Nuevo código de verificación"
                mensaje = f"Tu nuevo código es: {codigo}. Vence en 15 minutos."
                send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception as e:
                logger.error(f"Error reenviando correo: {str(e)}")
            return Response({"message": "Código reenviado"})
        except Exception as e:
            logger.error(f"Error en reenvío de código: {str(e)}")
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def registrar_actividad(email, accion, modulo, mensaje, detalle=None, fecha_login=None, fecha_logout=None):
    collection = get_collection(Seguimiento)
    doc = {
        'usuario_email': email,
        'accion': accion,
        'modulo': modulo,
        'mensaje': mensaje,
        'detalle': detalle or '',
        'fecha_hora': datetime.now()
    }
    
    # Agregar fechas de login/logout si están disponibles
    if fecha_login:
        doc['fecha_login'] = fecha_login
    if fecha_logout:
        doc['fecha_logout'] = fecha_logout
    
    collection.insert_one(doc)

class LoginView(APIView):
    serializer_class = LoginSerializer  

    def post(self, request):
        try:
            # Crear usuario admin por defecto si no existe
            create_default_admin()
            
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
            # Comentado temporalmente para debugging
            # if user.get("Permiso", "Editor").lower() == "denegado":
            #     return Response({"error": "Acceso denegado por el administrador"}, status=status.HTTP_403_FORBIDDEN)
            
            # Registrar actividad de login con fecha de login
            fecha_login = datetime.now()
            registrar_actividad(
                user["Email"], 
                "login", 
                "Autenticación", 
                                "Inicio de Sesión Exitoso",
                "Inicio de Sesión Exitoso",
                fecha_login=fecha_login
            )
            
            return Response(json.loads(json_util.dumps(serialize_doc(user))), status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error interno en LoginView: {str(e)}")
            return Response(
                {"error": f"Error al iniciar sesión: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LogoutView(APIView):
    def post(self, request):
        try:
            email = request.headers.get('X-User-Email')
            if not email:
                return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Buscar el último login del usuario para actualizarlo con la fecha de logout
            seguimiento_collection = get_collection(Seguimiento)
            ultimo_login = seguimiento_collection.find_one(
                {"usuario_email": email, "accion": "login"},
                sort=[("fecha_hora", -1)]
            )
            
            fecha_logout = datetime.now()
            
            # Registrar actividad de logout
            registrar_actividad(
                email, 
                "logout", 
                "Autenticación", 
                "Cierre de Sesión Exitoso", 
                "Cierre de Sesión Exitoso",
                fecha_logout=fecha_logout
            )
            
            # Si encontramos el último login, actualizar su fecha de logout
            if ultimo_login:
                seguimiento_collection.update_one(
                    {"_id": ultimo_login["_id"]},
                    {"$set": {"fecha_logout": fecha_logout}}
                )
            
            return Response({"message": "Logout exitoso"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error interno en LogoutView: {str(e)}")
            return Response(
                {"error": f"Error al cerrar sesión: {str(e)}"},
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

def enviar_correo_a_todos_usuarios_html(maquinaria, pronostico):
    usuarios = get_collection(Usuario).find({})
    emails = [u.get('Email') for u in usuarios if u.get('Email')]
    if not emails:
        return
    placa = maquinaria.get('placa', pronostico.get('placa', 'Sin placa'))
    fecha_asig = pronostico.get('fecha_asig', maquinaria.get('fecha_asig', maquinaria.get('fecha_asignacion', 'N/A')))
    horas_op = pronostico.get('horas_op', maquinaria.get('horas_op', 'N/A'))
    recorrido = pronostico.get('recorrido', maquinaria.get('recorrido', 'N/A'))
    tipo = pronostico.get('resultado', 'N/A')
    riesgo = pronostico.get('riesgo', 'N/A')
    probabilidad = pronostico.get('probabilidad', 'N/A')
    fecha_prediccion = pronostico.get('fecha_prediccion', 'N/A')
    urgencia = pronostico.get('urgencia', 'N/A')
    # Fechas futuras como lista
    fechas_futuras = pronostico.get('fechas_futuras', [])
    if isinstance(fechas_futuras, str):
        try:
            fechas_futuras = ast.literal_eval(fechas_futuras)
        except Exception:
            fechas_futuras = []
    if not isinstance(fechas_futuras, list):
        fechas_futuras = [fechas_futuras]
    # Si fechas_futuras está vacío, intenta generarlas a partir de fecha_asig
    if (not fechas_futuras or all(not f for f in fechas_futuras)) and fecha_asig and fecha_asig != 'N/A':
        try:
            if isinstance(fecha_asig, str):
                base_date = datetime.strptime(fecha_asig[:10], "%Y-%m-%d")
            else:
                base_date = fecha_asig
            saltos = [4, 6, 12, 24]
            fechas_futuras = [
                (base_date + relativedelta(months=+salto)).strftime("%Y-%m-%d")
                for salto in saltos
            ]
        except Exception as e:
            fechas_futuras = []
    # Recomendaciones como lista
    recomendaciones = pronostico.get('recomendaciones', [])
    if isinstance(recomendaciones, str):
        try:
            recomendaciones = ast.literal_eval(recomendaciones)
        except Exception:
            recomendaciones = [recomendaciones]
    if not isinstance(recomendaciones, list):
        recomendaciones = [recomendaciones]
    # Formatear fecha de predicción
    if fecha_prediccion and 'T' in str(fecha_prediccion):
        fecha_prediccion = str(fecha_prediccion).replace('T', ' ').split('.')[0]
    html_content = f"""
    <h2>Alerta de Mantenimiento</h2>
    <table style='border-collapse:collapse;'>
      <tr><td><b>Fecha del Mantenimiento:</b></td><td>{fecha_asig}</td></tr>
      <tr><td><b>Placa:</b></td><td>{placa}</td></tr>
      <tr><td><b>Horas de Operación:</b></td><td>{horas_op}</td></tr>
      <tr><td><b>Recorrido:</b></td><td>{recorrido}</td></tr>
      <tr><td><b>Tipo de Mantenimiento:</b></td><td>{tipo}</td></tr>
      <tr><td><b>Riesgo:</b></td><td style='color:red;'><b>{riesgo}</b></td></tr>
      <tr><td><b>Probabilidad:</b></td><td>{probabilidad}</td></tr>
      <tr><td><b>Nivel de Urgencia:</b></td><td>{urgencia}</td></tr>
      <tr><td><b>Recomendaciones:</b></td>
        <td>
          <ul>
            {''.join(f'<li>{r}</li>' for r in recomendaciones if r)}
          </ul>
        </td>
      </tr>
    </table>
    """
    subject = f"Pronóstico de mantenimiento para {placa}"
    msg = EmailMultiAlternatives(subject, '', 'noreply@tusistema.com', emails)
    msg.attach_alternative(html_content, "text/html")
    msg.send()

class PronosticoAPIView(APIView):
    def post(self, request):
        serializer = PronosticoInputSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            import sys, os
            pronostico_dir = os.path.join(os.path.dirname(__file__), '../pronostico-v1')
            if pronostico_dir not in sys.path:
                sys.path.insert(0, pronostico_dir)
            from pronostico_model import predecir_mantenimiento
            resultado_dict = predecir_mantenimiento(data)
            data['resultado'] = resultado_dict.get('resultado')
            data['recomendaciones'] = resultado_dict.get('recomendaciones')
            data['riesgo'] = resultado_dict.get('riesgo')
            data['probabilidad'] = resultado_dict.get('probabilidad')
            data['fecha_prediccion'] = resultado_dict.get('fecha_prediccion')
            data['fecha_sugerida'] = resultado_dict.get('fecha_sugerida')
            data['fecha_mantenimiento'] = resultado_dict.get('fecha_mantenimiento')
            data['fecha_recordatorio'] = resultado_dict.get('fecha_recordatorio')
            data['dias_hasta_mantenimiento'] = resultado_dict.get('dias_hasta_mantenimiento')
            data['urgencia'] = resultado_dict.get('urgencia')
            placa = data.get('placa')
            fecha_asig = data.get('fecha_asig')
            if isinstance(fecha_asig, (datetime, date)):
                fecha_asig = fecha_asig.strftime('%Y-%m-%d')
            data['fecha_asig'] = fecha_asig
            collection = get_collection(Pronostico)
            data = convert_dates_to_str(data)
            existing = collection.find_one({'placa': placa, 'fecha_asig': fecha_asig})
            maquinaria_collection = get_collection(Maquinaria)
            maquinaria_doc = maquinaria_collection.find_one({'placa': placa}) or {}
            if existing:
                collection.update_one({'_id': existing['_id']}, {'$set': data})
                updated = collection.find_one({'_id': existing['_id']})
                enviar_correo_a_todos_usuarios_html(maquinaria_doc, data)
                return Response(serialize_doc(updated), status=status.HTTP_200_OK)
            else:
                result = collection.insert_one(data)
                new_doc = collection.find_one({'_id': result.inserted_id})
                enviar_correo_a_todos_usuarios_html(maquinaria_doc, data)
                return Response(serialize_doc(new_doc), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        # Devolver todos los pronósticos sin paginación
        cursor = Pronostico().collection.find({'activo': {'$ne': False}}, {
            "_id": 1, "placa": 1, "fecha_asig": 1, "horas_op": 1, "recorrido": 1, "resultado": 1, "creado_en": 1, "recomendaciones": 1,
            "riesgo": 1, "probabilidad": 1, "fecha_sugerida": 1, "fecha_mantenimiento": 1, "fecha_recordatorio": 1, "dias_hasta_mantenimiento": 1, "urgencia": 1
        })
        registros = list(cursor)
        registros_serializados = [serialize_doc(r) for r in registros]
        return Response(registros_serializados, status=status.HTTP_200_OK)

class PronosticoExcelUploadView(APIView):
    def post(self, request):
        try:
            # Verificar si se envió un archivo
            if 'excel_file' not in request.FILES:
                return Response(
                    {'error': 'No se proporcionó ningún archivo Excel'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            excel_file = request.FILES['excel_file']
            
            # Verificar que sea un archivo Excel
            if not (excel_file.name.endswith('.xlsx') or excel_file.name.endswith('.xls')):
                return Response(
                    {'error': 'El archivo debe ser un Excel válido (.xlsx o .xls)'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Leer el archivo Excel
            import pandas as pd
            from datetime import datetime, date
            
            try:
                excel_file.seek(0)  # Reset file pointer
                df = pd.read_excel(excel_file)
                print(f"✅ Archivo Excel leído correctamente")
            except Exception as e:
                print(f"❌ Error leyendo archivo Excel: {str(e)}")
                return Response(
                    {'error': f'No se pudo leer el archivo Excel: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar las columnas requeridas con mejor debug
            required_columns = ['placa', 'fecha_asig', 'horas_op', 'recorrido']
            
            # Debug: mostrar las columnas que pandas detectó
            print(f"🔍 Columnas detectadas en el Excel: {list(df.columns)}")
            print(f"🔍 Tipos de columnas: {df.dtypes.to_dict()}")
            
            # Normalizar nombres de columnas (eliminar espacios, convertir a minúsculas)
            import re
            df.columns = df.columns.str.strip().str.lower()
            # Eliminar espacios múltiples y caracteres especiales
            df.columns = df.columns.str.replace(r'\s+', '', regex=True)
            print(f"🔍 Columnas normalizadas: {list(df.columns)}")
            
            # Debug adicional: mostrar cada columna individualmente
            print("🔍 Análisis detallado de columnas:")
            for i, col in enumerate(df.columns):
                print(f"   Columna {i+1}: '{col}' (longitud: {len(col)})")
            
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response({
                    'error': f'Columnas faltantes en el Excel: {", ".join(missing_columns)}',
                    'debug_info': {
                        'columnas_detectadas': list(df.columns),
                        'columnas_requeridas': required_columns,
                        'columnas_faltantes': missing_columns
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Importar el modelo de pronóstico
            import sys, os
            pronostico_dir = os.path.join(os.path.dirname(__file__), '../pronostico-v1')
            if pronostico_dir not in sys.path:
                sys.path.insert(0, pronostico_dir)
            from pronostico_model import predecir_mantenimiento
            
            # Procesar cada fila del CSV
            collection = get_collection(Pronostico)
            maquinaria_collection = get_collection(Maquinaria)
            
            resultados = []
            exitosos = 0
            errores = 0
            
            for index, row in df.iterrows():
                try:
                    # Preparar datos para el pronóstico
                    fecha_asig_raw = row['fecha_asig']
                    
                    # Procesar fecha de asignación para asegurar formato YYYY-MM-DD
                    if isinstance(fecha_asig_raw, (datetime, date)):
                        fecha_asig = fecha_asig_raw.strftime('%Y-%m-%d')
                    elif isinstance(fecha_asig_raw, str):
                        # Si es string, intentar parsear y formatear
                        try:
                            # Intentar diferentes formatos de fecha
                            for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y', '%m/%d/%Y']:
                                try:
                                    parsed_date = datetime.strptime(fecha_asig_raw, fmt)
                                    fecha_asig = parsed_date.strftime('%Y-%m-%d')
                                    break
                                except ValueError:
                                    continue
                            else:
                                fecha_asig = str(fecha_asig_raw).strip()
                        except:
                            fecha_asig = str(fecha_asig_raw).strip()
                    else:
                        fecha_asig = str(fecha_asig_raw).strip()
                    
                    datos = {
                        'placa': str(row['placa']).strip(),
                        'fecha_asig': fecha_asig,
                        'horas_op': float(row['horas_op']),
                        'recorrido': float(row['recorrido'])
                    }
                    
                    # Generar pronóstico
                    resultado_dict = predecir_mantenimiento(datos)
                    
                    # Preparar datos para guardar
                    data = datos.copy()
                    data['resultado'] = resultado_dict.get('resultado')
                    data['recomendaciones'] = resultado_dict.get('recomendaciones')
                    data['riesgo'] = resultado_dict.get('riesgo')
                    data['probabilidad'] = resultado_dict.get('probabilidad')
                    data['fecha_prediccion'] = resultado_dict.get('fecha_prediccion')
                    data['fecha_sugerida'] = resultado_dict.get('fecha_sugerida')
                    data['fecha_mantenimiento'] = resultado_dict.get('fecha_mantenimiento')
                    data['fecha_recordatorio'] = resultado_dict.get('fecha_recordatorio')
                    data['dias_hasta_mantenimiento'] = resultado_dict.get('dias_hasta_mantenimiento')
                    data['urgencia'] = resultado_dict.get('urgencia')
                    
                    # Formatear fecha de asignación para asegurar formato YYYY-MM-DD
                    fecha_asig = data.get('fecha_asig')
                    if isinstance(fecha_asig, (datetime, date)):
                        fecha_asig = fecha_asig.strftime('%Y-%m-%d')
                    elif isinstance(fecha_asig, str):
                        # Si es string, intentar parsear y formatear
                        try:
                            # Intentar diferentes formatos de fecha
                            for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y', '%m/%d/%Y']:
                                try:
                                    parsed_date = datetime.strptime(fecha_asig, fmt)
                                    fecha_asig = parsed_date.strftime('%Y-%m-%d')
                                    break
                                except ValueError:
                                    continue
                        except:
                            # Si no se puede parsear, mantener como está
                            pass
                    data['fecha_asig'] = fecha_asig
                    
                    # Convertir fechas a string
                    data = convert_dates_to_str(data)
                    
                    # Verificar si ya existe un pronóstico para esta placa y fecha
                    existing = collection.find_one({'placa': data['placa'], 'fecha_asig': data['fecha_asig']})
                    
                    # Obtener información de la maquinaria
                    maquinaria_doc = maquinaria_collection.find_one({'placa': data['placa']}) or {}
                    
                    if existing:
                        # Actualizar pronóstico existente
                        collection.update_one({'_id': existing['_id']}, {'$set': data})
                        updated = collection.find_one({'_id': existing['_id']})
                        enviar_correo_a_todos_usuarios_html(maquinaria_doc, data)
                        resultados.append({
                            'fila': index + 1,
                            'placa': data['placa'],
                            'estado': 'actualizado',
                            'resultado': data['resultado']
                        })
                    else:
                        # Crear nuevo pronóstico
                        result = collection.insert_one(data)
                        new_doc = collection.find_one({'_id': result.inserted_id})
                        enviar_correo_a_todos_usuarios_html(maquinaria_doc, data)
                        resultados.append({
                            'fila': index + 1,
                            'placa': data['placa'],
                            'estado': 'creado',
                            'resultado': data['resultado']
                        })
                    
                    exitosos += 1
                    
                except Exception as e:
                    errores += 1
                    resultados.append({
                        'fila': index + 1,
                        'placa': str(row.get('placa', 'N/A')),
                        'estado': 'error',
                        'error': str(e)
                    })
            
            return Response({
                'mensaje': f'Procesamiento completado. {exitosos} pronósticos procesados exitosamente, {errores} errores.',
                'resumen': {
                    'total_filas': len(df),
                    'exitosos': exitosos,
                    'errores': errores
                },
                'resultados': resultados
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error en PronosticoCSVUploadView: {str(e)}")
            return Response(
                {'error': f'Error al procesar el archivo CSV: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PronosticoSummaryView(APIView):
    def get(self, request):
        try:
            pronostico_collection = get_collection(Pronostico)
            pipeline = [
                {
                    "$match": {"activo": {"$ne": False}}
                },
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
        maquinarias = list(maquinaria_collection.find({
            "$or": [
                {"activo": True},
                {"activo": {"$exists": False}}
            ]
        }))
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
    """Solo el admin puede ver la lista de usuarios."""
    def get(self, request):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not check_user_permissions(user, required_role='admin'):
            return Response({'error': 'Solo el administrador puede ver la lista de usuarios'}, status=status.HTTP_403_FORBIDDEN)
        # Solo mostrar usuarios activos
        usuarios = list(collection.find({
            "$or": [
                {"activo": True},
                {"activo": {"$exists": False}}
            ]
        }, {"_id": 1, "Email": 1, "Cargo": 1, "Permiso": 1, "Nombre": 1, "Unidad": 1, "permisos": 1}))
        return Response([serialize_doc(u) for u in usuarios], status=status.HTTP_200_OK)

class UsuarioCargoUpdateView(APIView):
    """Solo el admin puede cambiar el cargo de otros usuarios."""
    def put(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not check_user_permissions(user, required_role='admin'):
            return Response({'error': 'Solo el administrador puede cambiar roles'}, status=status.HTTP_403_FORBIDDEN)
        # No puede cambiarse a sí mismo
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes cambiar tu propio cargo'}, status=status.HTTP_400_BAD_REQUEST)
        nuevo_cargo = request.data.get('Cargo')
        if not nuevo_cargo:
            return Response({'error': 'Cargo requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el cargo sea válido (aceptar con y sin acento, mayúsculas/minúsculas)
        cargos_validos = ['admin', 'encargado', 'tecnico', 'técnico']
        if nuevo_cargo.lower() not in cargos_validos:
            return Response({'error': 'Cargo inválido. Debe ser: admin, encargado o tecnico'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = collection.update_one({'_id': ObjectId(id)}, {'$set': {'Cargo': nuevo_cargo}})
        if result.matched_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        usuario_actualizado = collection.find_one({'_id': ObjectId(id)})
        return Response(serialize_doc(usuario_actualizado), status=status.HTTP_200_OK)

class UsuarioPermisoUpdateView(APIView):
    """Solo el admin puede cambiar el permiso de otros usuarios."""
    def put(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not check_user_permissions(user, required_role='admin'):
            return Response({'error': 'Solo el administrador puede cambiar permisos'}, status=status.HTTP_403_FORBIDDEN)
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
    """Solo el admin puede desactivar usuarios (no a sí mismo)."""
    def delete(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not check_user_permissions(user, required_role='admin'):
            return Response({'error': 'Solo el administrador puede gestionar usuarios'}, status=status.HTTP_403_FORBIDDEN)
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes operar sobre tu propio usuario'}, status=status.HTTP_400_BAD_REQUEST)

        permanent = str(request.query_params.get('permanent', 'false')).lower() in ['1', 'true', 'yes']
        if permanent:
            # Eliminación permanente
            target = collection.find_one({'_id': ObjectId(id)})
            if not target:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
            collection.delete_one({'_id': ObjectId(id)})
            try:
                registrar_actividad(
                    email,
                    'eliminar_permanente_usuario',
                    'Usuarios',
                    f"Eliminó permanentemente al usuario {target.get('Email', id)}",
                    {'datos': serialize_doc(target)}
                )
            except Exception:
                pass
            return Response({'success': True}, status=status.HTTP_200_OK)

        # Soft delete por defecto
        try:
            data = request.data
            justificacion = data.get('justificacion', 'Sin justificación')
            desactivado_por = data.get('desactivado_por', email)
        except:
            justificacion = 'Sin justificación'
            desactivado_por = email

        result = collection.update_one(
            {'_id': ObjectId(id)},
            {"$set": {
                "activo": False,
                "fecha_desactivacion": datetime.now(),
                "justificacion": justificacion,
                "desactivado_por": desactivado_por
            }}
        )
        if result.modified_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True}, status=status.HTTP_200_OK)

    def patch(self, request, id):
        """Reactivar un usuario desactivado"""
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({'error': 'Solo el administrador puede reactivar usuarios'}, status=status.HTTP_403_FORBIDDEN)
        
        # Reactivar el usuario
        result = collection.update_one(
            {'_id': ObjectId(id)},
            {"$set": {"activo": True, "fecha_reactivacion": datetime.now()}}
        )
        if result.modified_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True}, status=status.HTTP_200_OK)

class RegistrosDesactivadosView(APIView):
    """Vista para obtener registros desactivados"""
    def get(self, request, maquinaria_id):
        # Verificar permisos de ADMINISTRADOR únicamente
        actor_email = request.headers.get('X-User-Email')
        if not actor_email:
            return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_collection(Usuario).find_one({"Email": actor_email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({"error": "Solo los administradores pueden ver registros desactivados"}, status=status.HTTP_403_FORBIDDEN)
        
        if not ObjectId.is_valid(maquinaria_id):
            return Response({"error": "ID de maquinaria inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener todos los registros desactivados de todas las colecciones
        collections = [
            ('controles', 'Control'),
            ('asignacion', 'Asignación'),
            ('mantenimientos', 'Mantenimiento'),
            ('seguros', 'Seguro'),
            ('itv', 'ITV'),
            ('soat', 'SOAT'),
            ('impuesto', 'Impuesto')
        ]
        
        registros_desactivados = {}
        
        for collection_name, label in collections:
            collection = get_collection(collection_name)
            registros = list(collection.find({
                'maquinaria': ObjectId(maquinaria_id),
                'activo': False
            }))
            if registros:
                registros_desactivados[label] = serialize_list(registros)
        
        return Response(registros_desactivados)

class TodosRegistrosDesactivadosView(APIView):
    """Vista para obtener todos los registros desactivados del sistema"""
    def get(self, request):
        # Verificar permisos de ADMINISTRADOR únicamente
        actor_email = request.headers.get('X-User-Email')
        if not actor_email:
            return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_collection(Usuario).find_one({"Email": actor_email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({"error": "Solo los administradores pueden ver registros desactivados"}, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener parámetros de consulta
        dias = request.GET.get('dias', '30')  # Por defecto 30 días
        try:
            dias = int(dias)
        except ValueError:
            dias = 30
        
        # Obtener todos los registros desactivados de todas las colecciones
        collections = [
            ('usuarios', 'Usuario'),
            ('controles', 'Control'),
            ('asignacion', 'Asignación'),
            ('mantenimientos', 'Mantenimiento'),
            ('seguros', 'Seguro'),
            ('itv', 'ITV'),
            ('soat', 'SOAT'),
            ('impuesto', 'Impuesto'),
            ('maquinaria', 'Maquinaria'),
            ('depreciaciones', 'Depreciación')
        ]
        
        registros_desactivados = {}
        
        try:
            # Calcular fecha límite
            from datetime import datetime, timedelta
            fecha_limite = datetime.now() - timedelta(days=dias)
            print(f"Buscando registros desactivados de los últimos {dias} días")
            
            for collection_name, label in collections:
                collection = get_collection(collection_name)
                print(f"Buscando en colección: {collection_name}")
                
                # Manejo especial para usuarios
                if collection_name == 'usuarios':
                    # Para usuarios, buscar todos los desactivados sin filtro de fecha
                    query = {'activo': False}
                    
                    # Buscar directamente sin distinct para evitar problemas
                    registros = list(collection.find(query))
                    print(f"Encontrados {len(registros)} usuarios desactivados en {collection_name}")
                    
                    if registros:
                        # ELIMINAR DUPLICADOS POR EMAIL
                        # Crear un diccionario para mantener solo un registro por email
                        usuarios_unicos = {}
                        for record in registros:
                            email = record.get('Email')
                            if email:
                                # Si ya existe un usuario con este email, mantener el más reciente
                                if email not in usuarios_unicos:
                                    usuarios_unicos[email] = record
                                else:
                                    # Si ya existe, comparar fechas y mantener el más reciente
                                    fecha_existente = usuarios_unicos[email].get('fecha_desactivacion')
                                    fecha_nuevo = record.get('fecha_desactivacion')
                                    if fecha_nuevo and (not fecha_existente or fecha_nuevo > fecha_existente):
                                        usuarios_unicos[email] = record
                        
                        # Convertir de vuelta a lista
                        registros = list(usuarios_unicos.values())
                        print(f"Después de eliminar duplicados: {len(registros)} usuarios únicos")
                        
                        # Serializar usuarios desactivados
                        def serialize_usuario_desactivado(doc):
                            if not doc:
                                return None
                            from bson import ObjectId
                            from datetime import datetime, date
                            def convert(value):
                                if isinstance(value, ObjectId):
                                    return str(value)
                                elif isinstance(value, (datetime, date)):
                                    if isinstance(value, datetime):
                                        if value.hour == 0 and value.minute == 0 and value.second == 0:
                                            return value.strftime('%d/%m/%Y')
                                        else:
                                            return value.strftime('%d/%m/%Y %H:%M:%S')
                                    else:
                                        return value.strftime('%d/%m/%Y')
                                elif isinstance(value, dict):
                                    return {k: convert(v) for k, v in value.items()}
                                elif isinstance(value, list):
                                    return [convert(v) for v in value]
                                else:
                                    return value
                            
                            doc = convert(doc)
                            
                            # Quitar la contraseña si existe
                            if 'Password' in doc:
                                del doc['Password']
                            
                            # Quitar campos que no queremos mostrar
                            campos_a_quitar = ['activo']
                            for campo in campos_a_quitar:
                                if campo in doc:
                                    del doc[campo]
                            
                            # Mapear campos específicos de usuarios
                            mapeo_campos_usuario = {
                                'fecha_desactivacion': 'Fecha de Desactivación',
                                'fecha_creacion': 'Fecha de Creación',
                                'fecha_registro': 'Fecha de Registro'
                            }
                            
                            # Aplicar mapeo de campos para usuarios
                            for campo_original, campo_nuevo in mapeo_campos_usuario.items():
                                if campo_original in doc:
                                    doc[campo_nuevo] = doc.pop(campo_original)
                            
                            return doc
                        
                        registros_desactivados[label] = [serialize_usuario_desactivado(record) for record in registros]
                        print(f"Agregados {len(registros)} usuarios únicos de {label}")
                else:
                    # Para otras colecciones, buscar registros desactivados recientes primero
                    query = {
                        'activo': False,
                        '$or': [
                            {'fecha_desactivacion': {'$gte': fecha_limite}},
                            {'fecha_creacion': {'$gte': fecha_limite}},
                            {'fecha_registro': {'$gte': fecha_limite}}
                        ]
                    }
                    
                    # Buscar registros recientes
                    registros = list(collection.find(query))
                    print(f"Encontrados {len(registros)} registros desactivados recientes en {collection_name}")
                    
                    # Si no hay registros recientes, buscar solo los desactivados (sin filtro de fecha)
                    if not registros:
                        query_simple = {'activo': False}
                        registros = list(collection.find(query_simple))
                        print(f"Encontrados {len(registros)} registros desactivados totales en {collection_name}")
                
                    if registros:
                        # Serializar registros desactivados
                        def serialize_desactivados(doc):
                            if not doc:
                                return None
                            from bson import ObjectId
                            from datetime import datetime, date
                            def convert(value):
                                if isinstance(value, ObjectId):
                                    return str(value)
                                elif isinstance(value, (datetime, date)):
                                    if isinstance(value, datetime):
                                        if value.hour == 0 and value.minute == 0 and value.second == 0:
                                            return value.strftime('%d/%m/%Y')
                                        else:
                                            return value.strftime('%d/%m/%Y %H:%M:%S')
                                    else:
                                        return value.strftime('%d/%m/%Y')
                                elif isinstance(value, dict):
                                    return {k: convert(v) for k, v in value.items()}
                                elif isinstance(value, list):
                                    return [convert(v) for v in value]
                                else:
                                    return value
                            
                            doc = convert(doc)
                            
                            # Quitar la contraseña si existe
                            if 'Password' in doc:
                                del doc['Password']
                            
                            # Quitar campos que no queremos mostrar (pero mantener _id y maquinaria_id para reactivación)
                            campos_a_quitar = ['activo']
                            for campo in campos_a_quitar:
                                if campo in doc:
                                    del doc[campo]
                            
                            # Convertir maquinaria a maquinaria_id si existe y mantener maquinaria para referencia
                            if 'maquinaria' in doc:
                                doc['maquinaria_id'] = str(doc['maquinaria'])
                                # Mantener maquinaria para referencia en el frontend
                            
                            # --- Asegurar maquinaria_id como string si existe ---
                            if 'maquinaria_id' in doc:
                                # Obtener la placa de la maquinaria en lugar del ID
                                try:
                                    maquinaria_collection = get_collection('maquinaria')
                                    maquinaria = maquinaria_collection.find_one({"_id": ObjectId(doc['maquinaria_id'])})
                                    if maquinaria:
                                        doc['Maquinaria'] = maquinaria.get('placa', 'Sin placa')
                                    else:
                                        doc['Maquinaria'] = 'Maquinaria no encontrada'
                                except:
                                    doc['Maquinaria'] = 'Error al obtener maquinaria'
                                # NO eliminar maquinaria_id, lo necesitamos para reactivación
                            
                            # Mejorar nombres de campos para mejor legibilidad
                            mapeo_campos = {
                                'fecha_desactivacion': 'Fecha de Desactivación',
                                'fecha_reactivacion': 'Fecha de Reactivación',
                                'fecha_creacion': 'Fecha de Creación',
                                'fecha_registro': 'Fecha de Registro',
                                'fecha_asignacion': 'Fecha de Asignación',
                                'fecha_liberacion': 'Fecha de Liberación',
                                'fecha_ingreso': 'Fecha de Ingreso',
                                'detalle': 'Detalle',
                                'estado': 'Estado',
                                'observacion': 'Observación',
                                'costo': 'Costo',
                                'tipo': 'Tipo',
                                'cantidad': 'Cantidad',
                                'ubicacion': 'Ubicación',
                                'encargado': 'Encargado',
                                'gerente': 'Gerente',
                                'hoja_tramite': 'Hoja de Trámite',
                                'numero_2024': 'N° 2024',
                                'importe': 'Importe',
                                'importe_2023': 'Importe 2023',
                                'importe_2024': 'Importe 2024',
                                'importe_2025': 'Importe 2025',
                                'bien_uso': 'Bien de Uso',
                                'vida_util': 'Vida Útil',
                                'metodo': 'Método',
                                'recorrido_km': 'Recorrido (Km)',
                                'recorrido_entregado': 'Recorrido Entregado'
                            }
                            
                            # Aplicar mapeo de campos
                            for campo_original, campo_nuevo in mapeo_campos.items():
                                if campo_original in doc:
                                    doc[campo_nuevo] = doc.pop(campo_original)
                            
                            return doc
                        
                        registros_desactivados[label] = [serialize_desactivados(record) for record in registros]
                        print(f"Agregados {len(registros)} registros de {label}")
                
                print(f"Total de colecciones con registros: {len(registros_desactivados)}")
            
            return Response(registros_desactivados)
            
        except Exception as e:
            print(f"Error en TodosRegistrosDesactivadosView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

class UsuarioPermisosUpdateView(APIView):
    """Solo el admin puede cambiar los permisos granulares de otros usuarios."""
    def put(self, request, id):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not check_user_permissions(user, required_role='admin'):
            return Response({'error': 'Solo el administrador puede gestionar permisos'}, status=status.HTTP_403_FORBIDDEN)
        if str(user.get('_id')) == id:
            return Response({'error': 'No puedes cambiar tus propios permisos'}, status=status.HTTP_400_BAD_REQUEST)
        nuevos_permisos = request.data.get('permisos')
        if not isinstance(nuevos_permisos, dict):
            return Response({'error': 'Permisos inválidos'}, status=status.HTTP_400_BAD_REQUEST)
        result = collection.update_one({'_id': ObjectId(id)}, {'$set': {'permisos': nuevos_permisos}})
        if result.matched_count == 0:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        usuario_actualizado = collection.find_one({'_id': ObjectId(id)})
        # Registrar auditoría de cambio de permisos
        try:
            detalle = {
                'usuario_afectado_email': usuario_actualizado.get('Email'),
                'usuario_afectado_nombre': usuario_actualizado.get('Nombre'),
                'usuario_afectado_cargo': usuario_actualizado.get('Cargo'),
                'usuario_afectado_unidad': usuario_actualizado.get('Unidad'),
            }
            registrar_actividad(email, "cambio_permisos", "Usuarios", detalle)
        except Exception as e:
            logger.error(f"Error al registrar actividad de cambio de permisos: {str(e)}")
        return Response(serialize_doc(usuario_actualizado), status=status.HTTP_200_OK)

class SeguimientoListView(APIView):
    """Solo admin o encargado puede ver el registro de actividad."""
    def get(self, request):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        cargo = user.get('Cargo', '').lower() if user else ''
        if cargo not in ['admin', 'encargado']:
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        seguimiento_col = get_collection(Seguimiento)
        registros = list(seguimiento_col.find({}, {'_id': 0}).sort('fecha_hora', -1))
        return Response(registros, status=status.HTTP_200_OK)

class UsuarioUpdateView(APIView):
    def put(self, request):
        email = request.headers.get('X-User-Email')
        if not email:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        collection = get_collection(Usuario)
        user = collection.find_one({"Email": email})
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        update_fields = {}
        # Solo permitir actualizar ciertos campos
        for field in ["Nombre", "Unidad", "Email", "Cargo", "imagen", "CI"]:
            if field in data:
                if field == "imagen" and (data[field] == '' or data[field] is None):
                    # Eliminar el campo imagen si llega vacío
                    update_fields["imagen"] = None  # Marcador para eliminar luego
                elif data[field]:
                    update_fields[field] = data[field]
        # Cambio de contraseña
        if "Password" in data and data["Password"]:
            import bcrypt
            hashed = bcrypt.hashpw(data["Password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            update_fields["Password"] = hashed
        if not update_fields:
            return Response({'error': 'No hay datos para actualizar'}, status=status.HTTP_400_BAD_REQUEST)
        # Eliminar campo imagen si corresponde
        if "imagen" in update_fields and update_fields["imagen"] is None:
            collection.update_one({'_id': user['_id']}, {'$unset': {'imagen': ""}})
            update_fields.pop("imagen")
        if update_fields:
            result = collection.update_one({'_id': user['_id']}, {'$set': update_fields})
            if result.matched_count == 0:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        usuario_actualizado = collection.find_one({'_id': user['_id']})
        # Registrar actividad
        try:
            registrar_actividad(email, "editar_perfil", "Usuarios", f"Actualizó sus datos de perfil", {k: update_fields[k] for k in update_fields if k != 'Password'})
        except Exception as e:
            logger.error(f"Error al registrar actividad de edición de perfil: {str(e)}")
        return Response(serialize_doc(usuario_actualizado), status=status.HTTP_200_OK)

class UsuarioOpcionesView(APIView):
    """Devuelve los cargos únicos de usuarios y las unidades únicas de maquinaria (normalizadas)."""
    def get(self, request):
        # Cargos desde usuarios
        collection = get_collection(Usuario)
        usuarios = list(collection.find({}, {"Cargo": 1}))
        cargos = set()
        for u in usuarios:
            if u.get("Cargo"):
                cargos.add(str(u["Cargo"]).strip())
        # Unidades desde maquinaria
        maquinaria_collection = get_collection(Maquinaria)
        maquinarias = list(maquinaria_collection.find({}, {"unidad": 1}))
        unidades = set()
        for m in maquinarias:
            unidad = m.get("unidad", "").strip().upper()
            if not unidad:
                continue
            if "OF." in unidad:
                unidades.add("OFICINA CENTRAL")
            else:
                unidades.add(unidad)
        unidades = sorted(unidades)
        return Response({
            "cargos": sorted(cargos),
            "unidades": unidades
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
def test_api(request):
    """Vista de prueba para verificar que la API funciona"""
    return Response({"message": "API funcionando correctamente", "status": "ok"})

@api_view(['POST'])
def validar_password_usuario(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'valid': False, 'error': 'Email y contraseña requeridos'}, status=400)
    collection = get_collection(Usuario)
    user = collection.find_one({"Email": email})
    if not user:
        return Response({'valid': False, 'error': 'Usuario no encontrado'}, status=404)
    import bcrypt
    if bcrypt.checkpw(password.encode('utf-8'), user["Password"].encode('utf-8')):
        return Response({'valid': True})
    else:
        return Response({'valid': False, 'error': 'Contraseña incorrecta'}, status=401)

@api_view(['POST'])
def reset_password_usuario(request):
    """Endpoint para restablecer contraseña de usuario"""
    email = request.data.get('email')
    nueva_password = request.data.get('nueva_password')
    
    if not email or not nueva_password:
        return Response({"error": "Email y nueva contraseña son requeridos"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verificar que el usuario existe
    user = get_collection(Usuario).find_one({"Email": email})
    if not user:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Hashear la nueva contraseña
        hashed_password = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Actualizar la contraseña en la base de datos
        get_collection(Usuario).update_one(
            {"Email": email},
            {"$set": {"Password": hashed_password}}
        )
        
        # Registrar la actividad
        registrar_actividad(
            email=email,
            accion="reset_password",
            modulo="usuarios",
            mensaje=f"Contraseña restablecida para usuario {email}",
            detalle="Restablecimiento de contraseña"
        )
        
        return Response({"message": "Contraseña actualizada exitosamente"}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"error": f"Error al actualizar contraseña: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def limpiar_usuarios_duplicados(request):
    """Limpiar usuarios duplicados en la base de datos"""
    try:
        # Verificar permisos de ADMINISTRADOR únicamente
        actor_email = request.headers.get('X-User-Email')
        if not actor_email:
            return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_collection(Usuario).find_one({"Email": actor_email})
        if not user or user.get('Cargo', '').lower() != 'admin':
            return Response({"error": "Solo los administradores pueden limpiar usuarios duplicados"}, status=status.HTTP_403_FORBIDDEN)
        
        collection = get_collection(Usuario)
        
        # Buscar usuarios duplicados por email
        pipeline = [
            {"$group": {
                "_id": "$Email",
                "count": {"$sum": 1},
                "docs": {"$push": "$_id"}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicados = list(collection.aggregate(pipeline))
        
        if not duplicados:
            return Response({'success': True, 'message': 'No hay usuarios duplicados'}, status=status.HTTP_200_OK)
        
        usuarios_eliminados = 0
        
        for duplicado in duplicados:
            email = duplicado['_id']
            ids = duplicado['docs']
            
            # Mantener el primer usuario (más antiguo) y eliminar los demás
            ids_a_eliminar = ids[1:]  # Mantener el primero, eliminar el resto
            
            for user_id in ids_a_eliminar:
                result = collection.delete_one({'_id': user_id})
                if result.deleted_count > 0:
                    usuarios_eliminados += 1
                    print(f"Usuario duplicado eliminado: {email} - ID: {user_id}")
        
        return Response({
            'success': True, 
            'message': f'Se eliminaron {usuarios_eliminados} usuarios duplicados',
            'duplicados_encontrados': len(duplicados)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error al limpiar usuarios duplicados: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Error interno: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SolicitarResetPasswordView(APIView):
    permission_classes = []  

    def post(self, request):
        try:
            email = request.data.get("Email") or request.data.get("email")
            if not email:
                return Response({"error": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)

            usuarios = get_collection(Usuario)
            user = usuarios.find_one({"Email": email})
            if not user:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            import random
            codigo = f"{random.randint(0, 999999):06d}"

            verificaciones = get_collection('verificaciones_reset')
            verificaciones.update_one(
                {"Email": email},
                {"$set": {
                    "Email": email,
                    "codigo": codigo,
                    "intentos": 0,
                    "creado_en": datetime.now(),
                    "expira_en": datetime.now() + timedelta(minutes=15)
                }},
                upsert=True
            )

            try:
                asunto = "Código para restablecer tu contraseña"
                mensaje = f"Tu código es: {codigo}. Vence en 15 minutos."
                send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception:
                pass

            try:
                registrar_actividad(email, 'solicitar_reset_password', 'Autenticación', 'Se solicitó código de reset')
            except Exception:
                pass

            return Response({"message": "Código enviado al correo"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerificarCodigoResetPasswordView(APIView):
    permission_classes = []  
    def post(self, request):
        try:
            email = request.data.get("Email") or request.data.get("email")
            codigo = request.data.get("codigo")
            nueva_password = request.data.get("nueva_password") or request.data.get("password")

            if not all([email, codigo, nueva_password]):
                return Response({"error": "Email, código y nueva contraseña son obligatorios"}, status=status.HTTP_400_BAD_REQUEST)
            if len(nueva_password) < 6:
                return Response({"error": "La contraseña debe tener al menos 6 caracteres"}, status=status.HTTP_400_BAD_REQUEST)

            verificaciones = get_collection('verificaciones_reset')
            solicitud = verificaciones.find_one({"Email": email})
            if not solicitud:
                return Response({"error": "No hay una solicitud de reset para este correo"}, status=status.HTTP_404_NOT_FOUND)

            if solicitud.get('expira_en') and datetime.now() > solicitud['expira_en']:
                return Response({"error": "El código ha expirado"}, status=status.HTTP_400_BAD_REQUEST)

            if solicitud.get('codigo') != codigo:
                verificaciones.update_one({"Email": email}, {"$inc": {"intentos": 1}})
                return Response({"error": "Código incorrecto"}, status=status.HTTP_400_BAD_REQUEST)
            usuarios = get_collection(Usuario)
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(nueva_password.encode("utf-8"), salt).decode("utf-8")
            upd = usuarios.update_one({"Email": email}, {"$set": {"Password": hashed}})
            if upd.matched_count == 0:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            verificaciones.delete_one({"Email": email})

            try:
                registrar_actividad(email, 'reset_password_exitoso', 'Autenticación', 'Contraseña actualizada')
            except Exception:
                pass

            return Response({"message": "Contraseña actualizada exitosamente"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReenviarCodigoResetPasswordView(APIView):
    permission_classes = []  
    def post(self, request):
        try:
            email = request.data.get("Email") or request.data.get("email")
            if not email:
                return Response({"error": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)

            verificaciones = get_collection('verificaciones_reset')
            sol = verificaciones.find_one({"Email": email})
            if not sol:
                return Response({"error": "No hay una solicitud de reset para este correo"}, status=status.HTTP_404_NOT_FOUND)

            import random
            codigo = f"{random.randint(0, 999999):06d}"
            verificaciones.update_one(
                {"Email": email},
                {"$set": {"codigo": codigo, "expira_en": datetime.now() + timedelta(minutes=15), "intentos": 0}}
            )

            try:
                asunto = "Nuevo código para restablecer tu contraseña"
                mensaje = f"Tu nuevo código es: {codigo}. Vence en 15 minutos."
                send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception:
                pass

            return Response({"message": "Código reenviado"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerificarPasswordActualView(APIView):
    permission_classes = [] 

    def post(self, request):
        email = request.headers.get('X-User-Email') or request.data.get('Email')
        password_actual = request.data.get('password_actual')
        if not email or not password_actual:
            return Response({"error": "Email y password_actual son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        usuarios = get_collection(Usuario)
        user = usuarios.find_one({"Email": email})
        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        stored_hash = (user.get("Password") or "").encode("utf-8")
        try:
            ok = bcrypt.checkpw(password_actual.encode("utf-8"), stored_hash)
        except Exception:
            return Response({"error": "Formato de contraseña inválido"}, status=status.HTTP_400_BAD_REQUEST)

        if not ok:
            return Response({"error": "Contraseña actual incorrecta"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Contraseña verificada"}, status=status.HTTP_200_OK)