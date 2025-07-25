from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView,
    RegistroView,
    LoginView,
    LogoutView,  # <-- agregar importación
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
    UsuarioUpdateView,  # <-- importar la vista para /usuarios/me/
    UsuarioOpcionesView,  # <-- importar la nueva vista de opciones
    validar_password_usuario,  # <-- importar la nueva vista
    reset_password_usuario,  # <-- importar la vista de reset password
    test_api,  # <-- importar la vista de prueba
    RegistrosDesactivadosView,  # <-- importar la nueva vista
    TodosRegistrosDesactivadosView,  # <-- importar la nueva vista
    # Vistas de secciones
    HistorialControlListView,
    HistorialControlDetailView,
    ActaAsignacionListView,
    ActaAsignacionDetailView,
    MantenimientoListView,
    MantenimientoDetailView,
    SeguroListView,
    SeguroDetailView,
    ITVListView,
    ITVDetailView,
    SOATListView,
    SOATDetailView,
    ImpuestoListView,
    ImpuestoDetailView,
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),  # <-- agregar URL
    path('registro/', RegistroView.as_view(), name='registro'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('pronostico/summary/', PronosticoSummaryView.as_view(), name='pronostico-summary'),
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('usuarios/opciones/', UsuarioOpcionesView.as_view(), name='usuarios-opciones'),
    path('sugerir_bien_uso/', sugerir_bien_uso, name='sugerir_bien_uso'),
    path('usuarios/me/', UsuarioUpdateView.as_view(), name='usuario-self-update'),
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
    path('api/usuarios/validar_password/', validar_password_usuario, name='usuarios-validar-password'),
    path('api/usuarios/reset_password/', reset_password_usuario, name='usuarios-reset-password'),
    path('api/maquinaria/<str:maquinaria_id>/desactivados/', RegistrosDesactivadosView.as_view(), name='registros-desactivados'),
    path('api/registros-desactivados/', TodosRegistrosDesactivadosView.as_view(), name='todos-registros-desactivados'),
    path('api/test/', test_api, name='test-api'),
    
    # URLs específicas para cada sección
    path('api/maquinaria/<str:maquinaria_id>/control/', include([
        path('', HistorialControlListView.as_view(), name='control-list'),
        path('<str:record_id>/', HistorialControlDetailView.as_view(), name='control-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/asignacion/', include([
        path('', ActaAsignacionListView.as_view(), name='asignacion-list'),
        path('<str:record_id>/', ActaAsignacionDetailView.as_view(), name='asignacion-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/mantenimiento/', include([
        path('', MantenimientoListView.as_view(), name='mantenimiento-list'),
        path('<str:record_id>/', MantenimientoDetailView.as_view(), name='mantenimiento-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/seguros/', include([
        path('', SeguroListView.as_view(), name='seguro-list'),
        path('<str:record_id>/', SeguroDetailView.as_view(), name='seguro-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/itv/', include([
        path('', ITVListView.as_view(), name='itv-list'),
        path('<str:record_id>/', ITVDetailView.as_view(), name='itv-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/soat/', include([
        path('', SOATListView.as_view(), name='soat-list'),
        path('<str:record_id>/', SOATDetailView.as_view(), name='soat-detail'),
    ])),
    path('api/maquinaria/<str:maquinaria_id>/impuestos/', include([
        path('', ImpuestoListView.as_view(), name='impuesto-list'),
        path('<str:record_id>/', ImpuestoDetailView.as_view(), name='impuesto-detail'),
    ])),
]