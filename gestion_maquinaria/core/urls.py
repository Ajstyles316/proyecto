from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView,
    RegistroView,
    LoginView,
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
]