export const maquinariaFields = [
  { key: 'placa', label: 'Placa' },
  { key: 'detalle', label: 'Detalle' },
  { key: 'unidad', label: 'Unidad' },
  { key: 'codigo', label: 'Código' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'color', label: 'Color' },
  { key: 'nro_motor', label: 'Nro. Motor' },
  { key: 'nro_chasis', label: 'Nro. Chasis' },
  { key: 'gestion', label: 'Gestión' },
  { key: 'adqui', label: 'Adquisición' },
];

export const depFields = [
  { key: 'costo_activo', label: 'Costo activo' },
  { key: 'fecha_compra', label: 'Fecha compra' },
  { key: 'vida_util', label: 'Vida útil' },
  { key: 'bien_uso', label: 'Bien de Uso' },
];

export const controlFields = [
  { key: 'fecha_inicio', label: 'Fecha de Inicio' },
  { key: 'fecha_final', label: 'Fecha Final' },
  { key: 'proyecto', label: 'Proyecto' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'estado', label: 'Estado' },
  { key: 'tiempo', label: 'Tiempo' },
  { key: 'operador', label: 'Operador' },
];

export const asignacionFields = [
  { key: 'unidad', label: 'Unidad' },
  { key: 'fecha_asignacion', label: 'Fecha de Asignación' },
  { key: 'kilometraje', label: 'Kilometraje' },
  { key: 'gerente', label: 'Gerente' },
  { key: 'encargado', label: 'Encargado' },
];

export const liberacionFields = [
  { key: 'unidad', label: 'Unidad' },
  { key: 'fecha_liberacion', label: 'Fecha de Liberación' },
  { key: 'kilometraje_entregado', label: 'Kilometraje Entregado' },
  { key: 'gerente', label: 'Gerente' },
  { key: 'encargado', label: 'Encargado' },
];

