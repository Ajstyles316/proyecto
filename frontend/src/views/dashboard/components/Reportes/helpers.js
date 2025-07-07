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
