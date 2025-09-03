# Migración del Campo Memorandum

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad del campo **Memorandum** en el sistema de gestión de usuarios.

### 🔧 Cambios Realizados

#### Frontend (UserManagement.js)
- ✅ Agregada columna "Memorandum" en la tabla de usuarios
- ✅ Campo editable para Administradores y Encargados
- ✅ Campo de solo lectura para el usuario actual
- ✅ Indicador de carga durante actualizaciones
- ✅ Validación y mensajes de feedback

#### Backend (Django)
- ✅ Nueva vista `UsuarioMemorandumUpdateView` para actualizar memorandum
- ✅ Endpoint `PUT /api/usuarios/{id}/memorandum/`
- ✅ Registro automático de fecha en nuevos usuarios
- ✅ Auditoría de cambios de memorandum
- ✅ Comando de migración para usuarios existentes

### 🚀 Instrucciones de Migración

#### 1. Ejecutar Migración para Usuarios Existentes

```bash
# Navegar al directorio del proyecto Django
cd gestion_maquinaria

# Ejecutar el comando de migración
python manage.py add_memorandum_to_existing_users
```

Este comando:
- Busca usuarios que no tienen el campo `Memorandum`
- Asigna la fecha de creación como memorandum (si existe)
- Asigna la fecha actual como memorandum (si no hay fecha de creación)
- Muestra el progreso en consola

#### 2. Verificar la Migración

```bash
# Verificar que el comando se ejecutó correctamente
python manage.py shell
```

En el shell de Django:
```python
from core.mongo_connection import get_collection
from core.models import Usuario

collection = get_collection(Usuario)
usuarios_sin_memorandum = collection.find({"Memorandum": {"$exists": False}})
print(f"Usuarios sin memorandum: {len(list(usuarios_sin_memorandum))}")
```

### 🎯 Funcionalidades Implementadas

#### Para Nuevos Usuarios
- **Registro automático**: Al registrarse, se asigna automáticamente la fecha actual como memorandum
- **Formato**: DD/MM/YYYY (ej: 15/01/2025)

#### Para Usuarios Existentes
- **Edición manual**: Los Administradores y Encargados pueden editar el memorandum
- **Flexibilidad**: Acepta números de memorandum o fechas
- **Auditoría**: Se registra cada cambio en el log de actividades

#### Permisos
- **Administradores**: Pueden editar memorandum de cualquier usuario
- **Encargados**: Pueden editar memorandum de cualquier usuario
- **Usuarios**: Solo pueden ver su propio memorandum (no editable)

### 🔍 Endpoints API

```
PUT /api/usuarios/{id}/memorandum/
```

**Headers requeridos:**
- `X-User-Email`: Email del usuario que realiza la acción
- `Content-Type: application/json`

**Body:**
```json
{
    "Memorandum": "15/01/2025"
}
```

**Respuesta exitosa:**
```json
{
    "_id": "...",
    "Nombre": "Usuario Ejemplo",
    "Email": "usuario@ejemplo.com",
    "Memorandum": "15/01/2025",
    ...
}
```

### 📝 Notas Importantes

1. **Formato de fecha**: Se usa DD/MM/YYYY para consistencia
2. **Usuarios existentes**: Se migran automáticamente con el comando
3. **Auditoría**: Todos los cambios se registran en el sistema de seguimiento
4. **Validación**: Solo Admin/Encargado pueden modificar memorandum
5. **Compatibilidad**: Funciona con usuarios existentes y nuevos

### 🐛 Solución de Problemas

Si encuentras errores:

1. **Verificar conexión MongoDB**: Asegúrate de que MongoDB esté ejecutándose
2. **Permisos**: Verifica que el usuario tenga permisos de Admin/Encargado
3. **Formato de fecha**: Usa DD/MM/YYYY para fechas
4. **Logs**: Revisa los logs de Django para errores específicos

### ✅ Verificación Final

Para verificar que todo funciona:

1. Ejecuta la migración
2. Accede a la interfaz de gestión de usuarios
3. Verifica que la columna "Memorandum" aparezca
4. Intenta editar el memorandum de un usuario
5. Verifica que se registre en el log de actividades
