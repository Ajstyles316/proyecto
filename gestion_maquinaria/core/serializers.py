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
    class Meta:
        model = Mantenimiento
        fields = '__all__'


class AsignacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignacion
        fields = '__all__'


class ImpuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Impuesto
        fields = '__all__'


class ITVSerializer(serializers.ModelSerializer):
    class Meta:
        model = ITV
        fields = '__all__'


class SeguroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seguro
        fields = '__all__'