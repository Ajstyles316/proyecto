export function formatDateOnly(dateStr) {
  if (!dateStr) return '-';
  if (typeof dateStr === 'string') {
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    // Si es string pero no es fecha ISO, intentar parsear
    const d = new Date(dateStr);
    if (!isNaN(d)) return d.toLocaleDateString('es-BO');
    return dateStr;
  }
  if (dateStr instanceof Date && !isNaN(dateStr)) {
    return dateStr.toLocaleDateString('es-BO');
  }
  // Si es un objeto tipo { $date: ... }
  if (typeof dateStr === 'object' && dateStr.$date) {
    return dateStr.$date.split('T')[0];
  }
  return '-';
}

export function cleanRow(row, section = '') {
  const cleaned = {};
  Object.entries(row).forEach(([k, v]) => {
    if (
      k.endsWith('_id') ||
      k === 'maquinaria' ||
      k === 'fecha_ingreso' ||
      k === 'bien_de_uso' ||
      k === 'vida_util' ||
      k === 'costo_activo' ||
      k === 'fecha_creacion' ||
      k === 'fecha_actualizacion' ||
      k === 'created_at' ||
      k === 'updated_at'
    )
      return;

    let keyLabel = k;
    if (k.toLowerCase() === 'ubicación') keyLabel = 'Ubicación';
    if (k.toLowerCase() === 'numero_2024') keyLabel = 'N° 2024';

    if (section === 'Pronósticos' && (k === 'riesgo' || k === 'probabilidad')) {
      cleaned[keyLabel] = v ?? '-';
    } else if (k.toLowerCase().includes('fecha') && v) {
      cleaned[keyLabel] = formatDateOnly(v);
    } else {
      cleaned[keyLabel] = Array.isArray(v) ? v.join('; ') : v;
    }
  });
  return cleaned;
}

export function formatHeader(key) {
  if (key.toLowerCase() === 'ubicación') return 'Ubicación';
  if (key.toLowerCase() === 'numero 2024' || key.toLowerCase() === 'número 2024') return 'N° 2024';
  
  // Si el key ya tiene espacios y parece estar bien formateado, devolverlo tal como está
  if (key.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(key)) {
    return key;
  }
  // Si es un string con guiones bajos, procesarlo
  if (key.includes('_')) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  // Para otros casos, solo capitalizar la primera letra
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
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
  } else if (metodo === 'depreciacion_por_horas') {
    // Depreciación por horas - requiere parámetros adicionales
    const ufv_inicial = parseFloat(coeficiente) || 1; // Usar coeficiente como UFV inicial temporalmente
    const ufv_final = parseFloat(valor_residual) || 1; // Usar valor_residual como UFV final temporalmente
    const horas_periodo = parseFloat(fecha_compra) || 0; // Usar fecha_compra como horas temporalmente
    const depreciacion_por_hora = parseFloat(costo_activo) / (300 * 8); // Factor de uso estándar
    
    // Calcular valor actualizado usando UFV
    const valor_actualizado = costo_activo * (ufv_final / ufv_inicial);
    
    // Calcular depreciación del período
    const depreciacion_periodo = horas_periodo * depreciacion_por_hora;
    
    detalle.push({
      anio: anio_inicio,
      valor_anual_depreciado: round(depreciacion_periodo),
      depreciacion_acumulada: round(depreciacion_periodo),
      valor_en_libros: round(valor_actualizado - depreciacion_periodo),
      valor_actualizado: round(valor_actualizado),
      horas_periodo: horas_periodo,
      depreciacion_por_hora: round(depreciacion_por_hora)
    });
  } else {
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