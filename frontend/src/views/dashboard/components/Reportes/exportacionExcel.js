import * as XLSX from 'xlsx';
import { maquinariaFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';


const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
    fill: { fgColor: { rgb: "2C3E50" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thick", color: { rgb: "1A252F" } },
      bottom: { style: "thick", color: { rgb: "1A252F" } },
      left: { style: "thick", color: { rgb: "1A252F" } },
      right: { style: "thick", color: { rgb: "1A252F" } }
    }
  },
  data: {
    font: { color: { rgb: "2C3E50" }, size: 11 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "medium", color: { rgb: "7F8C8D" } },
      bottom: { style: "medium", color: { rgb: "7F8C8D" } },
      left: { style: "medium", color: { rgb: "7F8C8D" } },
      right: { style: "medium", color: { rgb: "7F8C8D" } }
    }
  },
  alternateRow: {
    fill: { fgColor: { rgb: "F8F9FA" } }
  },
  title: {
    font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "34495E" } },
    border: {
      top: { style: "thick", color: { rgb: "1A252F" } },
      bottom: { style: "thick", color: { rgb: "1A252F" } },
      left: { style: "thick", color: { rgb: "1A252F" } },
      right: { style: "thick", color: { rgb: "1A252F" } }
    }
  },
  currency: {
    font: { color: { rgb: "27AE60" }, bold: true },
    numFmt: '"$"#,##0.00'
  },
  date: {
    font: { color: { rgb: "8E44AD" } },
    numFmt: 'dd/mm/yyyy'
  },
  recommendations: {
    font: { color: { rgb: "2C3E50" }, size: 10 },
    alignment: { horizontal: "left", vertical: "top", wrapText: true }
  }
};

