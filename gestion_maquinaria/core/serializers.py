from rest_framework import serializers
from datetime import datetime, date
from bson import ObjectId

class HistorialControlSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    ubicacion = serializers.CharField(max_length=100, required=True)
    gerente = serializers.CharField(max_length=100, allow_blank=True, required=False)
    encargado = serializers.CharField(max_length=100, allow_blank=True, required=False)
    hoja_tramite = serializers.CharField(max_length=200, allow_blank=True, required=False)
    fecha_ingreso = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    observacion = serializers.CharField(allow_blank=True, required=False)
    estado = serializers.CharField(max_length=100, allow_blank=True, required=False)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_fecha_ingreso(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

class ActaAsignacionSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    fecha_asignacion = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    fecha_liberacion = serializers.DateField(allow_null=True, required=False, input_formats=['%Y-%m-%d'])
    recorrido_km = serializers.FloatField(allow_null=True, required=False)
    recorrido_entregado = serializers.FloatField(allow_null=True, required=False)
    encargado = serializers.CharField(max_length=100, allow_blank=True, required=False)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_fecha_asignacion(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

    def validate_fecha_liberacion(self, value):
        if value and isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

class MantenimientoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    tipo = serializers.CharField(max_length=20)
    cantidad = serializers.IntegerField(allow_null=True)  # Nuevo campo
    gestion = serializers.CharField(max_length=100)
    ubicacion = serializers.CharField(max_length=200)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class SeguroSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    numero_2024 = serializers.IntegerField(required=False)  # Nuevo nombre
    importe = serializers.FloatField(allow_null=True, required=False)
    detalle = serializers.CharField(max_length=200, allow_blank=True, required=False)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class ITVSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    detalle = serializers.CharField(max_length=200, allow_blank=True, required=False)
    importe = serializers.FloatField(allow_null=True, required=False)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class SOATSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    importe_2024 = serializers.FloatField(required=True)
    importe_2025 = serializers.FloatField(required=True)
    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class ImpuestoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    importe_2023 = serializers.FloatField(required=True)
    importe_2024 = serializers.FloatField(required=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class MaquinariaSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    gestion = serializers.CharField(max_length=100, required=True)
    placa = serializers.CharField(max_length=50, required=True)
    detalle = serializers.CharField(max_length=200, required=True)
    unidad = serializers.CharField(max_length=100, required=True)
    adqui = serializers.CharField(max_length=100, allow_blank=True, required=False)
    codigo = serializers.CharField(max_length=50, allow_blank=True, required=False)
    tipo = serializers.CharField(max_length=100, allow_blank=True, required=False)
    marca = serializers.CharField(max_length=100, allow_blank=True, required=False)
    modelo = serializers.CharField(max_length=100, allow_blank=True, required=False)
    metodo_depreciacion = serializers.CharField(max_length=50, allow_blank=True, required=False)
    tipo_vehiculo = serializers.CharField(max_length=50, allow_blank=True, required=False)
    subtipo_vehiculo = serializers.CharField(max_length=50, allow_blank=True, required=False)
    crpva = serializers.CharField(max_length=50, allow_blank=True, required=False)
    color = serializers.CharField(max_length=50, allow_blank=True, required=False)
    nro_motor = serializers.CharField(max_length=50, allow_blank=True, required=False)
    nro_chasis = serializers.CharField(max_length=50, allow_blank=True, required=False)
    fecha_registro = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    imagen = serializers.CharField(allow_blank=True, required=False)
    
    def validate_fecha_registro(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value
    
    def validate_imagen(self, value):
        # Valida que la imagen sea un base64 válido (opcional)
        if value and value.startswith("data:image/"):
            return value  # Acepta base64
        return value
    
class RegistroSerializer(serializers.Serializer):
    Nombre = serializers.CharField(required=True)
    Cargo = serializers.CharField(required=True)
    Unidad = serializers.CharField(required=True)
    Email = serializers.EmailField(required=True)
    Password = serializers.CharField(required=True)
    confirmPassword = serializers.CharField(required=True)

    def validate(self, data):
        if data["Password"] != data["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Las contraseñas no coinciden"})
        return data

    def update(self, instance, validated_data):
        return validated_data

    def create(self, validated_data):
        return validated_data

class LoginSerializer(serializers.Serializer):
    Email = serializers.EmailField(required=True)
    Password = serializers.CharField(required=True)
    
    def update(self, instance, validated_data):
        return validated_data

    def create(self, validated_data):
        return validated_data

class DepreciacionEntrySerializer(serializers.Serializer):
    anio = serializers.IntegerField()
    valor = serializers.FloatField()

class DepreciacionSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    costo_activo = serializers.FloatField(required=True)
    fecha_compra = serializers.DateTimeField(required=True, input_formats=['%Y-%m-%d'])
    metodo = serializers.CharField(max_length=100, required=True)
    vida_util = serializers.IntegerField(required=True)
    depreciacion_por_anio = serializers.ListField(
        child=DepreciacionEntrySerializer(),
        required=True
    )
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except Exception:
            raise serializers.ValidationError("ID de maquinaria inválido")
        
    def validate_costo_activo(self, value):
        if value <= 0:
            raise serializers.ValidationError("El costo del activo debe ser mayor a 0.")
        return value
    
    def validate_fecha_compra(self, value):
        if isinstance(value, str):
            try:
                # Convertir a datetime en lugar de date
                return datetime.strptime(value, '%Y-%m-%d')
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        elif isinstance(value, date):
            # Si es un objeto date, convertirlo a datetime
            return datetime.combine(value, datetime.min.time())
        return value