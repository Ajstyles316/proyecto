from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaquinariaViewSet,
    ControlViewSet,
    MantenimientoViewSet,
    AsignacionViewSet,
    ImpuestoViewSet,
    ITVViewSet,
    SeguroViewSet,
)

router = DefaultRouter()
router.register(r'maquinaria', MaquinariaViewSet)
router.register(r'control', ControlViewSet)
router.register(r'mantenimiento', MantenimientoViewSet)
router.register(r'asignacion', AsignacionViewSet)
router.register(r'impuesto', ImpuestoViewSet)
router.register(r'itv', ITVViewSet)
router.register(r'seguros', SeguroViewSet)

urlpatterns = [
    path('', include(router.urls)),
]