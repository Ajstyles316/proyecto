from rest_framework import viewsets
from .models import Maquinaria, Control, Mantenimiento, Asignacion, Impuesto, ITV, Seguro
from .serializers import (
    MaquinariaSerializer,
    ControlSerializer,
    MantenimientoSerializer,
    AsignacionSerializer,
    ImpuestoSerializer,
    ITVSerializer,
    SeguroSerializer,
)

class MaquinariaViewSet(viewsets.ModelViewSet):
    queryset = Maquinaria.objects.all()
    serializer_class = MaquinariaSerializer


class ControlViewSet(viewsets.ModelViewSet):
    queryset = Control.objects.all()
    serializer_class = ControlSerializer


class MantenimientoViewSet(viewsets.ModelViewSet):
    queryset = Mantenimiento.objects.all()
    serializer_class = MantenimientoSerializer


class AsignacionViewSet(viewsets.ModelViewSet):
    queryset = Asignacion.objects.all()
    serializer_class = AsignacionSerializer


class ImpuestoViewSet(viewsets.ModelViewSet):
    queryset = Impuesto.objects.all()
    serializer_class = ImpuestoSerializer


class ITVViewSet(viewsets.ModelViewSet):
    queryset = ITV.objects.all()
    serializer_class = ITVSerializer


class SeguroViewSet(viewsets.ModelViewSet):
    queryset = Seguro.objects.all()
    serializer_class = SeguroSerializer