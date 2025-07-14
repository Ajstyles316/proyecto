from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView,
    RegistroView,
    LoginView,
    PronosticoSummaryView,
    UsuarioListView,
    UsuarioCargoUpdateView,
    UsuarioPermisoUpdateView,
    UsuarioDeleteView,
    DepreciacionesGeneralView,
    DepreciacionesListView,
    DepreciacionesDetailView,
    sugerir_bien_uso,
    MaquinariasConDepreciacionView,
    MaquinariaConDepreciacionBuscarView,
    UsuarioPermisosUpdateView,  # <-- importar la nueva vista
    SeguimientoListView,  # <-- importar la nueva vista
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('pronostico/summary/', PronosticoSummaryView.as_view(), name='pronostico-summary'),
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('sugerir_bien_uso/', sugerir_bien_uso, name='sugerir_bien_uso'),
    path('usuarios/<str:id>/cargo/', UsuarioCargoUpdateView.as_view(), name='usuario-cargo-update'),
    path('usuarios/<str:id>/permiso/', UsuarioPermisoUpdateView.as_view(), name='usuario-permiso-update'),
    path('usuarios/<str:id>/permisos/', UsuarioPermisosUpdateView.as_view(), name='usuario-permisos-update'),
    path('usuarios/<str:id>/', UsuarioDeleteView.as_view(), name='usuario-delete'),
    path('api/depreciaciones/', DepreciacionesGeneralView.as_view(), name='depreciaciones-general'),
    path('api/depreciaciones/<str:maquinaria_id>/', DepreciacionesListView.as_view(), name='depreciaciones-list'),
    path('api/maquinaria/<str:maquinaria_id>/depreciaciones/<str:record_id>/', DepreciacionesDetailView.as_view(), name='depreciaciones-detail'),
    path('api/maquinarias_con_depreciacion/', MaquinariasConDepreciacionView.as_view(), name='maquinarias-con-depreciacion'),
    path('api/maquinarias_con_depreciacion/buscar/', MaquinariaConDepreciacionBuscarView.as_view(), name='maquinarias-con-depreciacion-buscar'),
    path('seguimiento/', SeguimientoListView.as_view(), name='seguimiento-list'),
]