import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  maquinariaFields, 
  depFields, 
  controlFields, 
  asignacionFields, 
  liberacionFields, 
  mantenimientoFields, 
  seguroFields, 
  itvFields, 
  impuestoFields, 
  soatFields,
  pronosticoFields
} from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency } from './helpers';
import { calcularDepreciacionAnual } from './exportHelpers';

const isDateLike = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);

const fmt = (v) => {
  if (v == null) return '-';
  if (isDateLike(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-ES');
  }
  if (typeof v === 'number') return String(v);
  return String(v);
};

const ensureArray = (v) => (Array.isArray(v) ? v : []);

const dedupeBy = (rows, keys) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = (keys || Object.keys(r)).map((x) => (r?.[x] ?? '')).join('|');
    if (!seen.has(k)) {
      seen.add(k);
      out.push(r);
    }
  }
  return out;
};

const DEDUPE_KEYS = {
  maquinaria: ['placa', 'detalle', 'unidad'],
  control: ['placa', 'fecha_ingreso', 'estado', 'ubicacion'],
  itv: ['placa', 'detalle', 'importe'],
  depreciaciones: ['placa', 'detalle', 'fecha_compra', 'costo_activo'],
  pronosticos: ['placa', 'fecha_mantenimiento', 'resultado', 'riesgo', 'probabilidad'],
  asignacion: ['placa', 'fecha_asignacion', 'recorrido_km'],
  mantenimiento: ['placa', 'tipo', 'gestion', 'ubicacion'],
  soat: ['placa', 'importe_2024', 'importe_2025'],
  seguros: ['placa', 'numero_2024', 'importe'],
  impuestos: ['placa', 'importe_2023', 'importe_2024'],
};

function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function addSectionTitle(doc, title, y, pageWidth) {
  // Fondo para el título de sección
  const titleWidth = doc.getTextWidth(title) + 20;
  const titleX = (pageWidth - titleWidth) / 2;
  
  // Fondo azul para el título
  doc.setFillColor(30, 77, 183);
  doc.roundedRect(titleX, y - 3, titleWidth, 10, 2, 2, 'F');
  
  // Texto del título
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y + 2, { align: 'center' });
  
  return y + 12;
}

function addMainHeader(doc, pageWidth) {
  // Configuración del texto del header
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  
  const lines = [
    'MINISTERIO DE DEFENSA',
    'CORPORACIÓN DE LAS FF.AA. PARA EL DESARROLLO NACIONAL',
    'EMPRESA PÚBLICA NACIONAL ESTRATÉGICA'
  ];
  
  const lineHeight = 7;
  const totalTextHeight = lines.length * lineHeight;
  const textY = 20;
  const textMarginLeft = 18;
  const textMarginRight = 18;
  const textWidth = pageWidth - textMarginLeft - textMarginRight;
  lines.forEach((line, i) => doc.text(line, textMarginLeft + textWidth / 2, textY + i * lineHeight, { align: 'center' }));


  // Línea divisoria
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.5);
  doc.line(18, textY + totalTextHeight + 8, pageWidth - 18, textY + totalTextHeight + 8);

  // Retornar la altura total del header
  return textY + totalTextHeight + 10;
}

function exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, liberacion, mantenimiento, soat, seguros, itv, impuestos }) {
  console.log('🔍 EXPORT PDF - Parámetros recibidos:', {
    maquinaria: !!maquinaria,
    depreciaciones: Array.isArray(depreciaciones) ? depreciaciones.length : 'No es array',
    pronosticos: Array.isArray(pronosticos) ? pronosticos.length : 'No es array',
    control: Array.isArray(control) ? control.length : 'No es array',
    asignacion: Array.isArray(asignacion) ? asignacion.length : 'No es array',
    liberacion: Array.isArray(liberacion) ? liberacion.length : 'No es array',
    mantenimiento: Array.isArray(mantenimiento) ? mantenimiento.length : 'No es array',
    soat: Array.isArray(soat) ? soat.length : 'No es array',
    seguros: Array.isArray(seguros) ? seguros.length : 'No es array',
    itv: Array.isArray(itv) ? itv.length : 'No es array',
    impuestos: Array.isArray(impuestos) ? impuestos.length : 'No es array'
  });
  
  const doc = new jsPDF({
    compress: true,
    precision: 2
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 40;

  // Agregar header y obtener su altura
  y = addMainHeader(doc, pageWidth);
  
  y = addSectionTitle(doc, 'Datos de la Maquinaria', y, pageWidth);
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  doc.text('A continuación se presentan los datos principales de la maquinaria seleccionada.', 30, y);
  y += 7;

  const maqRows = maquinariaFields
    .filter(f => f.key !== 'gestion') 
    .map(f => [f.label, maquinaria[f.key] || 'No se encontraron datos']);
    
    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: maqRows,
      styles: { 
        fontSize: 8, 
        cellPadding: 1,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 8,
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      pageBreak: 'avoid',
      theme: 'grid'
    });
  y = doc.lastAutoTable.finalY + 8;

  function addSection(title, data, introText, columnsToRemove = []) {
    const sectionTitle = title === 'Control' ? 'Control y Seguimiento' : title;

    if (y + 40 > pageHeight - 20) {
      doc.addPage();
      y = 40;
      y = addMainHeader(doc, pageWidth); // Agregar header en nuevas páginas
    }

    y = addSectionTitle(doc, sectionTitle, y, pageWidth);
    
    doc.setFontSize(9);
    doc.setTextColor(33, 33, 33);
    doc.text(introText, 30, y);
    y += 7;

    if (!data || data.length === 0) {
      autoTable(doc, {
        startY: y,
        head: [['Mensaje']],
        body: [['No se encontraron datos']],
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: { 
          fillColor: [30, 77, 183], 
          textColor: 255,
          fontSize: 10
        },
        bodyStyles: { 
          textColor: 33,
          fontSize: 9
        },
        margin: { left: 30, right: 30 },
        tableLineColor: [30, 77, 183],
        tableLineWidth: 0.2,
        pageBreak: 'avoid',
      });
      y = doc.lastAutoTable.finalY + 8;
      return;
    }

    const rows = ensureArray(data).map(row => cleanRow(row, title === 'Asignación' || title === 'Liberación'));
    const keys = Object.keys(rows[0] || {});
    
    let filteredKeys = [];
    
    if (title === 'Asignación') {
      // Usar los campos definidos en fields.js para asignación
      filteredKeys = asignacionFields.map(f => f.key).filter(k => keys.includes(k));
    } else if (title === 'Liberación') {
      // Usar los campos definidos en fields.js para liberación
      filteredKeys = liberacionFields.map(f => f.key).filter(k => keys.includes(k));
    } else if (title === 'Mantenimiento') {
      // Usar los campos definidos en fields.js para mantenimiento
      filteredKeys = mantenimientoFields.map(f => f.key).filter(k => keys.includes(k));
    } else {
      filteredKeys = keys.filter(k =>
        !k.toLowerCase().includes('creacion') &&
        !k.toLowerCase().includes('actualizacion') &&
        !columnsToRemove.includes(k) &&
        !['fecha_desactivacion', 'fecha_reactivacion'].includes(k.toLowerCase()) &&
        k !== 'archivo_pdf' // Excluir solo columna de archivo PDF del PDF exportado
      );
    }

    if (filteredKeys.length === 0) return;

    autoTable(doc, {
      startY: y,
      head: [filteredKeys.map(formatHeader)],
      body: rows.map(r => filteredKeys.map(k => fmt(r[k]) || '-')),
      styles: { 
        fontSize: 8, 
        cellPadding: 1,
        minCellHeight: 6,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      pageBreak: 'auto',
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  const sections = [
    { key: 'control', title: 'Control', intro: 'Esta sección muestra los controles realizados sobre la maquinaria.' },
    { key: 'asignacion', title: 'Asignación', intro: 'Aquí se detallan las asignaciones históricas de la maquinaria.' },
    { key: 'liberacion', title: 'Liberación', intro: 'Aquí se detallan las liberaciones históricas de la maquinaria.' },
    { key: 'mantenimiento', title: 'Mantenimiento', intro: 'Se listan los mantenimientos realizados y programados para la maquinaria.' },
    { key: 'soat', title: 'SOAT', intro: 'Información sobre el seguro SOAT vigente o histórico de la maquinaria.' },
    { key: 'seguros', title: 'Seguros', intro: 'Detalle de otros seguros asociados a la maquinaria.' },
    { key: 'itv', title: 'ITV', intro: 'Resultados de las inspecciones técnicas vehiculares (ITV) realizadas.' },
    { key: 'impuestos', title: 'Impuestos', intro: 'Historial de pagos y obligaciones tributarias de la maquinaria.' },
  ];

  const dataMap = { 
    control: control || [], 
    asignacion: asignacion || [], 
    liberacion: liberacion || [], 
    mantenimiento: mantenimiento || [], 
    soat: soat || [], 
    seguros: seguros || [], 
    itv: itv || [], 
    impuestos: impuestos || [] 
  };
  
  console.log('🔍 EXPORT PDF - dataMap creado:', {
    control: dataMap.control.length,
    asignacion: dataMap.asignacion.length,
    liberacion: dataMap.liberacion.length,
    mantenimiento: dataMap.mantenimiento.length,
    soat: dataMap.soat.length,
    seguros: dataMap.seguros.length,
    itv: dataMap.itv.length,
    impuestos: dataMap.impuestos.length
  });

  sections.forEach(sec => {
    if (y + 40 > pageHeight - 20) {
      doc.addPage();
      y = 40;
      y = addMainHeader(doc, pageWidth); // Agregar header en nuevas páginas
    }
    addSection(sec.title, dataMap[sec.key], sec.intro);
  });

  doc.addPage();
  y = 40;
  y = addMainHeader(doc, pageWidth);

  doc.setFontSize(11);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  y += 7;

  y = addSectionTitle(doc, 'Tabla de Depreciación Anual', y, pageWidth);
  
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  doc.text('La siguiente tabla muestra el cálculo de la depreciación anual, la depreciación acumulada y el valor en libros.', 30, y);
  y += 7;

  let depAnual = null;
  if (depreciaciones?.[0]?.depreciacion_por_anio?.length) {
    depAnual = depreciaciones[0].depreciacion_por_anio;
  } else if (depreciaciones?.length) {
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

  if (depAnual?.length) {
    const dep = depreciaciones?.[0];
    const isDepreciacionPorHoras = dep?.metodo === 'depreciacion_por_horas' || dep?.metodo_depreciacion?.includes('HRS.');
    
      // Campos según la imagen proporcionada
      let headers = ['Año', 'Método', 'Valor Activo Fijo', 'Deprec. Acumulada', 'Valor Neto', 'Deprec. de la Gestión', 'Deprec. Acumulada Final', 'Valor Neto Final'];
      let bodyData = depAnual.map(row => {
        // Calcular valores según las fórmulas
        const horas = row.horas_periodo || 0;
        const deprecPorHora = row.depreciacion_por_hora || 0;
        const deprecGestion = horas * deprecPorHora;
        const incremento = row.incremento_actualizacion_depreciacion || 0;
        const deprecAcumuladaFinal = (row.depreciacion_acumulada || 0) + incremento + deprecGestion;
        const valorActualizado = row.valor_actualizado || Number(dep?.costo_activo) || 0;
        const valorNetoFinal = valorActualizado - deprecAcumuladaFinal;
        
        return [
          row.anio ?? '-', 
          dep?.metodo === 'depreciacion_por_horas' ? 'Por Horas' : dep?.metodo === 'linea_recta' ? 'Línea Recta' : dep?.metodo || 'No definido',
          formatCurrency(Number(dep?.costo_activo) || 0),
          formatCurrency(row.depreciacion_acumulada), 
          formatCurrency(row.valor_en_libros),
          formatCurrency(deprecGestion),
          formatCurrency(deprecAcumuladaFinal),
          formatCurrency(valorNetoFinal)
        ];
      });
    
    autoTable(doc, {
      startY: y,
      head: [headers],
      body: bodyData,
      styles: { 
        fontSize: 7, 
        cellPadding: 1,
        minCellHeight: 6,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 7,
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('No se encontraron datos de depreciación anual para esta maquinaria.', 30, y);
    y += 7;
  }

  doc.addPage();
  y = 40;
  y = addMainHeader(doc, pageWidth);

  doc.setFontSize(11);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  y += 7;

  y = addSectionTitle(doc, 'Pronósticos', y, pageWidth);
  
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  doc.text('En esta sección se presentan los pronósticos de mantenimiento y riesgo para la maquinaria.', 30, y);
  y += 7;

  const pronosticosClean = ensureArray(pronosticos).map(({ fecha_creacion, creado_en, ...rest }) => rest);
  const pronDedupe = dedupeBy(pronosticosClean, DEDUPE_KEYS.pronosticos);

  if (!pronDedupe.length) {
    autoTable(doc, {
      startY: y,
      head: [['Mensaje']],
      body: [['No se encontraron datos']],
      styles: { 
        fontSize: 9, 
        cellPadding: 1.5,
        minCellHeight: 8
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 10
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9
      },
      margin: { left: 30, right: 30 }
    });
  } else {
    const item = pronDedupe[0];
    const body = [];

    Object.entries(item).forEach(([key, value]) => {
      if (['id', '_id', 'fecha_creacion', 'creado_en'].includes(key)) return;
      let formattedValue = value ?? '-';
      if (key.toLowerCase().includes('fecha') && value) {
        formattedValue = formatDateOnly(value);
      } else if (key === 'recomendaciones' && Array.isArray(value)) {
        formattedValue = value.map(rec => `- ${rec}`).join('\n');
      } else if (key === 'recomendaciones' && typeof value === 'string') {
        formattedValue = value.split(';').map(rec => `- ${rec.trim()}`).join('\n');
      }
      body.push([formatHeader(key), formattedValue]);
    });

    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body,
      styles: { 
        fontSize: 8, 
        cellPadding: 1,
        minCellHeight: 6,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 8,
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      theme: 'grid',
      didParseCell(data) {
        if (data.section === 'body' && data.column.dataKey === 1 && typeof data.cell.raw === 'string' && data.cell.raw.includes('\n')) {
          data.cell.styles.cellPadding = 1;
          data.cell.text = data.cell.raw.split('\n');
        }
      }
    });
  }

  // Agregar espacio para firma al final de la última página
  y += 30; // Espacio adicional después del contenido
  
  // Posicionar la firma cerca del final de la página
  y = pageHeight - 30;
  
  // Línea para firma (línea azul simple)
  doc.setDrawColor(30, 77, 183); // Azul corporativo
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
  
  // Texto "FIRMA" debajo de la línea
  y += 5;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Negro
  doc.setFont('helvetica', 'normal');
  doc.text('FIRMA', pageWidth / 2, y, { align: 'center' });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Asegurar header en todas las páginas
    if (i > 1) {
      y = 40;
      y = addMainHeader(doc, pageWidth);
    }
    
    doc.setDrawColor(30, 77, 183);
    doc.setLineWidth(0.2);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Generado el: ${getFormattedDateTime()}`, 15, pageHeight - 10);
    doc.text(`Sistema de Gestión de Maquinaria`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  doc.save(`reporte_${maquinaria.placa || maquinaria.codigo || 'maquinaria'}.pdf`);
}


function exportPDFMasivo(data, filename = 'reporte') {
  const doc = new jsPDF({ 
    orientation: 'landscape',
    compress: true,
    precision: 2
  });
  let currentY = 20;

  // Función especial para tabla de depreciaciones
  function addDepreciacionTable(depreciaciones) {
    if (!depreciaciones || depreciaciones.length === 0) return;

    // Agregar nueva página si es necesario
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    // Título de la sección
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = 'Depreciación';
    const titleWidth = doc.getTextWidth(title) + 20;
    const titleX = 20;
    
    // Fondo azul para el título
    doc.setFillColor(30, 77, 183);
    doc.roundedRect(titleX, currentY - 3, titleWidth, 10, 2, 2, 'F');
    
    // Texto del título
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, titleX + 10, currentY + 2);
    
    // Agregar contador de registros
    const registrosText = `${depreciaciones.length} registros`;
    const registrosWidth = doc.getTextWidth(registrosText);
    const registrosX = pageWidth - 20 - registrosWidth - 10;
    
    // Fondo verde para el contador
    doc.setFillColor(40, 167, 69);
    doc.roundedRect(registrosX - 5, currentY - 3, registrosWidth + 10, 10, 2, 2, 'F');
    
    // Texto del contador
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(registrosText, registrosX, currentY + 2);
    
    currentY += 15;

    // Headers específicos para depreciación
    const headers = ['Año', 'Método', 'Valor Activo Fijo', 'Deprec. Acumulada', 'Valor Neto', 'Deprec. de la Gestión', 'Deprec. Acumulada Final', 'Valor Neto Final'];
    
    // Preparar datos
    const bodyData = [];
    depreciaciones.forEach(item => {
      if (item.depreciacion_por_anio && item.depreciacion_por_anio.length > 0) {
        item.depreciacion_por_anio.forEach(dep => {
          // Usar datos reales de la API con fallback a cálculos
          const deprecGestion = dep.deprec_gestion !== undefined ? dep.deprec_gestion : (dep.horas_periodo || 0) * (dep.depreciacion_por_hora || 0);
          const deprecAcumuladaFinal = dep.depreciacion_acumulada_final !== undefined ? dep.depreciacion_acumulada_final : 
            (dep.depreciacion_acumulada || 0) + (dep.incremento_actualizacion_depreciacion || 0) + deprecGestion;
          const valorNetoFinal = dep.valor_neto_final !== undefined ? dep.valor_neto_final : 
            (dep.valor_actualizado || Number(item.costo_activo) || 0) - deprecAcumuladaFinal;
          
          bodyData.push([
            dep.anio || '-',
            item.metodo_depreciacion === 'depreciacion_por_horas' ? 'Por Horas' : 
            item.metodo_depreciacion === 'linea_recta' ? 'Línea Recta' : 
            item.metodo_depreciacion || 'No definido',
            formatCurrency(Number(item.costo_activo) || 0),
            formatCurrency(dep.depreciacion_acumulada || 0),
            formatCurrency(dep.valor_en_libros || 0),
            formatCurrency(deprecGestion),
            formatCurrency(deprecAcumuladaFinal),
            formatCurrency(valorNetoFinal)
          ]);
        });
      }
    });

    if (bodyData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: bodyData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [30, 77, 183],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });

      currentY = doc.lastAutoTable.finalY + 15;
    }
  }

  // Función para agregar tabla
  function addTable(title, rows, fields = null, tablaKey = '') {
    console.log(`🔍 ADD TABLE: ${title}`, { rows, fields, tablaKey });
    if (!rows || rows.length === 0) {
      console.log(`🔍 NO HAY ROWS PARA ${title}`);
      return;
    }

    // Agregar nueva página si es necesario
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    // Título de la sección con contador de registros mejorado
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(title) + 20;
    const titleX = 20;
    
    // Fondo azul para el título
    doc.setFillColor(30, 77, 183);
    doc.roundedRect(titleX, currentY - 3, titleWidth, 10, 2, 2, 'F');
    
    // Texto del título
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, titleX + 10, currentY + 2);
    
    // Agregar contador de registros (estilo botón mejorado)
    const registrosText = `${rows.length} registros`;
    const registrosWidth = doc.getTextWidth(registrosText);
    const registrosX = pageWidth - 20 - registrosWidth - 10;
    
    // Fondo verde para el contador
    doc.setFillColor(40, 167, 69);
    doc.roundedRect(registrosX - 5, currentY - 3, registrosWidth + 10, 10, 2, 2, 'F');
    
    // Texto del contador
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(registrosText, registrosX, currentY + 2);
    
    currentY += 15;

    // Definir campos para cada tabla usando el archivo fields.js
    let tableFields = [];
    if (fields) {
      tableFields = fields;
      console.log(`🔍 CAMPOS ESPECÍFICOS PARA ${title}:`, tableFields);
    } else {
      switch (tablaKey) {
        case 'control':
          tableFields = controlFields; // Solo los campos de control, sin placa/detalle
          break;
        case 'asignacion':
          tableFields = asignacionFields; // Solo los campos de asignación, sin placa/detalle
          break;
        case 'liberacion':
          tableFields = liberacionFields; // Solo los campos de liberación, sin placa/detalle
          break;
        case 'mantenimiento':
          tableFields = mantenimientoFields; // Solo los campos de mantenimiento, sin placa/detalle
          break;
        case 'soat':
          tableFields = soatFields; // Solo los campos de SOAT, sin placa/detalle
          break;
        case 'seguros':
          tableFields = seguroFields; // Solo los campos de seguros, sin placa/detalle
          break;
        case 'itv':
          tableFields = itvFields; // Solo los campos de ITV, sin placa/detalle
          break;
        case 'impuestos':
          tableFields = impuestoFields; // Solo los campos de impuestos, sin placa/detalle
          break;
        case 'pronosticos':
          tableFields = pronosticoFields; // Solo los campos de pronósticos, sin placa/detalle
          break;
        default:
          tableFields = Object.keys(rows[0] || {}).map(key => ({ key, label: key }));
      }
      console.log(`🔍 CAMPOS SELECCIONADOS PARA ${title}:`, tableFields);
    }
    const existingFields = tableFields.filter(field => 
      field.key !== 'archivo_pdf' && // Excluir datos del archivo PDF, pero mantener nombre_archivo
      rows.some(row => row[field.key] !== undefined && row[field.key] !== null)
    );

    console.log(`🔍 CAMPOS EXISTENTES PARA ${title}:`, existingFields);
    console.log(`🔍 PRIMER ROW PARA ${title}:`, rows[0]);
    console.log(`🔍 TODOS LOS CAMPOS DISPONIBLES EN ROWS:`, rows.length > 0 ? Object.keys(rows[0]) : []);
    console.log(`🔍 CAMPOS DEFINIDOS EN FIELDS.JS:`, tableFields.map(f => f.key));

    if (existingFields.length === 0) {
      console.log(`🔍 NO HAY CAMPOS EXISTENTES PARA ${title}`);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay datos para mostrar', 20, currentY);
      currentY += 15;
      return;
    }

    // Preparar datos para la tabla
    const headers = existingFields.map(field => field.label);
    const tableData = rows.map(row => 
      existingFields.map(field => {
        let value = row[field.key];
        if (field.key === 'nombre_archivo' && value) {
          return value; // Solo mostrar el nombre del archivo sin formato especial
        }
        if (field.key.toLowerCase().includes('fecha') && value) {
          // Formatear fecha como DD/MM/YYYY
          if (typeof value === 'string' && value.includes('-')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            }
          }
          return fmt(value);
        }
        return value || '-';
      })
    );

    // Crear tabla con formato mejorado
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: tableData,
      styles: { 
        fontSize: 8, 
        cellPadding: 1,
        textColor: 33,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      pageBreak: 'auto',
      theme: 'grid',
      alternateRowStyles: { 
        fillColor: [248, 249, 250],
        textColor: 33
      },
      didParseCell: function(data) {
        // Formatear fechas para que se vean como botones
        if (data.section === 'body' && typeof data.cell.raw === 'string') {
          const cellText = data.cell.raw;
          if (cellText.includes('/') && cellText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            // Es una fecha, aplicar estilo de botón
            data.cell.styles.fillColor = [173, 216, 230]; // Azul claro
            data.cell.styles.textColor = [0, 0, 0]; // Texto negro
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.cellPadding = 2;
          }
        }
      },
      didDrawCell: function(data) {
        // Sin funcionalidad de enlaces de descarga
      }
    });

    // Sin funcionalidad de enlaces de descarga

    currentY = doc.lastAutoTable.finalY + 15;
  }

  // Debug: Ver qué datos están llegando
  console.log('🔍 DATOS PARA PDF:', data);
  console.log('🔍 CAMPOS ASIGNACIÓN:', asignacionFields);
  console.log('🔍 CAMPOS LIBERACIÓN:', liberacionFields);

  // Orden fijo de secciones (coherente con tu UI)
  if (data.maquinaria?.length) addTable('Maquinaria', data.maquinaria, maquinariaFields, 'maquinaria');

  const tablas = [
    { key: 'control', label: 'Control' },
    { key: 'asignacion', label: 'Asignación' },
    { key: 'liberacion', label: 'Liberación' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
    { key: 'soat', label: 'SOAT' },
    { key: 'seguros', label: 'Seguros' },
    { key: 'itv', label: 'ITV' },
    { key: 'impuestos', label: 'Impuestos' },
    { key: 'depreciaciones', label: 'Depreciación', fields: null },
    { key: 'pronosticos', label: 'Pronóstico' },
  ];

  for (const t of tablas) {
    console.log(`🔍 PROCESANDO TABLA ${t.key}:`, data[t.key]);
    if (data[t.key]?.length) {
      console.log(`🔍 AGREGANDO TABLA ${t.key} con ${data[t.key].length} registros`);
      if (t.key === 'depreciaciones') {
        // Manejo especial para depreciaciones con las 8 columnas
        addDepreciacionTable(data[t.key]);
      } else {
        addTable(t.label, data[t.key], t.fields || null, t.key);
      }
    } else {
      console.log(`🔍 TABLA ${t.key} NO TIENE DATOS`);
    }
  }

  // Agregar página de resumen
  doc.addPage();
  
  // Configuración de página
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;
  
  // Título principal del resumen
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 77, 183); // Azul corporativo
  doc.text('RESUMEN DEL REPORTE', pageWidth / 2, y, { align: 'center' });
  y += 20;
  
  // Línea separadora
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;
  
  // Información general
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMACIÓN GENERAL', margin, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de generación: ${getFormattedDateTime()}`, margin, y);
  y += 6;
  doc.text(`Total de páginas: ${doc.internal.getNumberOfPages() - 1}`, margin, y);
  y += 6;
  doc.text(`Sistema: Gestión de Maquinaria COFADENA`, margin, y);
  y += 15;
  
  // Resumen de datos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE DATOS', margin, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Contar registros por tabla
  const resumenDatos = [];
  if (data.maquinaria?.length) resumenDatos.push(`Maquinaria: ${data.maquinaria.length} registros`);
  if (data.control?.length) resumenDatos.push(`Control: ${data.control.length} registros`);
  if (data.asignacion?.length) resumenDatos.push(`Asignación: ${data.asignacion.length} registros`);
  if (data.liberacion?.length) resumenDatos.push(`Liberación: ${data.liberacion.length} registros`);
  if (data.mantenimiento?.length) resumenDatos.push(`Mantenimiento: ${data.mantenimiento.length} registros`);
  if (data.soat?.length) resumenDatos.push(`SOAT: ${data.soat.length} registros`);
  if (data.seguros?.length) resumenDatos.push(`Seguros: ${data.seguros.length} registros`);
  if (data.itv?.length) resumenDatos.push(`ITV: ${data.itv.length} registros`);
  if (data.impuestos?.length) resumenDatos.push(`Impuestos: ${data.impuestos.length} registros`);
  if (data.depreciaciones?.length) resumenDatos.push(`Depreciaciones: ${data.depreciaciones.length} registros`);
  if (data.pronosticos?.length) resumenDatos.push(`Pronósticos: ${data.pronosticos.length} registros`);
  
  // Mostrar resumen en columnas
  const columnWidth = (pageWidth - 2 * margin) / 2;
  resumenDatos.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + (column * columnWidth);
    const itemY = y + (row * 6);
    
    if (itemY < pageHeight - 80) { // Evitar que se salga de la página
      doc.text(item, x, itemY);
    }
  });
  
  // Posicionar firmas casi al final de la página
  y = pageHeight - 50;
  
  // Título de firmas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FIRMAS', pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  // Configuración de firmas
  const firmas = [
    'ENCARGADO DE ACTIVOS FIJOS',
    'JEFE DE LA UNIDAD ADMINISTRATIVA', 
    'GERENTE DE LA UNIDAD'
  ];
  
  const firmaWidth = (pageWidth - 60) / firmas.length; // 60 es el margen total (30 + 30)
  
  // Dibujar todas las firmas en la misma línea horizontal
  firmas.forEach((firma, index) => {
    const x = 30 + (index * firmaWidth) + (firmaWidth / 2);
    let firmaY = y; // Posición fija para todos los títulos
    
    // Título de la firma
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(firma, x, firmaY, { align: 'center' });
    
    // Línea para firma (misma posición Y para todos)
    firmaY = y + 10;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(x - 25, firmaY, x + 25, firmaY);
    
    // Línea de puntos (misma posición Y para todos)
    firmaY = y + 16;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('........................................................................', x, firmaY, { align: 'center' });
  });

  // pie de página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(30, 77, 183); doc.setLineWidth(0.2);
    doc.line(18, pageY - 5, pageWidth - 18, pageY - 5);
    doc.setFontSize(8); doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageY, { align: 'center' });
    doc.text(`Generado el: ${getFormattedDateTime()}`, 18, pageY);
    doc.text(`Sistema de Gestión de Maquinaria`, pageWidth - 18, pageY, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}

// Función específica para exportar tabla de depreciación detallada
export const exportTablaDepreciacionPDF = (data, filename = 'tabla_depreciacion') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    precision: 2
  });
  
  // Configuración de página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Encabezado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLA DE DEPRECIACIÓN DETALLADA', pageWidth / 2, margin + 5, { align: 'center' });
  
  // Información de la maquinaria
  if (data.maquinaria) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let y = margin + 20;
    
    // Centrar la información de la maquinaria
    const infoWidth = 80;
    const startX = (pageWidth - infoWidth * 2) / 2;
    
    doc.text(`Placa: ${data.maquinaria.placa || '-'}`, startX, y);
    doc.text(`Código: ${data.maquinaria.codigo || '-'}`, startX + infoWidth, y);
    
    y += 8;
    doc.text(`Detalle: ${data.maquinaria.detalle || '-'}`, startX, y);
    doc.text(`Costo del Activo: Bs. ${(data.maquinaria.costo_activo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, startX + infoWidth, y);
    
    y += 8;
    doc.text(`Fecha de Compra: ${data.maquinaria.fecha_compra || '-'}`, startX, y);
    doc.text(`Vida Útil: ${data.maquinaria.vida_util || '-'} años`, startX + infoWidth, y);
    
    // Campos específicos para depreciación por horas
    if (data.maquinaria.metodo === 'depreciacion_por_horas') {
      doc.text(`UFV Inicial: ${data.maquinaria.ufv_inicial || '-'}`, margin + 60, y);
      doc.text(`UFV Final: ${data.maquinaria.ufv_final || '-'}`, margin + 120, y);
      doc.text(`Horas Período: ${data.maquinaria.horas_periodo || '-'}`, margin + 180, y);
      
      y += 8;
      doc.text(`Depreciación por Hora: Bs. ${(data.maquinaria.depreciacion_por_hora || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, margin, y);
    }
  }
  
  // Tabla de depreciación con formato de 2 columnas
  let y = margin + 50;
  
  // Preparar datos para la tabla con formato de 2 columnas (Campo, Valor)
  const tableData = [];
  
  // Obtener datos de depreciación (usar datos por defecto si no hay depreciaciones)
  const item = data.depreciaciones && data.depreciaciones.length > 0 ? data.depreciaciones[0] : {};
  
  // Debug: Verificar datos
  console.log('🔍 Datos para tabla de depreciación:', {
    maquinaria: data.maquinaria,
    depreciaciones: data.depreciaciones,
    item: item
  });
    
    // Calcular valores según las fórmulas
    const precioMaquinaria = parseFloat(data.maquinaria?.costo_activo) || 0;
    const placa = data.maquinaria?.placa || '';
    const horas = item.horas_periodo || 0;
    const valorActivoFijo = precioMaquinaria;
    const deprecAcumulada = item.acumulado || 0;
    const valorNeto = valorActivoFijo - deprecAcumulada;
    const deprecPorHora = parseFloat(data.maquinaria?.depreciacion_por_hora) || 0;
    
    // Factor UFV
    const ufvInicial = parseFloat(data.maquinaria?.ufv_inicial) || 0;
    const ufvFinal = parseFloat(data.maquinaria?.ufv_final) || 0;
    const factorUfv = ufvInicial > 0 ? ufvFinal / ufvInicial : 1;
    
    const incrementoActualizacion = valorActivoFijo * (factorUfv - 1);
    const valorActualizado = valorActivoFijo * factorUfv;
    const incrementoDeprecAcum = deprecAcumulada * (factorUfv - 1);
    const deprecGestion = horas * deprecPorHora;
    const deprecAcumuladaFinal = deprecAcumulada + incrementoDeprecAcum + deprecGestion;
    const valorNetoFinal = valorActualizado - deprecAcumuladaFinal;
    
    // Crear filas con formato Campo-Valor
    const campos = [
      { campo: 'PRECIO MAQUINARIA', valor: `Bs. ${precioMaquinaria.toFixed(2)}` },
      { campo: 'PLACAS', valor: placa },
      { campo: 'HORAS', valor: horas.toFixed(2) },
      { campo: 'VALOR ACTIVO FIJO', valor: `Bs. ${valorActivoFijo.toFixed(2)}` },
      { campo: 'DEPRECIACIÓN ACUMULADA', valor: `Bs. ${deprecAcumulada.toFixed(2)}` },
      { campo: 'VALOR NETO', valor: `Bs. ${valorNeto.toFixed(2)}` },
      { campo: 'DEPRECIACIÓN BS/HORA', valor: `Bs. ${deprecPorHora.toFixed(2)}` },
      { campo: 'INCREMENTO POR ACTUALIZACIÓN ACTIVO FIJO', valor: `Bs. ${incrementoActualizacion.toFixed(2)}` },
      { campo: 'VALOR ACTUALIZADO', valor: `Bs. ${valorActualizado.toFixed(2)}` },
      { campo: 'INCREMENTO ACTUALIZACIÓN DEPRECIACIÓN ACUMULADA', valor: `Bs. ${incrementoDeprecAcum.toFixed(2)}` },
      { campo: 'DEPRECIACIÓN DE LA GESTIÓN', valor: `Bs. ${deprecGestion.toFixed(2)}` },
      { campo: 'DEPRECIACIÓN ACUMULADA FINAL', valor: `Bs. ${deprecAcumuladaFinal.toFixed(2)}` },
      { campo: 'VALOR NETO FINAL', valor: `Bs. ${valorNetoFinal.toFixed(2)}` }
    ];
    
    // Convertir a formato de tabla
    campos.forEach(campo => {
      tableData.push([campo.campo, campo.valor]);
    });
    
    // Crear la tabla con formato de 2 columnas centrada
    const tableMargin = 30; // Márgenes más amplios para centrar mejor
    autoTable(doc, {
      head: [['CAMPO', 'VALOR']],
      body: tableData,
      startY: y,
      margin: { left: tableMargin, right: tableMargin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 77, 183],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 100 }, // CAMPO - más ancho
        1: { halign: 'right', cellWidth: 50 }  // VALOR - más ancho
      }
    });
  
  // Agregar firmas específicas para depreciación
  const lastPage = doc.internal.getNumberOfPages();
  doc.setPage(lastPage);
  
  // Posicionar firmas con más espacio después de la tabla
  y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 17 : pageHeight - 80;
  
  // Configuración de firmas para depreciación
  const firmasDepreciacion = [
    'TÉCNICO DE ACTIVOS FIJOS',
    'ENCARGADO DE ACTIVOS FIJOS'
  ];
  
  const firmaWidth = (pageWidth - 60) / firmasDepreciacion.length;
  
  // Dibujar firmas
  firmasDepreciacion.forEach((firma, index) => {
    const x = 30 + (index * firmaWidth) + (firmaWidth / 2);
    let firmaY = y;
    
    // Título de la firma
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(firma, x, firmaY, { align: 'center' });
    
    // Línea para firma
    firmaY = y + 10;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(x - 25, firmaY, x + 25, firmaY);
    
    // Línea de puntos
    firmaY = y + 16;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('........................................................................', x, firmaY, { align: 'center' });
  });
  
  // Pie de página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(30, 77, 183);
    doc.setLineWidth(0.2);
    doc.line(18, pageY - 5, pageWidth - 18, pageY - 5);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageY, { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleString('es-BO')}`, 18, pageY);
    doc.text(`Sistema de Gestión de Maquinaria`, pageWidth - 18, pageY, { align: 'right' });
  }
  
  doc.save(`${filename}.pdf`);
};

export default exportPDF;
export { exportPDFMasivo };