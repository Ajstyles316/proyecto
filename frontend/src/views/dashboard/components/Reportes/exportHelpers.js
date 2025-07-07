export function formatDateOnly(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr.split('T')[0];
  return d.toLocaleDateString('es-BO');
}
export function cleanRow(row) {
  const cleaned = {};
  Object.entries(row).forEach(([k, v]) => {
    if (k.endsWith('_id') || k === 'maquinaria' || k === 'fecha_ingreso') return;
    if (k.toLowerCase().includes('fecha') && v) {
      cleaned[k] = formatDateOnly(v);
    } else {
      cleaned[k] = Array.isArray(v) ? v.join('; ') : v;
    }
  });
  return cleaned;
}
export function formatHeader(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
export function formatCurrency(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value);
}
export function calcularDepreciacionAnual({ costo_activo, vida_util, metodo = 'linea_recta', fecha_compra, valor_residual = 0, coeficiente = null }) {
  const detalle = [];
  let depreciacion_acumulada = 0;
  let valor_en_libros = costo_activo;
  let base = costo_activo;
  const anio_inicio = fecha_compra ? new Date(fecha_compra).getFullYear() : new Date().getFullYear();
  function round(num) { return Math.round((num + Number.EPSILON) * 100) / 100; }
  if (metodo === 'coeficiente' && coeficiente) {
    for (let i = 0; i < vida_util; i++) {
      let dep_anual = base * coeficiente;
      if (i === vida_util - 1 || base - dep_anual < 0) dep_anual = base;
      base -= dep_anual;
      depreciacion_acumulada += dep_anual;
      valor_en_libros -= dep_anual;
      detalle.push({
        anio: anio_inicio + i,
        valor_anual_depreciado: round(dep_anual),
        depreciacion_acumulada: round(depreciacion_acumulada),
        valor_en_libros: round(valor_en_libros)
      });
    }
  } else if (metodo === 'saldo_decreciente') {
    const tasa = (1 / vida_util) * 2;
    for (let i = 0; i < vida_util; i++) {
      let dep_anual = valor_en_libros * tasa;
      if (i === vida_util - 1 || valor_en_libros - dep_anual < valor_residual) {
        dep_anual = valor_en_libros - valor_residual;
      }
      depreciacion_acumulada += dep_anual;
      valor_en_libros -= dep_anual;
      detalle.push({
        anio: anio_inicio + i,
        valor_anual_depreciado: round(dep_anual),
        depreciacion_acumulada: round(depreciacion_acumulada),
        valor_en_libros: round(valor_en_libros)
      });
    }
  } else if (metodo === 'suma_digitos') {
    const suma_digitos = (vida_util * (vida_util + 1)) / 2;
    for (let i = 0; i < vida_util; i++) {
      const años_restantes = vida_util - i;
      const factor = años_restantes / suma_digitos;
      const dep_anual = base * factor;
      depreciacion_acumulada += dep_anual;
      valor_en_libros -= dep_anual;
      detalle.push({
        anio: anio_inicio + i,
        valor_anual_depreciado: round(dep_anual),
        depreciacion_acumulada: round(depreciacion_acumulada),
        valor_en_libros: round(valor_en_libros)
      });
    }
  } else { // línea recta por defecto
    const depreciacion_anual = (costo_activo - valor_residual) / vida_util;
    for (let i = 0; i < vida_util; i++) {
      let dep_anual = (i === vida_util - 1) ? valor_en_libros - valor_residual : depreciacion_anual;
      depreciacion_acumulada += dep_anual;
      valor_en_libros -= dep_anual;
      detalle.push({
        anio: anio_inicio + i,
        valor_anual_depreciado: round(dep_anual),
        depreciacion_acumulada: round(depreciacion_acumulada),
        valor_en_libros: round(valor_en_libros)
      });
    }
  }
  return detalle;
} 