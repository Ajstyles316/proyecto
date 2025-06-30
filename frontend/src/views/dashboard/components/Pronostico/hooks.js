export const FIELD_LABELS = {
  placa: 'Placa',
  fecha_asig: 'Fecha de Asignación',
  horas_op: 'Horas de Operación',
  recorrido: 'Recorrido (km)',
  riesgo: 'Riesgo',
  resultado: 'Resultado',
  fecha_sugerida: 'Fecha Sugerida de Mantenimiento',
};
export const getRiesgoColor = (riesgo) => {
  if (riesgo === 'Alto') return 'error.main';
  if (riesgo === 'Medio') return 'warning.main';
  if (riesgo === 'Bajo') return 'success.main';
  return 'text.primary';
};
export const getRecomendacion = (resultado) => {
  if (resultado === 'Correctivo') return '¡Atención inmediata!';
  if (resultado === 'Preventivo') return 'Programar mantenimiento.';
  return '';
};
export const getAccionPorTipo = (resultado) => {
  if (resultado === 'Correctivo') return '¡Atención inmediata! Revisar y reparar fallas.';
  if (resultado === 'Preventivo') return 'Programar mantenimiento preventivo.';
  return 'Consultar con el área de mantenimiento.';
};
export const getRecomendacionesPorTipo = (resultado) => {
  if (resultado === 'Correctivo') return [
    'Diagnóstico preciso: uso de herramientas de diagnóstico o software.',
    'Inspección técnica detallada por un mecánico especializado.',
    'Reemplazo de partes dañadas: motores, correas, rodamientos, etc.',
    'Reparación estructural: soldaduras, enderezado de chasis, refuerzos.',
    'Análisis de causa raíz: documentar para evitar que se repita.',
    'Actualización del historial de la máquina.',
    'Medidas de seguridad post-reparación: pruebas antes de volver a operar.'
  ];
  if (resultado === 'Preventivo') return [
    'Revisión periódica del equipo.',
    'Inspección visual de componentes.',
    'Verificación de ruidos anómalos, vibraciones o fugas.',
    'Lubricación regular de partes móviles.',
    'Cambio de filtros y fluidos según cronograma.',
    'Calibraciones y ajustes: sensores, frenos, presión hidráulica.',
    'Monitoreo de horas de uso y recorrido.',
    'Capacitación del operador y revisión diaria básica.',
    'Checklist preventiva y documentación en cada revisión.'
  ];
  return ['Consultar con el área de mantenimiento.'];
};