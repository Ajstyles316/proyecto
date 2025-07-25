from django.contrib import admin
from django.urls import path, include
from rest_framework.renderers import JSONRenderer
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.views import APIView

# Importar las nuevas vistas basadas en clases
from core.views import (
    RegistroView, LoginView,
    MaquinariaListView, MaquinariaDetailView, MaquinariaOptionsView,
    HistorialControlListView, HistorialControlDetailView,
    ActaAsignacionListView, ActaAsignacionDetailView,
    MantenimientoListView, MantenimientoDetailView,
    SeguroListView, SeguroDetailView,
    ITVListView, ITVDetailView,
    SOATListView, SOATDetailView,
    ImpuestoListView, ImpuestoDetailView,
    activos_list, PronosticoAPIView, DashboardStatsView, PronosticoSummaryView,
    DepreciacionesDetailView,DepreciacionesGeneralView,DepreciacionesListView,
    # Agregar las nuevas vistas
    TodosRegistrosDesactivadosView, test_api
)

router = DefaultRouter()
class CustomApiRoot(APIView):
    """
    API Root personalizada que lista todos los recursos principales.
    """
    def get(self, request, format=None):
        base = request.build_absolute_uri('/api/maquinaria/')
        return Response({
            'maquinaria': request.build_absolute_uri('/api/maquinaria/'),
            'depreciaciones': request.build_absolute_uri('/api/depreciaciones/'),
            'activos': request.build_absolute_uri('/api/activos/'),
            'pronostico':request.build_absolute_uri('/api/pronostico/')
        })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('login/', LoginView.as_view(), name='login'),
    # API root navegable y rutas automáticas para maquinaria
    path('api/', CustomApiRoot.as_view(), name='api-root'),
    path('api/', include(router.urls)),
    path('api/', include('core.urls')),  # <--- Cambiado aquí
    # Rutas para Maquinaria Principal (JSON puro)
    path('api/maquinaria/', MaquinariaListView.as_view(), name='maquinaria-list'),
    path('api/maquinaria/<str:id>/', MaquinariaDetailView.as_view(), name='maquinaria-detail'),
    path('api/maquinaria/options/', MaquinariaOptionsView.as_view(), name='maquinaria-options'),

    # Rutas para Sub-secciones (CRUD completo)
    path('api/maquinaria/<str:maquinaria_id>/control/', HistorialControlListView.as_view(), name='control-list'),
    path('api/maquinaria/<str:maquinaria_id>/control/<str:record_id>/', HistorialControlDetailView.as_view(), name='control-detail'),

    path('api/maquinaria/<str:maquinaria_id>/asignacion/', ActaAsignacionListView.as_view(), name='actaasignacion-list'),
    path('api/maquinaria/<str:maquinaria_id>/asignacion/<str:record_id>/', ActaAsignacionDetailView.as_view(), name='actaasignacion-detail'),

    path('api/maquinaria/<str:maquinaria_id>/mantenimiento/', MantenimientoListView.as_view(), name='mantenimiento-list'),
    path('api/maquinaria/<str:maquinaria_id>/mantenimiento/<str:record_id>/', MantenimientoDetailView.as_view(), name='mantenimiento-detail'),

    path('api/maquinaria/<str:maquinaria_id>/seguros/', SeguroListView.as_view(), name='seguro-list'),
    path('api/maquinaria/<str:maquinaria_id>/seguros/<str:record_id>/', SeguroDetailView.as_view(), name='seguro-detail'),

    path('api/maquinaria/<str:maquinaria_id>/itv/', ITVListView.as_view(), name='itv-list'),
    path('api/maquinaria/<str:maquinaria_id>/itv/<str:record_id>/', ITVDetailView.as_view(), name='itv-detail'),

    path('api/maquinaria/<str:maquinaria_id>/soat/', SOATListView.as_view(), name='soat-list'),
    path('api/maquinaria/<str:maquinaria_id>/soat/<str:record_id>/', SOATDetailView.as_view(), name='soat-detail'),

    path('api/maquinaria/<str:maquinaria_id>/impuestos/', ImpuestoListView.as_view(), name='impuesto-list'),
    path('api/maquinaria/<str:maquinaria_id>/impuestos/<str:record_id>/', ImpuestoDetailView.as_view(), name='impuesto-detail'),
    
    path('api/depreciaciones/', DepreciacionesGeneralView.as_view(), name='depreciaciones-general'),
    path('api/depreciaciones/<str:maquinaria_id>/', DepreciacionesListView.as_view(), name='depreciaciones-list'),
    path('api/maquinaria/<str:maquinaria_id>/depreciaciones/<str:record_id>/', DepreciacionesDetailView.as_view(), name='depreciaciones-detail'),
    
    path('api/activos/', activos_list, name='activos-list'),
    path("api/pronostico/", PronosticoAPIView.as_view(), name="api_pronostico"),
    path('api/dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('api/pronostico/summary/', PronosticoSummaryView.as_view(), name='pronostico-summary'),
    
    # URLs para registros desactivados
    path('api/registros-desactivados/', TodosRegistrosDesactivadosView.as_view(), name='todos-registros-desactivados'),
    path('api/test/', test_api, name='test-api'),
]