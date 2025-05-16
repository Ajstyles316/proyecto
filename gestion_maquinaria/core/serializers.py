# serializers.py
from dateutil import parser
from rest_framework import serializers

from rest_framework import serializers

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
    detalle = serializers.CharField(required=True)
    placa = serializers.CharField(required=True)
    unidad = serializers.CharField(required=True)
    tipo = serializers.CharField(allow_blank=True, required=False)
    marca = serializers.CharField(allow_blank=True, required=False)
    modelo = serializers.CharField(allow_blank=True, required=False)

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance

    def create(self, validated_data):
        return validated_data


class ControlSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    estado = serializers.CharField(required=True)
    ubicacion = serializers.CharField(required=True)
    gerente = serializers.CharField(required=True)
    encargado = serializers.CharField(required=True)
    fecha = serializers.CharField(required=True)
    observaciones = serializers.CharField(required=True)
    
    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class MantenimientoSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    tipo = serializers.CharField()
    cantidad = serializers.IntegerField()
    recorrido = serializers.FloatField()
    ultimaRevision = serializers.CharField()
    horasOperacion = serializers.IntegerField()
    unidad = serializers.CharField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class AsignacionSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    fechaAsignacion = serializers.CharField()
    gestion = serializers.CharField()
    encargado_id = serializers.CharField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class ImpuestoSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    aporte = serializers.FloatField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class ITVSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    detalle = serializers.FloatField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class SeguroSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField(required=True)
    aporte = serializers.FloatField(required=True)

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance

    def create(self, validated_data):
        return validated_data
    
    
class MantenimientoActSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField(required=True)
    tipo = serializers.CharField(max_length=20)
    cantidad = serializers.IntegerField()
    recorrido = serializers.FloatField()
    horasOperacion = serializers.IntegerField()
    unidad = serializers.CharField(max_length=100)

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance