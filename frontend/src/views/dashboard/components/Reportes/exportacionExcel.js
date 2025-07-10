import * as XLSX from 'xlsx';
import { maquinariaFields} from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

function exportXLS({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos }) {
  const maqRows = maquinariaFields.map(f => [f.label, maquinaria[f.key] || 'No se encontraron datos']);
  const maqSheet = XLSX.utils.aoa_to_sheet([
    ['Campo', 'Valor'],
    ...maqRows
  ]);
  function sectionSheet(title, data, fields = null, opts = {}) {
    if (!data || data.length === 0) {
      return XLSX.utils.aoa_to_sheet([[title], ['No se encontraron datos']]);
    }
    let rows = data.map(cleanRow);
    let keys = fields ? fields.map(f => f.key).filter(k => !k.endsWith('_id') && k !== 'maquinaria' && k !== 'fecha_ingreso') : Object.keys(rows[0] || {});
    // Excluir campos no deseados en todas las tablas relevantes
    if ([
      'control', 'asignación', 'asignacion', 'mantenimiento', 'soat', 'seguros', 'itv', 'impuestos',
      'depreciacion', 'depreciación'
    ].some(tabla => title.toLowerCase().includes(tabla))) {
      keys = keys.filter(k => !['bien_uso', 'bien_de_uso', 'vida_util', 'costo_activo'].includes(k.toLowerCase()));
    }
    if (opts.skipDates) {
      keys = keys.filter(k => !k.toLowerCase().includes('creacion') && !k.toLowerCase().includes('actualizacion'));
    }
    const header = fields ? fields.map(f => f.label) : keys.map(formatHeader);
    const body = rows.map(r => keys.map(k => r[k] ?? 'No se encontraron datos'));
    return XLSX.utils.aoa_to_sheet([
      [title],
      header,
      ...body
    ]);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
  XLSX.utils.book_append_sheet(wb, sectionSheet('Control', control), 'Control');
  XLSX.utils.book_append_sheet(wb, sectionSheet('Asignación', asignacion), 'Asignación');
  XLSX.utils.book_append_sheet(wb, sectionSheet('Mantenimiento', mantenimiento), 'Mantenimiento');
  XLSX.utils.book_append_sheet(wb, sectionSheet('SOAT', soat), 'SOAT');
  XLSX.utils.book_append_sheet(wb, sectionSheet('Seguros', seguros), 'Seguros');
  XLSX.utils.book_append_sheet(wb, sectionSheet('ITV', itv), 'ITV');
  XLSX.utils.book_append_sheet(wb, sectionSheet('Impuestos', impuestos), 'Impuestos');
  // Depreciación anual
  let depAnual = null;
  if (depreciaciones && depreciaciones.length > 0 && depreciaciones[0].depreciacion_por_anio && Array.isArray(depreciaciones[0].depreciacion_por_anio) && depreciaciones[0].depreciacion_por_anio.length > 0) {
    depAnual = depreciaciones[0].depreciacion_por_anio;
  } else if (depreciaciones && depreciaciones.length > 0) {
    // Fallback: calcular en frontend
    const dep = depreciaciones[0];
    depAnual = calcularDepreciacionAnual({
      costo_activo: Number(dep.costo_activo) || 0,
      vida_util: Number(dep.vida_util) || 1,
      metodo: dep.metodo || dep.metodo_depreciacion || 'linea_recta',
      fecha_compra: dep.fecha_compra || dep.fecha_registro,
      valor_residual: Number(dep.valor_residual) || 0,
      coeficiente: dep.coeficiente ? Number(dep.coeficiente) : null
    });
  }
  if (depAnual && depAnual.length > 0) {
    const depSheet = XLSX.utils.aoa_to_sheet([
      ['Año', 'Valor Anual Depreciado', 'Depreciación Acumulada', 'Valor en Libros'],
      ...depAnual.map(row => [
        row.anio ?? '-',
        formatCurrency(row.valor_anual_depreciado ?? row.valor),
        formatCurrency(row.depreciacion_acumulada),
        formatCurrency(row.valor_en_libros)
      ])
    ]);
    XLSX.utils.book_append_sheet(wb, depSheet, 'Depreciación Anual');
  } else {
    const depSheet = XLSX.utils.aoa_to_sheet([
      ['Depreciación Anual'],
      ['No se encontraron datos']
    ]);
    XLSX.utils.book_append_sheet(wb, depSheet, 'Depreciación Anual');
  }
  // Pronósticos
  const pronosticosSinFecha = pronosticos.map(p => {
    const { fecha_creacion, creado_en, ...rest } = p;
    return rest;
  });
  function pronosticoSheet(title, data) {
    if (!data || data.length === 0) {
      return XLSX.utils.aoa_to_sheet([[title], ['No se encontraron datos']]);
    }
    const cleanedData = data.map(item => {
      const cleaned = {};
      Object.entries(item).forEach(([key, value]) => {
        if (key === 'fecha_creacion' || key === 'creado_en') return;
        if (key === 'id' || key === '_id' || key.endsWith('_id')) return;
        if (key === 'recomendaciones') {
          if (Array.isArray(value)) {
            cleaned[key] = value.slice(0, 3).map(rec => `- ${rec}`).join('\n');
          } else if (typeof value === 'string') {
            cleaned[key] = value.split(';').slice(0, 3).map(rec => `- ${rec.trim()}`).join('\n');
          } else {
            cleaned[key] = '-';
          }
        } else if (key.toLowerCase().includes('fecha') && value) {
          cleaned[key] = formatDateOnly(value);
        } else {
          cleaned[key] = value || '-';
        }
      });
      return cleaned;
    });
    let keys = Object.keys(cleanedData[0] || {});
    keys = keys.filter(k => k !== 'id' && k !== '_id' && !k.endsWith('_id'));
    const header = keys.map(formatHeader);
    const body = cleanedData.map(r => keys.map(k => r[k]));
    return XLSX.utils.aoa_to_sheet([
      [title],
      header,
      ...body
    ]);
  }
  XLSX.utils.book_append_sheet(wb, pronosticoSheet('Pronósticos', pronosticosSinFecha), 'Pronósticos');
  const filename = `reporte_${maquinaria.placa || maquinaria.codigo || 'maquinaria'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export default exportXLS; 