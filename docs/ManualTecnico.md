# Manual Técnico

## 1. Arquitectura
- Frontend: React 19 + Vite 6, Material UI, rutas en `frontend/src/routes`, contexto de usuario en `frontend/src/components/UserContext.jsx` y menú dinámico en `frontend/src/layouts/full/sidebar/MenuItems.js`.
- Backend: Django 5.2, Django REST Framework, CORS, endpoints en `gestion_maquinaria/gestion_maquinaria/urls.py` y `gestion_maquinaria/core/urls.py`.
- Datos: SQLite para Django (usuarios, sesiones) y MongoDB para colecciones funcionales (`maquinaria`, `depreciaciones`, `pronostico`, etc.). Conexión centralizada en `core/mongo_connection.py`.
- ML: Módulo de pronóstico y archivos del modelo en `gestion_maquinaria/pronostico-v1/` (XGBoost, scaler, label encoder). API expuesta en `/api/pronostico/`.

## 2. Entornos y Configuración
- Variables (.env en `gestion_maquinaria/`):
  - MONGO_URI
  - MONGO_DB_NAME (por defecto: activos)
  - MONGO_URI_GESTION (opcional para activos)
- Ajustes relevantes (`gestion_maquinaria/settings.py`):
  - CORS_ORIGIN_ALLOW_ALL=True (desarrollo)
  - CORS_ALLOWED_ORIGINS=["http://localhost:5173"]
  - DB SQLite `BASE_DIR/db.sqlite3`
  - Conexión Mongo: `MONGO_URI`, `MONGO_DB_NAME`
  - Email SMTP: `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (desarrollo)

## 3. Instalación
- Backend (Python 3.11+ recomendado):
  - `pip install -r requirements.txt`
  - `cd gestion_maquinaria && python manage.py runserver`
- Frontend (Node 18+):
  - `cd frontend && npm install && npm run dev`
- MongoDB: Disponible en `MONGO_URI` (local o remoto). Crear DB y colecciones al vuelo.

## 4. Estructura de Carpetas
- `gestion_maquinaria/gestion_maquinaria`: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`.
- `gestion_maquinaria/core`: `views.py` (endpoints), `serializers.py` (validación), `models.py` (nombres de colecciones), `mongo_connection.py`.
- `gestion_maquinaria/pronostico-v1`: artefactos del modelo ML.
- `frontend/src`: `routes`, `layouts`, `components`, `views`, `theme`.
- `docs/`: manuales.

## 5. Endpoints Principales
- Autenticación y usuarios:
  - POST `/login/`, POST `/logout/`, POST `/registro/`, POST `/registro/verificar/`, POST `/registro/reenviar/`
  - GET `/api/usuarios/` (admin), PUT `/api/usuarios/{id}/cargo/`, PUT `/api/usuarios/{id}/permiso/`, PUT `/api/usuarios/{id}/permisos/`
  - DELETE `/api/usuarios/{id}/` (desactivar), PATCH `/api/usuarios/{id}/` (reactivar), GET `/seguimiento/`
- Maquinaria y secciones:
  - GET/POST `/api/maquinaria/`, GET/PUT/PATCH/DELETE `/api/maquinaria/{id}/`
  - Subrutas: `control/`, `asignacion/`, `mantenimiento/`, `seguros/`, `itv/`, `soat/`, `impuestos/`
- Depreciaciones:
  - GET `/api/depreciaciones/`, GET `/api/depreciaciones/{maquinaria_id}/`, GET/PUT/PATCH/DELETE `/api/maquinaria/{maquinaria_id}/depreciaciones/{record_id}/`
- Activos/Utilidades:
  - GET `/api/activos/`, `api/maquinarias_con_depreciacion/`, `api/maquinarias_con_depreciacion/buscar/`
- Pronóstico de mantenimiento:
  - POST `/api/pronostico/` (predict y persist)
  - GET `/api/pronostico/summary/`
  - POST `/api/pronostico/excel-upload/` (multipart/form-data: excel_file)
