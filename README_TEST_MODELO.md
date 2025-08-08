# Scripts de Prueba del Modelo de IA

Este directorio contiene scripts para verificar y probar el modelo de IA de pronóstico de mantenimiento.

## Archivos Incluidos

### 1. `test_modelo_ia.py` - Script Principal (Modelo Directo)
**Descripción:** Script que prueba el modelo de IA directamente, sin usar la API.

**Características:**
- Verifica archivos del modelo
- Prueba carga del modelo
- Prueba predicciones con múltiples casos
- Genera reporte resumido
- **Usa campos del modelo:** `dias`, `recorrido`, `horas_op`

**Uso:**
```bash
python test_modelo_ia.py
```

### 2. `test_modelo_rapido.py` - Script Rápido (Modelo Directo)
**Descripción:** Script simple para pruebas rápidas del modelo directo.

**Características:**
- Prueba básica de carga del modelo
- 3 casos de prueba predefinidos
- Reporte resumido
- Ejecución rápida
- **Usa campos del modelo:** `dias`, `recorrido`, `horas_op`

**Uso:**
```bash
python test_modelo_rapido.py
```

### 3. `test_api_modelo.py` - Prueba de API
**Descripción:** Script específico para probar la integración con la API.

**Características:**
- Prueba endpoint de pronóstico
- Mide tiempos de respuesta
- Prueba casos extremos
- Verifica endpoints adicionales
- Genera reporte de API
- **Usa campos de la API:** `placa`, `fecha_asig`, `horas_op`, `recorrido`

**Uso:**
```bash
python test_api_modelo.py
```

## Diferencia entre Scripts

### Scripts de Modelo Directo (`test_modelo_ia.py`, `test_modelo_rapido.py`)
- **Propósito:** Probar el modelo de IA directamente
- **Campos requeridos:**
  - `dias`: Días desde el último mantenimiento
  - `recorrido`: Kilómetros recorridos
  - `horas_op`: Horas de operación
- **Ventaja:** No requiere servidor Django ejecutándose

### Script de API (`test_api_modelo.py`)
- **Propósito:** Probar la integración completa con la API
- **Campos requeridos:**
  - `placa`: Placa de la maquinaria
  - `fecha_asig`: Fecha de asignación (YYYY-MM-DD)
  - `horas_op`: Horas de operación
  - `recorrido`: Kilómetros recorridos
- **Requisito:** Servidor Django debe estar ejecutándose

## Instalación y Configuración

### Prerrequisitos
```bash
# Instalar dependencias
pip install pandas numpy scikit-learn xgboost requests

# O instalar desde requirements.txt
pip install -r requirements.txt
```

### Verificar Estructura
Asegúrate de que exista la siguiente estructura:
```
proyecto-limpio/
├── gestion_maquinaria/
│   └── pronostico-v1/
│       ├── modelo_pronostico.pkl
│       ├── scaler_pronostico.pkl
│       ├── label_encoder.pkl
│       ├── pronostico_maquinaria_1.csv
│       └── pronostico_model.py
├── test_modelo_ia.py
├── test_modelo_rapido.py
└── test_api_modelo.py
```

## Casos de Prueba

### Casos Incluidos en los Scripts

1. **Caso Normal**
   - Días: 30
   - Recorrido: 1,000 km
   - Horas de operación: 150

2. **Caso Alto Riesgo**
   - Días: 120
   - Recorrido: 15,000 km
   - Horas de operación: 3,000

3. **Caso Bajo Riesgo**
   - Días: 10
   - Recorrido: 500 km
   - Horas de operación: 50

## Qué Verifican los Scripts

### 1. Dependencias
- pandas
- numpy
- scikit-learn
- xgboost
- requests (para API)

### 2. Archivos del Modelo
- modelo_pronostico.pkl
- scaler_pronostico.pkl
- label_encoder.pkl
- pronostico_maquinaria_1.csv

### 3. Funcionalidad del Modelo
- Carga del modelo
- Verificación de clases
- Predicciones básicas
- Análisis de riesgo
- Cálculo de probabilidades

### 4. Integración con API
- Endpoint de pronóstico
- Tiempos de respuesta
- Manejo de errores
- Endpoints adicionales

## Interpretación de Resultados

### Éxito
- Los archivos del modelo existen
- El modelo se carga correctamente
- Las predicciones funcionan
- La API responde correctamente

### Advertencias
- Tiempos de respuesta altos (>5s)
- Valores nulos en datos
- Predicciones con baja probabilidad

### Errores
- Archivos del modelo no encontrados
- Errores en carga del modelo
- Problemas de conexión con API
- Predicciones fallidas

## Solución de Problemas

### Error: "No se encontró el archivo de datos"
```bash
# Verificar que el archivo existe
ls -la gestion_maquinaria/pronostico-v1/pronostico_maquinaria_1.csv
```

### Error: "Dependencias faltantes"
```bash
# Instalar dependencias
pip install pandas numpy scikit-learn xgboost requests
```

### Error: "Servidor no está ejecutándose"
```bash
# Iniciar servidor Django
cd gestion_maquinaria
python manage.py runserver
```

### Error: "Modelo no está listo"
```bash
# Verificar archivos del modelo
ls -la gestion_maquinaria/pronostico-v1/*.pkl
```

### Error: "This field is required" (API)
- **Problema:** Campos faltantes en la petición a la API
- **Solución:** Usar los campos correctos: `placa`, `fecha_asig`, `horas_op`, `recorrido`

## Uso Recomendado

### Para Desarrollo (Sin Servidor)
```bash
# Prueba rápida durante desarrollo
python test_modelo_rapido.py
```

### Para Testing Completo (Sin Servidor)
```bash
# Prueba completa antes de deploy
python test_modelo_ia.py
```

### Para Verificar API (Con Servidor)
```bash
# Prueba específica de API
python test_api_modelo.py
```

## Soporte

Si encuentras problemas:

1. **Verifica la estructura de archivos**
2. **Revisa los logs de error**
3. **Asegúrate de que el servidor esté ejecutándose** (solo para API)
4. **Verifica las dependencias instaladas**

## Actualizaciones

Los scripts se actualizan automáticamente cuando:
- Se modifica el modelo de IA
- Se cambian los endpoints de la API
- Se actualizan las dependencias

---

**Nota:** Estos scripts están diseñados para funcionar con la versión actual del modelo de IA. Si se realizan cambios significativos en el modelo o la API, puede ser necesario actualizar los scripts. 