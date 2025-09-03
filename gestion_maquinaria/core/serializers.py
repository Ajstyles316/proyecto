from rest_framework import serializers
from datetime import datetime, date
from bson import ObjectId

class HistorialControlSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    fecha_inicio = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    fecha_final = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    proyecto = serializers.CharField(max_length=100, required=True)
    ubicacion = serializers.CharField(max_length=100, required=True)
    estado = serializers.CharField(max_length=100, required=True)
    tiempo = serializers.CharField(max_length=100, required=True)
    operador = serializers.CharField(max_length=100, required=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_fecha_inicio(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

    def validate_fecha_final(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

class ActaAsignacionSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    unidad = serializers.CharField(max_length=100, required=True)
    fecha_asignacion = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    kilometraje = serializers.FloatField(required=True)
    gerente = serializers.CharField(max_length=100, required=True)
    encargado = serializers.CharField(max_length=100, required=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class LiberacionSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    unidad = serializers.CharField(max_length=100, required=True)
    fecha_liberacion = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    kilometraje_entregado = serializers.FloatField(required=True)
    gerente = serializers.CharField(max_length=100, required=True)
    encargado = serializers.CharField(max_length=100, required=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class MantenimientoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    tipo_mantenimiento = serializers.CharField(max_length=100, required=True)
    consumo_combustible = serializers.FloatField(allow_null=True, required=False)
    consumo_lubricantes = serializers.FloatField(allow_null=True, required=False)
    mano_obra = serializers.FloatField(allow_null=True, required=False)
    costo_total = serializers.FloatField(required=False)
    tecnico_responsable = serializers.CharField(max_length=200, required=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

class SeguroSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    fecha_inicial = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    fecha_final = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    numero_poliza = serializers.CharField(max_length=100, required=True)
    compania_aseguradora = serializers.CharField(max_length=200, required=True)
    importe = serializers.FloatField(required=True)
    archivo_pdf = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Base64 del archivo
    nombre_archivo = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    tipo_archivo = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    tamaño_archivo = serializers.IntegerField(required=False, allow_null=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_fecha_inicial(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

    def validate_fecha_final(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value

    def validate_archivo_pdf(self, value):
        # Permitir valores vacíos, null o strings válidos
        if value is None or value == '':
            return value
        if isinstance(value, str):
            # Verificar que sea base64 válido (opcional)
            if value.startswith('data:application/pdf;base64,'):
                return value
            elif len(value) > 0:
                return value
        return value

class ITVSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    gestion = serializers.CharField(max_length=100, required=True)
    archivo_pdf = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Base64 del archivo
    nombre_archivo = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    tipo_archivo = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    tamaño_archivo = serializers.IntegerField(required=False, allow_null=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_archivo_pdf(self, value):
        # Permitir valores vacíos, null o strings válidos
        if value is None or value == '':
            return value
        if isinstance(value, str):
            # Verificar que sea base64 válido (opcional)
            if value.startswith('data:application/pdf;base64,'):
                return value
            elif len(value) > 0:
                return value
        return value

class SOATSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    gestion = serializers.CharField(max_length=100, required=True)
    archivo_pdf = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Base64 del archivo
    nombre_archivo = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    tipo_archivo = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    tamaño_archivo = serializers.IntegerField(required=False, allow_null=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_archivo_pdf(self, value):
        # Permitir valores vacíos, null o strings válidos
        if value is None or value == '':
            return value
        if isinstance(value, str):
            # Verificar que sea base64 válido (opcional)
            if value.startswith('data:application/pdf;base64,'):
                return value
            elif len(value) > 0:
                return value
        return value

class ImpuestoSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    gestion = serializers.CharField(max_length=100, required=True)
    archivo_pdf = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Base64 del archivo
    nombre_archivo = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    tipo_archivo = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    tamaño_archivo = serializers.IntegerField(required=False, allow_null=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_archivo_pdf(self, value):
        # Permitir valores vacíos, null o strings válidos
        if value is None or value == '':
            return value
        if isinstance(value, str):
            # Verificar que sea base64 válido (opcional)
            if value.startswith('data:application/pdf;base64,'):
                return value
            elif len(value) > 0:
                return value
        return value

class MaquinariaSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    gestion = serializers.CharField(max_length=100, required=False)
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
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_fecha_registro(self, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido. Use YYYY-MM-DD")
        return value
    
    def validate_imagen(self, value):
        # Valida que la imagen sea un base64 válido (opcional)
        if value and not value.startswith('data:image/'):
            raise serializers.ValidationError("Formato de imagen inválido")
        return value  # Acepta base64

class ControlOdometroSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    unidad = serializers.CharField(max_length=100, required=True)
    odometro_inicial = serializers.FloatField(required=True)
    odometro_final = serializers.FloatField(required=True)
    odometro_mes = serializers.FloatField(required=True)
    fotos = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    registrado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    validado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    autorizado_por = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_maquinaria(self, value):
        try:
            return ObjectId(value)
        except:
            raise serializers.ValidationError("ID de maquinaria inválido")

    def validate_odometro_inicial(self, value):
        if value < 0:
            raise serializers.ValidationError("El odómetro inicial no puede ser negativo")
        return value

    def validate_odometro_final(self, value):
        if value < 0:
            raise serializers.ValidationError("El odómetro final no puede ser negativo")
        return value

    def validate_odometro_mes(self, value):
        if value < 0:
            raise serializers.ValidationError("El odómetro del mes no puede ser negativo")
        return value

    def validate_fotos(self, value):
        # Validar que las fotos sean base64 válidos
        for foto in value:
            if foto and not foto.startswith('data:image/'):
                raise serializers.ValidationError("Formato de imagen inválido")
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

class VerificarCodigoSerializer(serializers.Serializer):
    Email = serializers.EmailField(required=True)
    codigo = serializers.CharField(required=True, min_length=6, max_length=6)

class ReenviarCodigoSerializer(serializers.Serializer):
    Email = serializers.EmailField(required=True)

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
    valor = serializers.FloatField(required=False)  # compatibilidad antigua
    valor_anual_depreciado = serializers.FloatField(required=False)
    depreciacion_acumulada = serializers.FloatField(required=False)
    valor_en_libros = serializers.FloatField(required=False)

class DepreciacionSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    maquinaria = serializers.CharField(write_only=True, required=True)
    bien_uso = serializers.CharField(required=False, allow_blank=True)
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

class ActivoSerializer(serializers.Serializer):
    bien_uso = serializers.CharField()
    vida_util = serializers.IntegerField()
    coeficiente = serializers.FloatField()
    
class PronosticoInputSerializer(serializers.Serializer):
    placa = serializers.CharField(max_length=20)
    fecha_asig = serializers.DateField()
    horas_op = serializers.FloatField()
    recorrido = serializers.FloatField()