export function formatDateOnly(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr.split('T')[0];
  return d.toLocaleDateString('es-BO');
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value);
}

export function cleanRow(row) {
  const cleaned = {};
  Object.entries(row).forEach(([k, v]) => {
    if (k.endsWith('_id') || k === 'maquinaria' || k === 'fecha_ingreso' || k === 'fecha_creacion' || k === 'fecha_actualizacion' || k === 'created_at' || k === 'updated_at') return;
    if (k.toLowerCase().includes('fecha') && v) {
      cleaned[k] = formatDateOnly(v);
    } else {
      cleaned[k] = Array.isArray(v) ? v.join('; ') : v;
    }
  });
  return cleaned;
}

export function formatHeader(key) {
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

export function formatMethod(method) {
  if (!method) return '-';
  // Si el method ya tiene espacios y parece estar bien formateado, devolverlo tal como está
  if (method.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(method)) {
    return method;
  }
  // Si es un string con guiones bajos, procesarlo
  if (method.includes('_')) {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  // Para otros casos, solo capitalizar la primera letra
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}