export const mantenimientoFields = [
  // Información básica del mantenimiento
  { key: 'fecha_mantenimiento', label: 'Fecha de Mantenimiento' },
  { key: 'tipo_mantenimiento', label: 'Tipo de Mantenimiento' },
  { key: 'numero_salida_materiales', label: 'N° Salida de Materiales' },
  { key: 'descripcion_danos_eventos', label: 'Descripción, Daños, Eventos' },
  { key: 'reparacion_realizada', label: 'Reparación Realizada' },
  { key: 'costo_total', label: 'Costo Total (Bs.)' },
  { key: 'horas_kilometros', label: 'Horas/Kilómetros' },
  
  // Personal involucrado
  { key: 'operador', label: 'Operador' },
  { key: 'atendido_por', label: 'Atendido por' },
  { key: 'encargado_activos_fijos', label: 'Encargado de Activos Fijos' },
  { key: 'unidad_empresa', label: 'Unidad/Empresa' },
  { key: 'ubicacion_fisico_proyecto', label: 'Ubicación Físico/Proyecto' },
  
  // Tipo de desplazamiento
  { key: 'tipo_desplazamiento_cantidad', label: 'Tipo Desplazamiento - Cantidad' },
  { key: 'tipo_desplazamiento_numero_llanta', label: 'Tipo Desplazamiento - Número de Llanta' },
  { key: 'tipo_desplazamiento_numero_llanta_delantera', label: 'Tipo Desplazamiento - Número de Llanta Delantera' },
  { key: 'tipo_desplazamiento_vida_util', label: 'Tipo Desplazamiento - Vida Útil' },
  
  // Sistema eléctrico
  { key: 'cantidad_sistema_electrico', label: 'Cantidad Sistema Eléctrico' },
  { key: 'voltaje_sistema_electrico', label: 'Voltaje (V)' },
  { key: 'amperaje_sistema_electrico', label: 'Amperaje (A)' },
  { key: 'vida_util_sistema_electrico', label: 'Vida Útil Sistema Eléctrico' },
  
  // Aceite de motor
  { key: 'aceite_motor_cantidad', label: 'Aceite Motor - Cantidad' },
  { key: 'aceite_motor_numero', label: 'Aceite Motor - Número' },
  { key: 'aceite_motor_cambio_km_hr', label: 'Aceite Motor - Cambio (KM/HR)' },
  { key: 'aceite_motor_numero_filtro', label: 'Aceite Motor - Número de Filtro' },
  
  // Aceite hidráulico
  { key: 'aceite_hidraulico_cantidad', label: 'Aceite Hidráulico - Cantidad' },
  { key: 'aceite_hidraulico_numero', label: 'Aceite Hidráulico - Número' },
  { key: 'aceite_hidraulico_cambio_km_hr', label: 'Aceite Hidráulico - Cambio (KM/HR)' },
  { key: 'aceite_hidraulico_numero_filtro', label: 'Aceite Hidráulico - Número de Filtro' },
  
  // Aceite de transmisión
  { key: 'aceite_transmision_cantidad', label: 'Aceite Transmisión - Cantidad' },
  { key: 'aceite_transmision_numero', label: 'Aceite Transmisión - Número' },
  { key: 'aceite_transmision_cambio_km_hr', label: 'Aceite Transmisión - Cambio (KM/HR)' },
  { key: 'aceite_transmision_numero_filtro', label: 'Aceite Transmisión - Número de Filtro' },
  
  // Líquido de freno
  { key: 'liquido_freno_cantidad', label: 'Líquido de Freno - Cantidad' },
  { key: 'liquido_freno_numero', label: 'Líquido de Freno - Número' },
  { key: 'liquido_freno_cambio_km_hr', label: 'Líquido de Freno - Cambio (KM/HR)' },
  { key: 'liquido_freno_numero_filtro_combustible', label: 'Líquido de Freno - Número de Filtro Combustible' },
  
  // Líquido refrigerante
  { key: 'liquido_refrigerante_tipo', label: 'Líquido Refrigerante - Tipo' },
  { key: 'liquido_refrigerante_cantidad_lt', label: 'Líquido Refrigerante - Cantidad (Lt)' },
  { key: 'liquido_refrigerante_frecuencia_cambio', label: 'Líquido Refrigerante - Frecuencia de Cambio' },
  
  // Otros aceites
  { key: 'otros_aceites_tipo', label: 'Otros Aceites - Tipo' },
  { key: 'otros_aceites_cantidad_lt', label: 'Otros Aceites - Cantidad (Lt)' },
  { key: 'otros_aceites_frecuencia_cambio', label: 'Otros Aceites - Frecuencia de Cambio' },
  
  // Sistema de combustible
  { key: 'gasolina', label: 'Gasolina' },
  { key: 'gasolina_cantidad_lt', label: 'Gasolina - Cantidad (Lt)' },
  { key: 'cantidad_filtros', label: 'Cantidad de Filtros' },
  { key: 'codigo_filtro_combustible', label: 'Código Filtro Combustible' },
  
  // Otros filtros
  { key: 'otros_filtros_cantidad', label: 'Otros Filtros - Cantidad' },
  { key: 'otros_filtros_numero', label: 'Otros Filtros - Número' },
  { key: 'otros_filtros_cambio', label: 'Otros Filtros - Cambio (HR/KM)' },
  { key: 'otros_filtros_descripcion', label: 'Otros Filtros - Descripción del Filtro' },
  
  // Trabajos a realizar
  { key: 'trabajos_destinados_realizar', label: 'Trabajos Destinados a Realizar' },
];

export const seguroFields = [
  { key: 'fecha_inicial', label: 'Fecha Inicial' },
  { key: 'fecha_final', label: 'Fecha Final' },
  { key: 'numero_poliza', label: 'Nº Póliza' },
  { key: 'compania_aseguradora', label: 'Compañía Aseguradora' },
  { key: 'importe', label: 'Importe' },
  { key: 'nombre_archivo', label: 'Archivo PDF'},
  { key: 'archivo_pdf', label: 'Datos del Archivo'}
];

export const itvFields = [
  { key: 'gestion', label: 'Gestión' },
  { key: 'nombre_archivo', label: 'Archivo PDF'},
  { key: 'archivo_pdf', label: 'Datos del Archivo'}
];

export const impuestoFields = [
  { key: 'gestion', label: 'Gestión' },
  { key: 'nombre_archivo', label: 'Archivo PDF'},
  { key: 'archivo_pdf', label: 'Datos del Archivo'}
];

export const soatFields = [
  { key: 'gestion', label: 'Gestión' },
  { key: 'nombre_archivo', label: 'Archivo PDF'},
  { key: 'archivo_pdf', label: 'Datos del Archivo'}
];

export const pronosticoFields = [
  { key: 'riesgo', label: 'Riesgo' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'probabilidad', label: 'Probabilidad (%)' },
  { key: 'fecha_asig', label: 'Fecha de Asignación' },
  { key: 'recorrido', label: 'Recorrido' },
  { key: 'horas_op', label: 'Horas de Operación' },
  { key: 'recomendaciones', label: 'Recomendaciones' },
  { key: 'urgencia', label: 'Nivel de Urgencia' },
];
