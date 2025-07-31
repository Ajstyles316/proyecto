# Sistema de Roles y Permisos

## Descripción General

El sistema implementa un modelo de roles jerárquico con 3 niveles de acceso:

1. **Admin** - Administrador del sistema
2. **Encargado** - Encargado de activos
3. **Técnico** - Técnico operativo

## Roles y Permisos

### 1. Admin
- **Acceso completo** a todas las funcionalidades del sistema
- **Gestión de roles y permisos**: Solo el admin puede asignar roles y gestionar permisos
- **Restricciones específicas**:
  - No puede crear, editar o eliminar maquinaria
  - No puede crear o editar depreciaciones
  - Solo puede ver resultados y reportes
- **Funcionalidades principales**:
  - Dashboard completo con todas las métricas
  - Gestión de usuarios (roles y permisos)
  - Visualización de reportes exportados
  - Seguimiento de actividades del sistema

### 2. Encargado
- **Acceso completo** a operaciones de maquinaria y gestión
- **Restricciones**:
  - No puede acceder a la gestión de roles y permisos
  - No puede cambiar roles de otros usuarios
- **Funcionalidades principales**:
  - Crear, editar y eliminar maquinaria
  - Gestionar todas las secciones (control, mantenimiento, seguros, etc.)
  - Realizar depreciaciones
  - Crear pronósticos de mantenimiento
  - Exportar reportes
  - Reactivar registros desactivados

### 3. Técnico
- **Acceso limitado** basado en permisos granulares
- **Funcionalidades por defecto**:
  - Registrar datos de maquinaria
  - Realizar depreciaciones
  - Hacer pronósticos de mantenimiento
  - Exportar reportes
- **Restricciones**:
  - No puede desactivar o eliminar maquinaria sin autorización del encargado
  - Acceso controlado por permisos granulares por módulo

## Usuario Admin por Defecto

Al iniciar el sistema por primera vez, se crea automáticamente un usuario administrador:

- **Email**: admin123@gmail.com
- **Contraseña**: Aleatorio12$
- **Cargo**: admin
- **Permisos**: Completos según el rol de admin

## Estructura de Permisos Granulares

Para usuarios técnicos, los permisos se manejan por módulo con las siguientes acciones:

```javascript
{
  "Dashboard": { "ver": true, "crear": false, "editar": false, "eliminar": false },
  "Maquinaria": { "ver": true, "crear": true, "editar": true, "eliminar": false },
  "Depreciaciones": { "ver": true, "crear": true, "editar": true, "eliminar": false },
  "Pronóstico": { "ver": true, "crear": true, "editar": true, "eliminar": false },
  "Reportes": { "ver": true, "crear": true, "editar": true, "eliminar": false }
}
```

## Implementación Técnica

### Backend (Django)

1. **Función `check_user_permissions()`**: Centraliza la validación de permisos
2. **Función `create_default_admin()`**: Crea el usuario admin por defecto
3. **Validaciones en vistas**: Cada endpoint verifica permisos antes de ejecutar acciones

### Frontend (React)

1. **Contexto de usuario**: Maneja el estado del usuario y sus permisos
2. **Hooks personalizados**: 
   - `useCanManageRoles()`: Verifica si puede gestionar roles
   - `useCanEditMaquinaria()`: Verifica permisos de edición de maquinaria
3. **Menú dinámico**: Se adapta según el rol del usuario
4. **Validaciones en componentes**: Previene acciones no autorizadas

## Migración de Usuarios Existentes

- Los usuarios existentes mantienen sus permisos actuales
- Solo se agregan las nuevas restricciones para el rol admin
- Los encargados existentes mantienen su funcionalidad completa
- Los técnicos mantienen sus permisos granulares

## Seguridad

- Todas las validaciones se realizan tanto en frontend como backend
- Los permisos se verifican en cada endpoint
- Se registra auditoría de cambios de roles y permisos
- Las contraseñas se almacenan hasheadas con bcrypt

## Consideraciones de Uso

1. **Cambio de roles**: Solo el admin puede cambiar roles de otros usuarios
2. **Gestión de permisos**: Solo el admin puede modificar permisos granulares
3. **Restricciones de admin**: El admin tiene acceso de solo lectura a maquinaria y depreciaciones
4. **Autorizaciones**: Los técnicos requieren autorización del encargado para ciertas acciones 