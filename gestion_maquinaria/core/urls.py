# urls.py

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
    DashboardStatsView,
)

router = DefaultRouter()
router.register(r'maquinaria', MaquinariaViewSet, basename='maquinaria')
router.register(r'control', ControlViewSet, basename='control')
router.register(r'mantenimiento', MantenimientoViewSet, basename='mantenimiento')
router.register(r'asignacion', AsignacionViewSet, basename='asignacion')
router.register(r'impuesto', ImpuestoViewSet, basename='impuesto')
router.register(r'itv', ITVViewSet, basename='itv')
router.register(r'seguros', SeguroViewSet, basename='seguros')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
]