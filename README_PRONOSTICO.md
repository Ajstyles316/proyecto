# Sistema de Pronóstico de Mantenimiento

## Descripción General

El sistema de pronóstico de mantenimiento utiliza un modelo de Machine Learning (XGBoost) para predecir el tipo de mantenimiento necesario para maquinaria basándose en tres parámetros principales:

- **Días desde el último mantenimiento**: Tiempo transcurrido desde la última intervención
- **Recorrido**: Kilómetros acumulados desde el último mantenimiento
- **Horas de operación**: Horas de uso desde el último mantenimiento

## Parámetros de Entrada

| Parámetro | Descripción | Unidad |
|-----------|-------------|--------|
| `dias` | Días transcurridos desde el último mantenimiento | Días |
| `recorrido` | Kilómetros recorridos desde el último mantenimiento | Km |
| `horas_op` | Horas de operación desde el último mantenimiento | Horas |

## Tipos de Predicción

El modelo puede predecir dos tipos principales de mantenimiento:

1. **Mantenimiento Preventivo**: Mantenimiento programado para prevenir fallas
2. **Mantenimiento Correctivo**: Mantenimiento urgente para reparar fallas existentes

## Niveles de Riesgo

El sistema clasifica el riesgo en tres niveles usando una lógica combinada:

### Análisis por Probabilidad del Modelo
- **BAJO**: Probabilidad < 60%
- **MEDIO**: Probabilidad entre 60% y 80%
- **ALTO**: Probabilidad > 80%

### Análisis por Valores de Entrada
- **ALTO**: 
  - Días desde mantenimiento > 90
  - Recorrido > 10,000 km
  - Horas de operación > 2,000
  - Días > 60 Y recorrido > 8,000 km
  - Días > 45 Y horas > 1,500

- **MEDIO**:
  - Días desde mantenimiento > 60
  - Recorrido > 7,000 km
  - Horas de operación > 1,200
  - Días > 30 Y recorrido > 5,000 km

- **BAJO**: Valores por debajo de los umbrales anteriores

### Riesgo Final
El riesgo final se determina combinando ambos análisis: si cualquiera de los dos análisis indica "ALTO", el riesgo final será "ALTO".

## Cálculo de Fechas de Mantenimiento

### Mantenimiento Preventivo
- **Días > 60**: 7 días hasta mantenimiento
- **Días > 30**: 15 días hasta mantenimiento
- **Días ≤ 30**: 30 días hasta mantenimiento
- **Ajustes por recorrido**:
  - Recorrido > 8,000 km: máximo 7 días
  - Recorrido > 5,000 km: máximo 15 días

### Mantenimiento Correctivo
- **Días > 100**: 1 día hasta mantenimiento (muy urgente)
- **Días > 60**: 3 días hasta mantenimiento (urgente)
- **Días ≤ 60**: 7 días hasta mantenimiento

## Niveles de Urgencia

El sistema determina automáticamente el nivel de urgencia basado en múltiples parámetros:

### CRÍTICA (Rojo)
- Días desde mantenimiento > 120
- Recorrido > 15,000 km
- Horas de operación > 3,000
- Días hasta mantenimiento ≤ 1

### ALTA (Naranja oscuro)
- Días desde mantenimiento > 90
- Recorrido > 12,000 km
- Horas de operación > 2,500
- Días hasta mantenimiento ≤ 3

### MODERADA (Naranja)
- Días desde mantenimiento > 60
- Recorrido > 9,000 km
- Horas de operación > 2,000
- Días hasta mantenimiento ≤ 7

### NORMAL (Verde)
- Días desde mantenimiento > 30
- Recorrido > 6,000 km
- Horas de operación > 1,500
- Días hasta mantenimiento ≤ 15

### MÍNIMA (Verde claro)
- Todos los demás casos

## Estructura de Datos en la Base de Datos

```json
{
  "placa": "ABC123",
  "dias": 45,
  "recorrido": 5000,
  "horas_op": 800,
  "resultado": "Mantenimiento Preventivo",
  "riesgo": "MEDIO",
  "probabilidad": 75.5,
  "fecha_prediccion": "2024-01-15",
  "fecha_mantenimiento": "2024-01-30",
  "fecha_recordatorio": "2024-01-27",
  "dias_hasta_mantenimiento": 15,
  "urgencia": "MEDIA",
  "recomendaciones": [...],
  "creado_en": "2024-01-15T10:30:00Z"
}
```

## Recomendaciones por Tipo de Mantenimiento

### Mantenimiento Preventivo
- Revisión periódica del equipo
- Inspección visual de componentes
- Verificación de ruidos anómalos, vibraciones o fugas
- Lubricación regular de partes móviles
- Cambio de filtros y fluidos según cronograma
- Calibraciones y ajustes: sensores, frenos, presión hidráulica
- Monitoreo de horas de uso y recorrido
- Capacitación del operador y revisión diaria básica
- Checklist preventiva y documentación en cada revisión

### Mantenimiento Correctivo
- Diagnóstico preciso: uso de herramientas de diagnóstico o software
- Inspección técnica detallada por un mecánico especializado
- Reemplazo de partes dañadas: motores, correas, rodamientos, etc.
- Reparación estructural: soldaduras, enderezado de chasis, refuerzos
- Análisis de causa raíz: documentar para evitar que se repita
- Actualización del historial de la máquina
- Medidas de seguridad post-reparación: pruebas antes de volver a operar

## Uso de la API

### Endpoint de Predicción
```
POST /api/pronostico/
```

**Body:**
```json
{
  "placa": "ABC123",
  "dias": 45,
  "recorrido": 5000,
  "horas_op": 800
}
```

