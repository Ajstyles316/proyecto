from rest_framework import serializers
from .models import Maquinaria, Control, Mantenimiento, Asignacion, Impuesto, ITV, Seguro

class MaquinariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maquinaria
        fields = '__all__'


class ControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Control
        fields = '__all__'


class MantenimientoSerializer(serializers.ModelSerializer):
    maquinaria_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Mantenimiento
        fields = '__all__'

    def get_maquinaria_nombre(self, obj):
        return obj.maquinaria.detalle


class AsignacionSerializer(serializers.ModelSerializer):
    maquinaria_detalle = serializers.SerializerMethodField()
    encargado_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Asignacion
        fields = '__all__'

    def get_maquinaria_detalle(self, obj):
        return obj.maquinaria.detalle

    def get_encargado_nombre(self, obj):
        return obj.encargado.encargado


class ImpuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Impuesto
        fields = '__all__'


class ITVSerializer(serializers.ModelSerializer):
    class Meta:
        model = ITV
        fields = '__all__'


class SeguroSerializer(serializers.ModelSerializer):
    maquinaria_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Seguro
        fields = '__all__'

    def get_maquinaria_detalle(self, obj):
        return obj.maquinaria.detalle