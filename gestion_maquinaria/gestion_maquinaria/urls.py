from django.contrib import admin
from django.urls import path, include
from core.views import RegistroView, LoginView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('registro/', RegistroView.as_view(), name='registro'),  # ← Sin /api/
    path('login/', LoginView.as_view(), name='login'),          # ← Sin /api/
    path('api/', include('core.urls')),
]