**Response:**
```json
{
  "resultado": "Mantenimiento Preventivo",
  "riesgo": "MEDIO",
  "probabilidad": 75.5,
  "fecha_prediccion": "2024-01-15",
  "fecha_mantenimiento": "2024-01-30",
  "fecha_recordatorio": "2024-01-27",
  "dias_hasta_mantenimiento": 15,
  "urgencia": "MEDIA",
  "recomendaciones": [...],
  "recorrido": 5500
}
```

### Endpoint de Consulta
```
GET /api/pronostico/
```

Retorna todos los pronósticos almacenados en la base de datos.

## Notas Técnicas

- **Formato de fechas**: Todas las fechas se almacenan y muestran en formato YYYY-MM-DD (sin componente de tiempo)
- **Fechas de mantenimiento**: Se generan dinámicamente basadas en el tipo de mantenimiento y parámetros de entrada
- **Modelo ML**: XGBoost Classifier con StandardScaler para normalización
- **Base de datos**: MongoDB (colección "pronostico")
- **Escalabilidad**: El modelo se recalcula automáticamente si no existe o hay errores
- **Columna de urgencia**: Se muestra en la tabla de historial con colores distintivos para cada nivel

## Carga Masiva de Pronósticos (Excel)

### Funcionalidad
El sistema permite cargar múltiples pronósticos de mantenimiento desde un archivo Excel, facilitando el procesamiento masivo de datos.

### Formato del Archivo Excel
El archivo Excel debe contener las siguientes columnas obligatorias:

| Columna | Descripción | Tipo | Ejemplo |
|---------|-------------|------|---------|
| `placa` | Identificador de la maquinaria | Texto | "ABC123" |
| `fecha_asig` | Fecha de asignación | Fecha (YYYY-MM-DD) | "2024-01-15" |
| `horas_op` | Horas de operación | Número | 1500 |
| `recorrido` | Kilómetros recorridos | Número | 25000 |

#### Formatos Soportados
- **Extensiones**: .xlsx, .xls
- **Nombres de columnas**: Se normalizan automáticamente (espacios eliminados, minúsculas)
- **Hojas**: Se lee la primera hoja del archivo Excel

### Ejemplo de Archivo Excel
El archivo Excel debe contener las siguientes columnas en la primera hoja:

| placa | fecha_asig | horas_op | recorrido |
|-------|------------|----------|-----------|
| ABC123 | 2024-01-15 | 1500 | 25000 |
| XYZ789 | 2024-02-20 | 2200 | 35000 |
| DEF456 | 2024-03-10 | 1800 | 28000 |

### Proceso de Carga
1. **Selección de archivo**: El usuario selecciona un archivo Excel válido (.xlsx o .xls)
2. **Validación**: El sistema verifica que el archivo contenga las columnas requeridas
3. **Procesamiento**: Para cada fila del Excel:
   - Se genera un pronóstico usando el modelo de ML
   - Se calculan las fechas de mantenimiento y urgencia
   - Se guarda en la base de datos
4. **Resultados**: Se muestra un resumen con:
   - Total de filas procesadas
   - Número de pronósticos exitosos
   - Número de errores
   - Detalles por fila

### Endpoint API
```
POST /api/pronostico/excel-upload/
Content-Type: multipart/form-data
Body: excel_file (archivo Excel)
```

### Respuesta de la API
```json
{
  "mensaje": "Procesamiento completado. 10 pronósticos procesados exitosamente, 0 errores.",
  "resumen": {
    "total_filas": 10,
    "exitosos": 10,
    "errores": 0
  },
  "resultados": [
    {
      "fila": 1,
      "placa": "ABC123",
      "estado": "creado",
      "resultado": "Preventivo"
    }
  ]
}
```

## Interfaz de Usuario

### Botones de Acción
- **Cargar Excel**: Permite seleccionar y cargar un archivo Excel

### Validaciones
- **Tipo de archivo**: Solo se aceptan archivos Excel (.xlsx, .xls)
- **Columnas requeridas**: Debe contener todas las columnas obligatorias
- **Formato de datos**: Validación de tipos de datos por columna
- **Duplicados**: Si existe un pronóstico para la misma placa y fecha, se actualiza

### Manejo de Errores
- **Errores de archivo**: Mensajes claros sobre problemas de formato Excel
- **Errores de datos**: Información específica sobre filas con problemas
- **Errores de conexión**: Manejo de problemas de red
- **Logs**: Registro detallado de errores para debugging

## Cambios Recientes

### ✅ Problemas Solucionados:
1. **Formato de fechas**: Eliminado el componente de tiempo (T19:30:00) - ahora solo muestra YYYY-MM-DD
2. **Fechas de mantenimiento**: Ahora muestra solo las fechas generadas dinámicamente por el sistema (fecha_mantenimiento, fecha_recordatorio, fecha_sugerida)
3. **Lógica de riesgo mejorada**: Considera tanto la probabilidad del modelo como los valores de entrada para determinar el riesgo
4. **Información de debug**: Agregado logging detallado del análisis de riesgo en la consola
5. **Eliminación de "fechas futuras"**: Removida la estructura anidada de fechas_futuras del backend y base de datos
6. **Nueva columna de urgencia**: Agregada columna con 5 niveles de urgencia (CRÍTICA, ALTA, MODERADA, NORMAL, MÍNIMA) con colores distintivos
7. **Eliminación del calendario**: Removido el icono de calendario y popover de la tabla de historial
8. **Carga masiva Excel**: Implementada funcionalidad para cargar múltiples pronósticos desde archivo Excel
     - Nuevo endpoint API: `/api/pronostico/excel-upload/`
     - Componente de interfaz con diálogo de carga y validaciones
     - Procesamiento masivo con resumen de resultados
     - Manejo de errores y duplicados
     - Actualización automática de datos después de la carga
 