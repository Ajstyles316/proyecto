from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.views import APIView
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
    
    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImpuestoViewSet(viewsets.ModelViewSet):
    queryset = Impuesto.objects.all()
    serializer_class = ImpuestoSerializer


class ITVViewSet(viewsets.ModelViewSet):
    queryset = ITV.objects.all()
    serializer_class = ITVSerializer


class SeguroViewSet(viewsets.ModelViewSet):
    queryset = Seguro.objects.all()
    serializer_class = SeguroSerializer
    
class DashboardStatsView(APIView):
    def get(self, request):
        total_seguros = Seguro.objects.count()
        mantenimientos_pendientes = Mantenimiento.objects.filter(estado="PENDIENTE").count()
        unidades_en_control = Control.objects.count()
        horas_totales_operativas = sum(m.horasOperacion for m in Mantenimiento.objects.all())

        data = [
            {"title": "Total de Seguros", "value": str(total_seguros), "icon": "mdi:file-document-outline", "color": "primary.main"},
            {"title": "Mantenimientos Pendientes", "value": str(mantenimientos_pendientes), "icon": "mdi:wrench", "color": "warning.main"},
            {"title": "Unidades en Control", "value": str(unidades_en_control), "icon": "mdi:truck-fast", "color": "success.main"},
            {"title": "Horas Totales Operativas", "value": f"{horas_totales_operativas:,}", "icon": "mdi:clock-time-eight", "color": "info.main"},
        ]
        return Response(data)