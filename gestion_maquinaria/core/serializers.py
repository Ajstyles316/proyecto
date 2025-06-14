from rest_framework import serializers
from datetime import datetime
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
    fecha_asignacion = serializers.DateField()
    fecha_liberacion = serializers.DateField(allow_null=True, required=False)
    recorrido_km = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)
    recorrido_entregado = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)

class MantenimientoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    tipo = serializers.CharField(max_length=20)
    gestion = serializers.CharField(max_length=100)
    lugar = serializers.CharField(max_length=200)

class SeguroSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    placa = serializers.CharField(max_length=50, allow_blank=True, required=False)
    numero_poliza = serializers.CharField(max_length=50, allow_blank=True, required=False)
    importe = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)
    detalle = serializers.CharField(max_length=200, allow_blank=True, required=False)

class ITVSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    placa = serializers.CharField(max_length=50, allow_blank=True, required=False)
    detalle = serializers.CharField(max_length=200, allow_blank=True, required=False)
    importe = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)

class SOATSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    placa = serializers.CharField(max_length=50, allow_blank=True, required=False)
    importe_2024 = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)
    importe_2025 = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)

class ImpuestoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    placa = serializers.CharField(max_length=50, allow_blank=True, required=False)
    importe_2023 = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)
    importe_2024 = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, required=False)

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
    color = serializers.CharField(max_length=50, allow_blank=True, required=False)
    nro_motor = serializers.CharField(max_length=50, allow_blank=True, required=False)
    nro_chasis = serializers.CharField(max_length=50, allow_blank=True, required=False)
    fecha_registro = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])

    def validate_fecha_registro(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
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