- Utilidad:
  - GET `/api/test/`, GET `/api/registros-desactivados/`, GET `/api/maquinaria/{maquinaria_id}/desactivados/`

Nota: Prefijo `/api/` se cubre tanto en `gestion_maquinaria/urls.py` como en `core/urls.py`.

## 6. Modelado de Datos (Mongo)
- Colecciones definidas en `core/models.py` mediante `collection_name`:
  - `maquinaria`, `historial_control`, `acta_asignacion`, `mantenimiento`, `seguro`, `itv`, `soat`, `impuesto`, `depreciaciones`, `activos`, `pronostico`, `usuarios`, `seguimiento`.
- Validaciones DRF en `serializers.py` incluyen conversión de `ObjectId`, fechas `YYYY-MM-DD`, y estructuras anidadas para depreciaciones.

## 7. Seguridad y Roles
- Middleware CORS habilitado.
- Autorización: encabezado `X-User-Email` para identificar al usuario en endpoints protegidos.
- Roles: Admin, Encargado, Técnico. Función central de validación mencionada en documentación: `check_user_permissions()`.
- Usuario admin por defecto creado en login: `create_default_admin()`.
- Restricciones: Admin no modifica Maquinaria ni Depreciaciones.

## 8. Pronóstico de Mantenimiento (ML)
- Modelo: XGBoost Classifier + StandardScaler, etiquetas con LabelEncoder.
- Entradas API: `placa`, `fecha_asig`, `horas_op`, `recorrido`.
- Salida: tipo, probabilidad, riesgo final (combinado por probabilidad y reglas), fechas calculadas, urgencia, recomendaciones, y persistencia del registro en colección `pronostico`.
- Carga Excel: normaliza nombres de columnas, valida tipos, procesa por filas y entrega resumen.

## 9. Frontend
- Proxy Vite: `http://127.0.0.1:8000`.
- Menú dinámico según rol en `MenuItems.js` (filtro por `onlyAdmin` y permisos granulares).
- Contexto de usuario persistido en `localStorage` (`UserContext.jsx`).
- Gestión de usuarios en `views/user-profile/UserManagement.js` con auditoría y modales.

## 10. Puesta en Marcha Local
- Terminal 1 (backend):
  - `cd gestion_maquinaria`
  - Crear `.env` con `MONGO_URI` y `MONGO_DB_NAME`
  - `python manage.py runserver`
- Terminal 2 (frontend):
  - `cd frontend && npm install && npm run dev`
- Verificar:
  - Frontend: `http://localhost:5173`
  - API root: `http://localhost:8000/api/`
  - Login admin por defecto.

## 11. Pruebas
- Scripts en raíz:
  - `python test_modelo_ia.py` (modelo directo)
  - `python test_api_modelo.py` (API activa requerida)
  - `python test_with_server.py` (integración)
- Diagnóstico admin: `python debug_admin_access.py`.

## 12. Despliegue y Notas
- Ajustar `DEBUG=False`, `ALLOWED_HOSTS`, CORS, variables SMTP y claves reCAPTCHA.
- Configurar Mongo gestionado y credenciales seguras.
- Servir frontend compilado (`npm run build`) desde hosting estático o detrás de reverse proxy.

## 13. Mantenimiento y Logs
- Revisar logs de Django y seguimiento (auditoría) en la colección `seguimiento`.
- Validar consistencia de `ObjectId` al hacer operaciones CRUD por secciones.
- Monitorear tiempos de respuesta de `/api/pronostico/` y tamaños de carga Excel.

## 14. Seguridad Adicional (Recomendado)
- Reemplazar autenticación por sesión/cookie/JWT.
- Hash de contraseñas (bcrypt ya incluido en requirements).
- Mover credenciales de email y claves a variables de entorno.
- Validación de CAPTCHA real en backend.