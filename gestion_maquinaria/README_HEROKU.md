# Despliegue en Heroku - Gestión de Maquinaria Backend

## Archivos creados para Heroku:

1. **Procfile** - Define cómo ejecutar la aplicación
2. **requirements.txt** - Actualizado con gunicorn
3. **runtime.txt** - Especifica la versión de Python
4. **app.json** - Configuración de la aplicación
5. **settings.py** - Actualizado para producción

## Pasos para desplegar en Heroku:

### 1. Instalar Heroku CLI
```bash
# Descargar desde: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login en Heroku
```bash
heroku login
```

### 3. Crear aplicación en Heroku
```bash
cd gestion_maquinaria
heroku create gestion-maquinaria-backend
```

### 4. Configurar variables de entorno
```bash
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
```

### 5. Desplegar
```bash
git add .
git commit -m "Configuración para Heroku"
git push heroku main
```

### 6. Ejecutar migraciones
```bash
heroku run python manage.py migrate
```

### 7. Crear superusuario (opcional)
```bash
heroku run python manage.py createsuperuser
```

## Verificar despliegue:
- URL: https://gestion-maquinaria-backend.herokuapp.com/api/
- Debería mostrar la API root con los endpoints disponibles

## Solución de problemas:
- Ver logs: `heroku logs --tail`
- Reiniciar app: `heroku restart`
- Verificar variables: `heroku config`
