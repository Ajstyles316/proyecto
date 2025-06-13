from rest_framework import serializers
from .models import Maquinaria, HistorialControl, ActaAsignacion, Mantenimiento, Seguro, ITV, SOAT, Impuesto

class HistorialControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialControl
        fields = ['ubicacion', 'gerente', 'encargado', 'hoja_tramite', 'fecha_ingreso', 'observacion']

class ActaAsignacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaAsignacion
        fields = ['fecha_asignacion', 'fecha_liberacion', 'recorrido_km', 'recorrido_entregado']

class MantenimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mantenimiento
        fields = ['tipo', 'gestion', 'lugar']

class SeguroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seguro
        fields = ['placa', 'numero_poliza', 'importe', 'detalle']

class ITVSerializer(serializers.ModelSerializer):
    class Meta:
        model = ITV
        fields = ['placa', 'detalle', 'importe']

class SOATSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOAT
        fields = ['placa', 'importe_2024', 'importe_2025']

class ImpuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Impuesto
        fields = ['placa', 'importe_2023', 'importe_2024']

class MaquinariaSerializer(serializers.ModelSerializer):
    historial = HistorialControlSerializer(many=True, required=False)
    acta_asignacion = ActaAsignacionSerializer(required=False)
    mantenimiento = MantenimientoSerializer(required=False)
    seguros = SeguroSerializer(required=False)
    itv = ITVSerializer(required=False)
    soat = SOATSerializer(required=False)
    impuestos = ImpuestoSerializer(required=False)
    
    class Meta:
        model = Maquinaria
        fields = [
            '_id', 'gestion', 'placa', 'detalle', 'unidad', 'adqui', 'codigo',
            'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis',
            'fecha_registro', 'historial', 'acta_asignacion', 'mantenimiento',
            'seguros', 'itv', 'soat', 'impuestos'
        ]
        read_only_fields = ['_id']
    
    def create(self, validated_data):
        # Extraer datos anidados
        historial_data = validated_data.pop('historial', [])
        acta_data = validated_data.pop('acta_asignacion', None)
        mantenimiento_data = validated_data.pop('mantenimiento', None)
        seguros_data = validated_data.pop('seguros', None)
        itv_data = validated_data.pop('itv', None)
        soat_data = validated_data.pop('soat', None)
        impuestos_data = validated_data.pop('impuestos', None)
        
        # Crear la máquina base
        maquinaria = Maquinaria.objects.create(**validated_data)
        
        # Crear historial si existe
        if historial_data:
            for item in historial_data:
                maquinaria.historial.create(**item)
        
        # Crear documentos embebidos si existen
        if acta_data:
            maquinaria.acta_asignacion = ActaAsignacion.objects.create(**acta_data)
        if mantenimiento_data:
            maquinaria.mantenimiento = Mantenimiento.objects.create(**mantenimiento_data)
        if seguros_data:
            maquinaria.seguros = Seguro.objects.create(**seguros_data)
        if itv_data:
            maquinaria.itv = ITV.objects.create(**itv_data)
        if soat_data:
            maquinaria.soat = SOAT.objects.create(**soat_data)
        if impuestos_data:
            maquinaria.impuestos = Impuesto.objects.create(**impuestos_data)
        
        maquinaria.save()
        return maquinaria
    
    def update(self, instance, validated_data):
        # Extraer datos anidados
        historial_data = validated_data.pop('historial', None)
        acta_data = validated_data.pop('acta_asignacion', None)
        mantenimiento_data = validated_data.pop('mantenimiento', None)
        seguros_data = validated_data.pop('seguros', None)
        itv_data = validated_data.pop('itv', None)
        soat_data = validated_data.pop('soat', None)
        impuestos_data = validated_data.pop('impuestos', None)
        
        # Actualizar campos base
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Actualizar historial si existe
        if historial_data is not None:
            instance.historial.all().delete()
            for item in historial_data:
                instance.historial.create(**item)
        
        # Actualizar documentos embebidos si existen
        if acta_data:
            if instance.acta_asignacion:
                for attr, value in acta_data.items():
                    setattr(instance.acta_asignacion, attr, value)
                instance.acta_asignacion.save()
            else:
                instance.acta_asignacion = ActaAsignacion.objects.create(**acta_data)
        
        if mantenimiento_data:
            if instance.mantenimiento:
                for attr, value in mantenimiento_data.items():
                    setattr(instance.mantenimiento, attr, value)
                instance.mantenimiento.save()
            else:
                instance.mantenimiento = Mantenimiento.objects.create(**mantenimiento_data)
        
        if seguros_data:
            if instance.seguros:
                for attr, value in seguros_data.items():
                    setattr(instance.seguros, attr, value)
                instance.seguros.save()
            else:
                instance.seguros = Seguro.objects.create(**seguros_data)
        
        if itv_data:
            if instance.itv:
                for attr, value in itv_data.items():
                    setattr(instance.itv, attr, value)
                instance.itv.save()
            else:
                instance.itv = ITV.objects.create(**itv_data)
        
        if soat_data:
            if instance.soat:
                for attr, value in soat_data.items():
                    setattr(instance.soat, attr, value)
                instance.soat.save()
            else:
                instance.soat = SOAT.objects.create(**soat_data)
        
        if impuestos_data:
            if instance.impuestos:
                for attr, value in impuestos_data.items():
                    setattr(instance.impuestos, attr, value)
                instance.impuestos.save()
            else:
                instance.impuestos = Impuesto.objects.create(**impuestos_data)
        
        instance.save()
        return instance

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

class MaquinariaSerializer(serializers.Serializer):
    gestion=serializers.CharField(required=True)
    detalle = serializers.CharField(required=True)
    placa = serializers.CharField(required=True)
    unidad = serializers.CharField(required=True)
    adqui = serializers.CharField(allow_blank=True, required=False)
    codigo = serializers.CharField(allow_blank=True, required=False)
    tipo = serializers.CharField(allow_blank=True, required=False)
    marca = serializers.CharField(allow_blank=True, required=False)
    modelo = serializers.CharField(allow_blank=True, required=False)
    color = serializers.CharField(allow_blank=True, required=False)
    nroMotor = serializers.CharField(allow_blank=True, required=False)
    nroChasis = serializers.CharField(allow_blank=True, required=False)
    fechaRegistro = serializers.DateField()
    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance

    def create(self, validated_data):
        return validated_data
    
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
