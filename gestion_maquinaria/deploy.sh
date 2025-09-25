#!/bin/bash
# Script para desplegar automáticamente en Heroku

echo "🚀 Iniciando despliegue en Heroku..."

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: No se encontró manage.py. Ejecutar desde el directorio gestion_maquinaria/"
    exit 1
fi

# Verificar que Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI no está instalado"
    echo "📥 Descargar desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Verificar login en Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Iniciando sesión en Heroku..."
    heroku login
fi

# Crear aplicación si no existe
if ! heroku apps:info gestion-maquinaria-backend &> /dev/null; then
    echo "📱 Creando aplicación en Heroku..."
    heroku create gestion-maquinaria-backend
else
    echo "✅ Aplicación ya existe: gestion-maquinaria-backend"
fi

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

# Desplegar
echo "📦 Desplegando aplicación..."
git add .
git commit -m "Deploy to Heroku - $(date)"
git push heroku main

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
heroku run python manage.py migrate

echo "✅ Despliegue completado!"
echo "🌐 URL: https://gestion-maquinaria-backend.herokuapp.com/api/"
echo "📊 Ver logs: heroku logs --tail"
