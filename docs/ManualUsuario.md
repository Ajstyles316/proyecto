# Manual de Usuario

## 1. Descripción General
Sistema de gestión de maquinaria con módulos de Maquinaria, Depreciaciones, Activos, Pronóstico de mantenimiento (ML) y Reportes. Incluye autenticación con roles (Admin, Encargado, Técnico) y auditoría básica. Frontend en React (Vite) y backend en Django con base de datos MongoDB/SQLite.

## 2. Acceso al Sistema
- URL de frontend: http://localhost:5173
- URL de API: http://localhost:8000/api/
- Usuario admin por defecto: Email: admin123@gmail.com, Contraseña: Aleatorio12$

## 3. Inicio de Sesión y Cierre de Sesión
- Inicie sesión desde `/login` con Email y Contraseña.
- Para cerrar sesión use el menú lateral opción “Cerrar Sesión”. El sistema registra el evento y limpia su sesión local.

## 4. Roles y Permisos
- Admin: Acceso total a vistas, pero con restricciones de edición en Maquinaria y Depreciaciones (solo lectura). Puede gestionar usuarios, roles y permisos.
- Encargado: Gestión completa de Maquinaria, Depreciaciones, Activos, Pronóstico y Reportes. No puede gestionar roles.
- Técnico: Acceso limitado según permisos por módulo (ver/crear/editar/eliminar) otorgados por el Admin.

## 5. Menú Principal
- Dashboard: Resumen de métricas.
- Maquinaria: Gestión del inventario principal.
- Depreciaciones: Cálculo y consulta de depreciaciones por maquinaria.
- Activos: Catálogo base para reglas y parámetros.
- Pronóstico: Predicción de mantenimiento y carga masiva vía Excel.
- Reportes: Exportaciones y visualizaciones.
- Permisos y Roles: Gestión de usuarios (solo Admin).
- Cerrar Sesión.

## 6. Módulo Maquinaria
- Listar: Tabla con búsqueda y filtros.
- Crear/Editar/Eliminar: Según permisos. Campos principales: gestión, placa, detalle, unidad, tipo, marca, modelo, fechas.
- Submódulos por maquinaria:
  - Control
  - Asignación
  - Mantenimiento
  - Seguros
  - ITV
  - SOAT
  - Impuestos

## 7. Depreciaciones
- Crear depreciación: Ingresar bien de uso, costo, fecha de compra, método y vida útil.
- Ver detalle por años: valores anuales, acumulados y valor en libros.
- Editar/Desactivar/Reactivar según permisos.

## 8. Activos
- Consulta del catálogo de activos (vida útil, coeficiente, etc.).

## 9. Pronóstico de Mantenimiento
- Crear pronóstico individual:
  - Campos: placa, fecha_asig (YYYY-MM-DD), horas_op, recorrido.
  - El sistema calcula: tipo (Preventivo/Correctivo), riesgo, probabilidad, fechas de mantenimiento y recordatorio, urgencia y recomendaciones.
- Carga masiva desde Excel:
  - Botón “Cargar Excel”. Acepta .xlsx/.xls con columnas: placa, fecha_asig, horas_op, recorrido.
  - Muestra resumen: procesados, exitosos, errores.

## 10. Reportes
- Exportación a CSV/XLSX/PDF en secciones habilitadas.

## 11. Gestión de Usuarios (solo Admin)
- Ver usuarios: nombre, email, cargo, permisos, unidad.
- Cambiar cargo: Encargado/Técnico.
- Editar permisos: por módulo con acciones ver/crear/editar/eliminar.
- Desactivar/Reactivar usuarios con justificación.
- Auditoría: Registro de actividad con filtros por usuario, módulo y rango de fechas.

## 12. Buenas Prácticas de Uso
- Mantener datos completos y fechas en formato YYYY-MM-DD.
- Revisar las alertas de urgencia en Pronóstico.
- Usar filtros de auditoría para verificar cambios recientes.

## 13. Soporte y Errores Comunes
- “Acceso denegado”: Verifique su rol/permisos o inicie sesión nuevamente.
- “Formato de fecha inválido”: Asegure formato YYYY-MM-DD.
- “Campos requeridos”: Complete los campos marcados como obligatorios.
- Para problemas de conexión, verifique que el backend esté activo en http://localhost:8000 y el frontend en http://localhost:5173.

## 14. Glosario Rápido
- Preventivo: Mantenimiento programado para prevenir fallas.
- Correctivo: Mantenimiento para corregir fallas existentes.
- Urgencia: Nivel de prioridad (CRÍTICA, ALTA, MODERADA, NORMAL, MÍNIMA).