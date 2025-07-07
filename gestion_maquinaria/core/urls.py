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
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('pronostico/summary/', PronosticoSummaryView.as_view(), name='pronostico-summary'),
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('usuarios/<str:id>/cargo/', UsuarioCargoUpdateView.as_view(), name='usuario-cargo-update'),
    path('usuarios/<str:id>/permiso/', UsuarioPermisoUpdateView.as_view(), name='usuario-permiso-update'),
    path('usuarios/<str:id>/', UsuarioDeleteView.as_view(), name='usuario-delete'),
]