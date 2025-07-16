import * as XLSX from 'xlsx';
import { maquinariaFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

function exportXLS(data, filename = 'reporte') {
  const wb = XLSX.utils.book_new();

  // Helper para crear hoja horizontal
  function horizontalSheet(title, rows, fields = null) {
    if (!rows || rows.length === 0) return null;
    let keys = fields ? fields.map(f => f.key) : Object.keys(rows[0] || {});
    const header = fields ? fields.map(f => f.label) : keys.map(formatHeader);
    const body = rows.map(r => keys.map(k => r[k] ?? ''));
    return XLSX.utils.aoa_to_sheet([
      header,
      ...body
    ]);
  }

  // Maquinaria
  if (data.maquinaria && data.maquinaria.length > 0) {
    const maqSheet = horizontalSheet('Maquinaria', data.maquinaria, maquinariaFields);
    if (maqSheet) XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
  }

  // Otras tablas
  const tablas = [
    { key: 'control', label: 'Control' },
    { key: 'asignacion', label: 'Asignación' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
    { key: 'soat', label: 'SOAT' },
    { key: 'seguros', label: 'Seguros' },
    { key: 'itv', label: 'ITV' },
    { key: 'impuestos', label: 'Impuestos' },
    { key: 'depreciaciones', label: 'Depreciación' },
    { key: 'pronosticos', label: 'Pronóstico' },
  ];
  for (const t of tablas) {
    if (data[t.key] && data[t.key].length > 0) {
      // Solo incluir placa y detalle, más los campos propios de la tabla (excluyendo campos de maquinaria e IDs)
      const allKeys = Array.from(
        data[t.key].reduce((set, row) => {
          Object.keys(row).forEach(k => {
            if (
              k === 'placa' ||
              k === 'detalle' ||
              (k !== 'id' &&
                k !== '_id' &&
                k !== 'maquinaria' &&
                k !== 'maquinaria_id' &&
                k !== 'bien_de_uso' &&
                k !== 'bien_uso' &&
                k !== 'vida_util' &&
                k !== 'costo_activo' &&
                k !== 'unidad' &&
                k !== 'codigo' &&
                k !== 'tipo' &&
                k !== 'marca' &&
                k !== 'modelo' &&
                k !== 'color' &&
                k !== 'nro_motor' &&
                k !== 'nro_chasis' &&
                k !== 'gestion' &&
                k !== 'adqui')
            ) {
              set.add(k);
            }
          });
          return set;
        }, new Set())
      );
      // Asegurar que placa y detalle estén al inicio
      let keys = allKeys;
      if (keys.includes('placa')) keys = ['placa', ...keys.filter(k => k !== 'placa')];
      if (keys.includes('detalle')) keys = ['detalle', ...keys.filter(k => k !== 'detalle')];
      const header = keys.map(formatHeader);
      const body = data[t.key].map(r => keys.map(k => r[k] ?? ''));
      const sheet = XLSX.utils.aoa_to_sheet([
        header,
        ...body
      ]);
      XLSX.utils.book_append_sheet(wb, sheet, t.label);
    }
  }

  // Depreciación anual (si existe y no está vacía)
  if (data.depreciaciones && data.depreciaciones.length > 0 && data.depreciaciones[0].depreciacion_por_anio && Array.isArray(data.depreciaciones[0].depreciacion_por_anio) && data.depreciaciones[0].depreciacion_por_anio.length > 0) {
    const depAnual = data.depreciaciones[0].depreciacion_por_anio;
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
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export default exportXLS; 