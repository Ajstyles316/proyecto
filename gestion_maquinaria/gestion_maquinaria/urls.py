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
    DepreciacionGeneralView,
    DepreciacionListView, DepreciacionDetailView,
    MaquinariaViewSet,
)

router = DefaultRouter()
router.register(r'maquinaria', MaquinariaViewSet, basename='maquinaria')

class CustomApiRoot(APIView):
    """
    API Root personalizada que lista todos los recursos principales.
    """
    def get(self, request, format=None):
        base = request.build_absolute_uri('/api/maquinaria/')
        return Response({
            'maquinaria': request.build_absolute_uri('/api/maquinaria/'),
            'depreciaciones': request.build_absolute_uri('/api/depreciacion/'),
        })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('login/', LoginView.as_view(), name='login'),
    # No es necesario path('api/', include('core.urls')), si todas las urls se definen aquí

    # Rutas para Maquinaria Principal (JSON puro)
    path('api/maquinaria/', MaquinariaListView.as_view(renderer_classes=[JSONRenderer]), name='maquinaria-list'),
    path('api/maquinaria/<str:id>/', MaquinariaDetailView.as_view(renderer_classes=[JSONRenderer]), name='maquinaria-detail'),
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

    path('api/depreciacion/', DepreciacionGeneralView.as_view(), name='depreciacion-general'),
    path('api/depreciacion/<str:maquinaria_id>/', DepreciacionListView.as_view(), name='depreciacion-list'),
    path('api/maquinaria/<str:maquinaria_id>/depreciacion/<str:record_id>/', DepreciacionDetailView.as_view(), name='depreciacion-detail'),

    path('api/', CustomApiRoot.as_view(), name='api-root'),
    path('api/', include(router.urls)),
]