function exportXLS(data, filename = 'reporte') {
  
  const wb = XLSX.utils.book_new();

  function applyAdvancedStyles(ws, hasTitle = false) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const startRow = hasTitle ? 1 : 0;
    
    // Aplicar estilos a encabezados
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: startRow, c: C });
      if (ws[headerCell]) {
        ws[headerCell].s = EXCEL_STYLES.header;
      }
    }
    
    // Aplicar estilos a datos con filas alternadas
    for (let R = startRow + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress]) {
          const cellStyle = { ...EXCEL_STYLES.data };
          
          // Filas alternadas
          if ((R - startRow) % 2 === 0) {
            cellStyle.fill = EXCEL_STYLES.alternateRow.fill;
          }
          
          // Formato especial para diferentes tipos de contenido
          const cellValue = ws[cellAddress].v;
          
          // Fechas
          if (typeof cellValue === 'string' && cellValue.includes('/')) {
            cellStyle.font = { ...cellStyle.font, ...EXCEL_STYLES.date.font };
          }
          // Monedas
          else if (typeof cellValue === 'number' && cellValue > 1000) {
            cellStyle.font = { ...cellStyle.font, ...EXCEL_STYLES.currency.font };
            cellStyle.numFmt = EXCEL_STYLES.currency.numFmt;
          }
          // Recomendaciones (texto largo con viñetas)
          else if (typeof cellValue === 'string' && cellValue.includes('•')) {
            cellStyle.font = { ...cellStyle.font, ...EXCEL_STYLES.recommendations.font };
            cellStyle.alignment = { ...cellStyle.alignment, ...EXCEL_STYLES.recommendations.alignment };
          }
          
          ws[cellAddress].s = cellStyle;
        }
      }
    }
    
    // Ajustar ancho de columnas y altura de filas
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLength = 0;
      let hasMultiline = false;
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && ws[cellAddress].v) {
          const cellValue = String(ws[cellAddress].v);
          const cellLength = cellValue.length;
          maxLength = Math.max(maxLength, cellLength);
          
          // Detectar texto multilínea
          if (cellValue.includes('\n')) {
            hasMultiline = true;
          }
        }
      }
      
      // Ajustar ancho según contenido
      let width = Math.min(Math.max(maxLength + 3, 15), 60);
      if (hasMultiline) {
        width = Math.min(width * 1.5, 80);
      }
      colWidths.push({ wch: width });
    }
    ws['!cols'] = colWidths;
    
    // Ajustar altura de filas para contenido multilínea
    const rowHeights = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      let maxLines = 1;
      
      // Altura especial para fila de título
      if (hasTitle && R === 0) {
        rowHeights.push({ hpt: 35 });
        continue;
      }
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && ws[cellAddress].v) {
          const cellValue = String(ws[cellAddress].v);
          const lines = cellValue.split('\n').length;
          maxLines = Math.max(maxLines, lines);
        }
      }
      rowHeights.push({ hpt: Math.max(maxLines * 15, 25) });
    }
    ws['!rows'] = rowHeights;
    
    return ws;
  }

  function createStyledSheet(title, rows, fields = null) {
    if (!rows || rows.length === 0) return null;
    
    let keys = fields ? fields.map(f => f.key) : Object.keys(rows[0] || {});
    
    // Filtrar solo campo de archivo PDF
    keys = keys.filter(k => k !== 'archivo_pdf');
    
    let header = keys.map(formatHeader);
    let body = rows.map(r => {
      return keys.map(k => {
        if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
          let valor = r[k];
          
          // Formatear fechas
          if (k.toLowerCase().includes('fecha') && valor) {
            valor = formatDateOnly(valor);
          }
          
          // Formatear recomendaciones del pronóstico (máximo 3)
          if (k === 'recomendaciones') {
            if (Array.isArray(valor)) {
              const limitedRecs = valor.slice(0, 3);
              valor = limitedRecs.map(rec => `• ${rec}`).join('\n');
              if (valor.length > 3) {
                valor += '\n• ...';
              }
            } else if (typeof valor === 'string') {
              const allRecs = valor.split(';').map(rec => rec.trim());
              const limitedRecs = allRecs.slice(0, 3);
              valor = limitedRecs.map(rec => `• ${rec}`).join('\n');
              if (allRecs.length > 3) {
                valor += '\n• ...';
              }
            }
          }
          
          // Mostrar solo el nombre del archivo sin hipervínculo
          if (k === 'nombre_archivo' && valor) {
            return valor;
          }
          
          return valor;
        }
        return '';
      });
    });
    
    const ws = XLSX.utils.aoa_to_sheet([
      [title],
      header,
      ...body
    ]);
    
    // Aplicar estilo al título y centrarlo
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = EXCEL_STYLES.title;
    
    // Combinar celdas del título para que esté centrado
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } }];
    
    // Asegurar que el título esté centrado en toda la tabla
    ws[titleCell].v = title;
    
    return applyAdvancedStyles(ws, true);
  }

  if (data.maquinaria && Array.isArray(data.maquinaria) && data.maquinaria.length > 0) {
    const camposImportantes = maquinariaFields.filter(f => f.key !== 'gestion' && f.key !== 'archivo_pdf');
    
    if (data.maquinaria.length === 1) {
      const maq = data.maquinaria[0];
      const ficha = camposImportantes.map(f => [f.label, maq[f.key] ?? '']);
      const fichaSheet = XLSX.utils.aoa_to_sheet([
        ['Datos de la Maquinaria'],
        ['Campo', 'Valor'],
        ...ficha
      ]);
      
      const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      fichaSheet[titleCell].s = EXCEL_STYLES.title;
      fichaSheet[titleCell].v = 'Datos de la Maquinaria';
      fichaSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      
      const styledSheet = applyAdvancedStyles(fichaSheet, true);
      XLSX.utils.book_append_sheet(wb, styledSheet, 'Datos de la Maquinaria');
    } else {
      const maquis = data.maquinaria.map(row => {
        const obj = {};
        camposImportantes.forEach(field => {
          obj[field.key] = row[field.key];
        });
        return obj;
      });
      
      const maqSheet = createStyledSheet('Maquinaria', maquis, camposImportantes);
      if (maqSheet) XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
    }
  } else {
    const maqSheet = XLSX.utils.aoa_to_sheet([
      ['No hay datos de maquinaria para exportar']
    ]);
    XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
  }

  const tablas = [
    { key: 'control', label: 'Control' },
    { key: 'asignacion', label: 'Asignación' },
    { key: 'liberacion', label: 'Liberación' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
    { key: 'soat', label: 'SOAT' },
    { key: 'seguros', label: 'Seguros' },
    { key: 'itv', label: 'ITV' },
    { key: 'impuestos', label: 'Impuestos' },
    { key: 'pronosticos', label: 'Pronóstico' },
  ];
  
  for (const t of tablas) {
    if (data[t.key] && data[t.key].length > 0) {
      const allKeys = Object.keys(data[t.key][0] || {});
      
      const camposFiltrados = allKeys.filter(campo => 
        !campo.toLowerCase().includes('creacion') &&
        !campo.toLowerCase().includes('actualizacion') &&
        !campo.toLowerCase().includes('_id') &&
        campo !== 'id' &&
        campo !== 'archivo_pdf'
      );
      
      if (camposFiltrados.length > 0) {
        const sheet = createStyledSheet(t.label, data[t.key], camposFiltrados.map(k => ({ key: k, label: formatHeader(k) })));
        if (sheet) XLSX.utils.book_append_sheet(wb, sheet, t.label);
      }
    }
  }
  if (data.depreciaciones && data.depreciaciones.length > 0 && data.depreciaciones[0].depreciacion_por_anio && Array.isArray(data.depreciaciones[0].depreciacion_por_anio) && data.depreciaciones[0].depreciacion_por_anio.length > 0) {
    const depAnual = data.depreciaciones[0].depreciacion_por_anio;
    const depSheet = XLSX.utils.aoa_to_sheet([
      ['Depreciación Anual'],
      ['Año', 'Valor Anual Depreciado', 'Depreciación Acumulada', 'Valor en Libros'],
      ...depAnual.map(row => [
        row.anio ?? '-',
        formatCurrency(row.valor_anual_depreciado ?? row.valor),
        formatCurrency(row.depreciacion_acumulada),
        formatCurrency(row.valor_en_libros)
      ])
    ]);
    
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    depSheet[titleCell].s = EXCEL_STYLES.title;
    depSheet[titleCell].v = 'Depreciación Anual';
    depSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    
    const styledDepSheet = applyAdvancedStyles(depSheet, true);
    XLSX.utils.book_append_sheet(wb, styledDepSheet, 'Depreciación Anual');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export default exportXLS; 