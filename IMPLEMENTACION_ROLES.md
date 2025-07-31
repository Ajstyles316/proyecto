# Implementación del Sistema de Roles

## Cambios Realizados

### Backend (Django)

#### 1. Nuevas Funciones en `views.py`

**`create_default_admin()`**
- Crea automáticamente un usuario admin por defecto
- Se ejecuta en cada login para asegurar que existe un admin
- Credenciales: admin123@gmail.com / Aleatorio12$

**`check_user_permissions()`**
- Función centralizada para validar permisos
- Soporta validación por rol y permisos granulares
- Maneja las restricciones específicas de cada rol
- **CORREGIDO**: El admin tiene acceso completo excepto modificar maquinaria y depreciaciones

#### 2. Modificaciones en Vistas

**MaquinariaListView y MaquinariaDetailView**
- Agregadas validaciones de permisos en POST, PUT, DELETE, PATCH
- Admin no puede crear/editar/eliminar maquinaria
- Encargado y técnico tienen permisos según su rol

**DepreciacionesListView**
- Agregada validación de permisos en POST
- Admin no puede crear depreciaciones

**UsuarioListView** ⚠️ **CORREGIDO**
- **ANTES**: Solo encargado podía ver lista de usuarios
- **AHORA**: Solo admin puede ver lista de usuarios
- Modificada validación para usar `check_user_permissions(user, required_role='admin')`

**UsuarioCargoUpdateView**
- Modificada para que solo el admin pueda cambiar roles
- Validación de cargos válidos (admin, encargado, tecnico)

**UsuarioPermisoUpdateView** ⚠️ **CORREGIDO**
- **ANTES**: Solo encargado podía cambiar permisos
- **AHORA**: Solo admin puede cambiar permisos
- Modificada validación para usar `check_user_permissions(user, required_role='admin')`

**UsuarioPermisosUpdateView**
- Modificada para que solo el admin pueda gestionar permisos

**UsuarioDeleteView** ⚠️ **CORREGIDO**
- **ANTES**: Solo encargado podía desactivar/reactivar usuarios
- **AHORA**: Solo admin puede desactivar/reactivar usuarios
- Modificada validación para usar `check_user_permissions(user, required_role='admin')`

**LoginView**
- Agregada llamada a `create_default_admin()` al inicio

### Frontend (React)

#### 1. Modificaciones en `UserManagement.js`

- Agregado "Admin" a la lista de cargos disponibles
- Validaciones en `handleCargoChange()` para que solo admin pueda cambiar roles
- Validaciones en `handleGuardarPermisos()` para que solo admin pueda gestionar permisos

#### 2. Modificaciones en `MenuItems.js`

- Cambiado `onlyEncargado` por `onlyAdmin` en "Permisos y Roles"
- Actualizada función `getMenuItems()` para manejar los 3 roles
- Admin: acceso completo
- Encargado: acceso completo excepto gestión de roles
- Técnico: acceso por permisos granulares

#### 3. Nuevos Hooks en `UserContext.jsx`

**`useCanManageRoles()`**
- Verifica si el usuario puede gestionar roles (solo admin)

**`useCanEditMaquinaria()`**
- Verifica si el usuario puede editar maquinaria
- Admin: no puede editar
- Encargado: puede editar
- Técnico: según permisos granulares

## Problema Resuelto: "Acceso Denegado" para Admin

### Problema Identificado
El admin recibía "Acceso denegado" al intentar acceder a "Permisos y Roles" porque las vistas de gestión de usuarios estaban configuradas para permitir acceso solo a encargados.

### Solución Implementada
1. **Corregida función `check_user_permissions()`**: Ahora el admin tiene acceso completo excepto las restricciones específicas
2. **Modificadas vistas de gestión de usuarios**: Ahora solo el admin puede acceder a estas funcionalidades
3. **Actualizada lógica de permisos**: El admin no necesita permisos granulares para funcionalidades administrativas

### Cambios Específicos
- `UsuarioListView`: Solo admin puede ver lista de usuarios
- `UsuarioCargoUpdateView`: Solo admin puede cambiar roles
- `UsuarioPermisoUpdateView`: Solo admin puede cambiar permisos
- `UsuarioDeleteView`: Solo admin puede desactivar/reactivar usuarios
- `UsuarioPermisosUpdateView`: Solo admin puede gestionar permisos granulares

## Cómo Probar la Implementación

### 1. Iniciar el Sistema

```bash
# Backend
cd gestion_maquinaria
python manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm run dev
```

### 2. Login como Admin

- Ir a http://localhost:5173/login
- Usar credenciales: admin123@gmail.com / Aleatorio12$
- Verificar que se crea el usuario admin automáticamente

### 3. Probar Acceso del Admin

**✅ Debe funcionar:**
- Ver lista de usuarios
- Cambiar roles de usuarios
- Gestionar permisos granulares
- Ver maquinaria (solo lectura)
- Ver depreciaciones (solo lectura)
- Ver reportes y dashboard

**❌ Debe fallar:**
- Crear/editar/eliminar maquinaria
- Crear/editar depreciaciones

### 4. Probar con Otros Roles

**Crear usuario Encargado:**
- Login como admin
- Ir a "Permisos y Roles"
- Crear usuario con cargo "Encargado"
- Login con el nuevo usuario
- Verificar que puede gestionar maquinaria pero no roles

**Crear usuario Técnico:**
- Login como admin
- Crear usuario con cargo "Técnico"
- Asignar permisos granulares
- Login con el nuevo usuario
- Verificar que solo ve las funcionalidades permitidas

### 5. Ejecutar Scripts de Pruebas

```bash
# Prueba rápida del admin
python test_admin_access.py

# Prueba completa del sistema
python test_roles.py
```

## Estructura de Permisos por Defecto

### Admin
```javascript
{
  "Dashboard": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "Maquinaria": {"ver": true, "crear": false, "editar": false, "eliminar": false},
  "Depreciaciones": {"ver": true, "crear": false, "editar": false, "eliminar": false},
  "Pronóstico": {"ver": true, "crear": false, "editar": false, "eliminar": false},
  "Reportes": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "Usuarios": {"ver": true, "crear": true, "editar": true, "eliminar": true}
}
```

### Técnico (ejemplo)
```javascript
{
  "Dashboard": {"ver": true, "crear": false, "editar": false, "eliminar": false},
  "Maquinaria": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "Depreciaciones": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "Pronóstico": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "Reportes": {"ver": true, "crear": true, "editar": true, "eliminar": false}
}
```

## Consideraciones Importantes

1. **Migración**: Los usuarios existentes mantienen sus permisos actuales
2. **Seguridad**: Todas las validaciones se realizan tanto en frontend como backend
3. **Auditoría**: Se registran todos los cambios de roles y permisos
4. **Flexibilidad**: El sistema permite ajustar permisos granulares para técnicos
5. **Admin**: Tiene acceso completo excepto modificar maquinaria y depreciaciones

## Archivos Modificados

### Backend
- `gestion_maquinaria/core/views.py`

### Frontend
- `frontend/src/views/user-profile/UserManagement.js`
- `frontend/src/layouts/full/sidebar/MenuItems.js`
- `frontend/src/components/UserContext.jsx`

### Documentación
- `SISTEMA_ROLES.md`
- `IMPLEMENTACION_ROLES.md`
- `test_roles.py`
- `test_admin_access.py` ⭐ **NUEVO** 