import * as XLSX from 'xlsx';
import { maquinariaFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

// Función para manejar descarga de archivos PDF
const handleFileDownload = (fileName, fileData) => {
  if (!fileName || !fileData || !fileData.archivo_pdf) {
    console.warn('No hay datos de archivo para descargar', { fileName, fileData });
    return;
  }

  try {
    const byteCharacters = atob(fileData.archivo_pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar la URL después de un tiempo
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error descargando archivo:', error);
    alert('Error al descargar el archivo');
  }
};

// Configuración de estilos para Excel
const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1E4DB7" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "1E4DB7" } },
      bottom: { style: "thin", color: { rgb: "1E4DB7" } },
      left: { style: "thin", color: { rgb: "1E4DB7" } },
      right: { style: "thin", color: { rgb: "1E4DB7" } }
    }
  },
  data: {
    font: { color: { rgb: "212121" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E0E0E0" } },
      bottom: { style: "thin", color: { rgb: "E0E0E0" } },
      left: { style: "thin", color: { rgb: "E0E0E0" } },
      right: { style: "thin", color: { rgb: "E0E0E0" } }
    }
  },
  alternateRow: {
    fill: { fgColor: { rgb: "F8F9FA" } }
  },
  title: {
    font: { bold: true, size: 14, color: { rgb: "1E4DB7" } },
    alignment: { horizontal: "center" }
  }
};

function exportXLS(data, filename = 'reporte') {
  // Exponer la función de descarga globalmente para Excel
  window.handleFileDownload = handleFileDownload;
  
  const wb = XLSX.utils.book_new();

  // Helper para aplicar estilos básicos a una hoja
  function applyBasicStyles(ws) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Ajustar ancho de columnas
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLength = 0;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && ws[cellAddress].v) {
          const cellLength = String(ws[cellAddress].v).length;
          maxLength = Math.max(maxLength, cellLength);
        }
      }
      colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 12), 50) });
    }
    ws['!cols'] = colWidths;
    
    return ws;
  }

  // Helper para crear hoja simple
  function createSimpleSheet(title, rows, fields = null) {
    if (!rows || rows.length === 0) return null;
    
    let keys = fields ? fields.map(f => f.key) : Object.keys(rows[0] || {});
    let header = keys.map(formatHeader);
    let body = rows.map(r => {
      return keys.map(k => {
        if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
          // Formatear fechas correctamente
          let valor = r[k];
          if (k.toLowerCase().includes('fecha') && valor) {
            valor = formatDateOnly(valor);
          }
          
          // Si es un campo de archivo, crear enlace de descarga
          if (k === 'nombre_archivo' && valor && r.archivo_pdf) {
            // Crear hipervínculo para descarga
            return {
              v: valor,
              l: {
                Target: `javascript:handleFileDownload('${valor}', ${JSON.stringify(r).replace(/"/g, '&quot;')})`,
                Tooltip: 'Hacer clic para descargar'
              }
            };
          }
          
          return valor;
        }
        return '';
      });
    });
    
    const ws = XLSX.utils.aoa_to_sheet([
      header,
      ...body
    ]);
    
    return applyBasicStyles(ws);
  }

  // Maquinaria - Filtrar campos importantes y excluir gestión
  if (data.maquinaria && Array.isArray(data.maquinaria) && data.maquinaria.length > 0) {
    // Filtrar campos importantes excluyendo gestión
    const camposImportantes = maquinariaFields.filter(f => f.key !== 'gestion');
    
    if (data.maquinaria.length === 1) {
      // Hoja vertical tipo ficha para una sola maquinaria
      const maq = data.maquinaria[0];
      const ficha = camposImportantes.map(f => [f.label, maq[f.key] ?? '']);
      const fichaSheet = XLSX.utils.aoa_to_sheet([
        ['Campo', 'Valor'],
        ...ficha
      ]);
      
      const styledSheet = applyBasicStyles(fichaSheet);
      XLSX.utils.book_append_sheet(wb, styledSheet, 'Datos de la Maquinaria');
    } else {
      // Hoja horizontal para varias maquinarias
      const maquis = data.maquinaria.map(row => {
        const obj = {};
        camposImportantes.forEach(field => {
          obj[field.key] = row[field.key];
        });
        return obj;
      });
      
      const maqSheet = createSimpleSheet('Maquinaria', maquis, camposImportantes);
      if (maqSheet) XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
    }
  } else {
    // Hoja vacía si no hay datos
    const maqSheet = XLSX.utils.aoa_to_sheet([
      ['No hay datos de maquinaria para exportar']
    ]);
    XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
  }

  // Otras tablas - Mostrar todos los campos disponibles
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
      // Obtener todos los campos disponibles en los datos
      const allKeys = Object.keys(data[t.key][0] || {});
      
      // Filtrar campos que no queremos mostrar
      const camposFiltrados = allKeys.filter(campo => 
        !campo.toLowerCase().includes('creacion') &&
        !campo.toLowerCase().includes('actualizacion') &&
        !campo.toLowerCase().includes('_id') &&
        campo !== 'id'
      );
      
      if (camposFiltrados.length > 0) {
        const sheet = createSimpleSheet(t.label, data[t.key], camposFiltrados.map(k => ({ key: k, label: formatHeader(k) })));
        if (sheet) XLSX.utils.book_append_sheet(wb, sheet, t.label);
      }
    }
  }
  // Depreciaciones
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
    
    const styledDepSheet = applyBasicStyles(depSheet);
    XLSX.utils.book_append_sheet(wb, styledDepSheet, 'Depreciación Anual');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export default exportXLS; 