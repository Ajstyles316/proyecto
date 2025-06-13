from django.contrib import admin
from django.urls import path, include
from core.views import maquinaria_list, maquinaria_detail, maquinaria_options

from core.views import RegistroView, LoginView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('registro/', RegistroView.as_view(), name='registro'),  # ← Sin /api/
    path('login/', LoginView.as_view(), name='login'),          # ← Sin /api/
    path('api/', include('core.urls')),
    path('api/maquinaria/', maquinaria_list),
    path('api/maquinaria/<str:id>/', maquinaria_detail),
    path('api/maquinaria/options/', maquinaria_options),
]