# project urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.views import APIView

from core.views import (
    RegistroView, LoginView,
    VerificarCodigoRegistroView, ReenviarCodigoRegistroView,
    MaquinariaListView, MaquinariaDetailView, MaquinariaOptionsView,
    HistorialControlListView, HistorialControlDetailView,
    ActaAsignacionListView, ActaAsignacionDetailView,
    LiberacionListView, LiberacionDetailView,
    MantenimientoListView, MantenimientoDetailView,
    SeguroListView, SeguroDetailView,
    ITVListView, ITVDetailView,
    SOATListView, SOATDetailView,
    ImpuestoListView, ImpuestoDetailView,
    ControlOdometroDetailView, ControlOdometroListView,
    activos_list, PronosticoAPIView, DashboardStatsView, PronosticoSummaryView,
    DepreciacionesDetailView, DepreciacionesGeneralView, DepreciacionesListView,
    TodosRegistrosDesactivadosView, test_api, PronosticoExcelUploadView,
    NovedadDetailView, NovedadListView
)

router = DefaultRouter()

class CustomApiRoot(APIView):
    def get(self, request, format=None):
        return Response({
            'maquinaria': request.build_absolute_uri('/api/maquinaria/'),
            'depreciaciones': request.build_absolute_uri('/api/depreciaciones/'),
            'activos': request.build_absolute_uri('/api/activos/'),
            'pronostico': request.build_absolute_uri('/api/pronostico/'),
            'novedades': request.build_absolute_uri('/api/novedades/'),
        })

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth/registro
    path('registro/', RegistroView.as_view(), name='registro'),
    path('registro/verificar/', VerificarCodigoRegistroView.as_view(), name='registro-verificar'),
    path('registro/reenviar/', ReenviarCodigoRegistroView.as_view(), name='registro-reenviar'),
    path('login/', LoginView.as_view(), name='login'),

    # API root + rutas del app
    path('api/', CustomApiRoot.as_view(), name='api-root'),
    path('api/', include(router.urls)),
    path('api/', include('core.urls')),   # ⬅️ esto define /api/novedades/... correctamente

    # Maquinaria (si las quieres también aquí, OK)
    path('api/maquinaria/', MaquinariaListView.as_view(), name='maquinaria-list'),
    path('api/maquinaria/<str:id>/', MaquinariaDetailView.as_view(), name='maquinaria-detail'),
    path('api/maquinaria/options/', MaquinariaOptionsView.as_view(), name='maquinaria-options'),

    path('api/maquinaria/<str:maquinaria_id>/control/', HistorialControlListView.as_view(), name='control-list'),
    path('api/maquinaria/<str:maquinaria_id>/control/<str:record_id>/', HistorialControlDetailView.as_view(), name='control-detail'),

    path('api/maquinaria/<str:maquinaria_id>/asignacion/', ActaAsignacionListView.as_view(), name='actaasignacion-list'),
    path('api/maquinaria/<str:maquinaria_id>/asignacion/<str:record_id>/', ActaAsignacionDetailView.as_view(), name='actaasignacion-detail'),

    path('api/maquinaria/<str:maquinaria_id>/liberacion/', LiberacionListView.as_view(), name='liberacion-list'),
    path('api/maquinaria/<str:maquinaria_id>/liberacion/<str:record_id>/', LiberacionDetailView.as_view(), name='liberacion-detail'),

    path('api/maquinaria/<str:maquinaria_id>/control-odometro/', ControlOdometroListView.as_view(), name='controlod-list'),
    path('api/maquinaria/<str:maquinaria_id>/control-odometro/<str:record_id>/', ControlOdometroDetailView.as_view(), name='controlod-detail'),

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

    # Depreciaciones
    path('api/depreciaciones/', DepreciacionesGeneralView.as_view(), name='depreciaciones-general'),
    path('api/depreciaciones/<str:maquinaria_id>/', DepreciacionesListView.as_view(), name='depreciaciones-list'),
    path('api/maquinaria/<str:maquinaria_id>/depreciaciones/<str:record_id>/', DepreciacionesDetailView.as_view(), name='depreciaciones-detail'),
    
    path('api/novedades/', NovedadDetailView.as_view(), name='novedad-detail'),
    path('api/novedades/<str:maquinaria_id>/', NovedadListView.as_view(), name='novedad-list'),
    # Otros
    path('api/activos/', activos_list, name='activos-list'),
    path('api/pronostico/', PronosticoAPIView.as_view(), name='api_pronostico'),
    path('api/dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('api/pronostico/summary/', PronosticoSummaryView.as_view(), name='pronostico-summary'),
    path('api/pronostico/excel-upload/', PronosticoExcelUploadView.as_view(), name='pronostico-excel-upload'),
    path('api/registros-desactivados/', TodosRegistrosDesactivadosView.as_view(), name='todos-registros-desactivados'),
    path('api/test/', test_api, name='test-api'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
