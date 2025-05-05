# serializers.py

from rest_framework import serializers

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
    estado = serializers.CharField()
    ubicacion = serializers.CharField()
    gerente = serializers.CharField()
    encargado = serializers.CharField()
    fecha = serializers.DateField()
    observaciones = serializers.CharField(required=False, allow_blank=True)

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
    ultimaRevision = serializers.DateField()
    horasOperacion = serializers.IntegerField()
    unidad = serializers.CharField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance


class AsignacionSerializer(serializers.Serializer):
    maquinaria_id = serializers.CharField()
    fechaAsignacion = serializers.DateField()
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
    maquinaria_id = serializers.CharField()
    aporte = serializers.FloatField()

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        instance.update(validated_data)
        return instance