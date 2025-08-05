import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
import { maquinariaFields, depFields} from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

// Función para crear un sello/carimbo elegante
function createElegantStamp(doc, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2 - 2;
  
  // Círculo exterior del sello
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.5);
  doc.circle(centerX, centerY, radius, 'S');
  
  // Círculo interior
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.2);
  doc.circle(centerX, centerY, radius - 3, 'S');
  
  // Líneas decorativas internas
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.1);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const startX = centerX + Math.cos(angle) * (radius - 8);
    const startY = centerY + Math.sin(angle) * (radius - 8);
    const endX = centerX + Math.cos(angle) * (radius - 15);
    const endY = centerY + Math.sin(angle) * (radius - 15);
    doc.line(startX, startY, endX, endY);
  }
  
  // Punto central
  doc.setFillColor(30, 77, 183);
  doc.circle(centerX, centerY, 1, 'F');
}

// Función para crear un dashboard visual simple
function createSimpleDashboard(doc, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Rectángulo principal
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height, 'S');
  
  // Líneas divisorias internas
  doc.setLineWidth(0.1);
  doc.line(x, centerY, x + width, centerY);
  doc.line(centerX, y, centerX, y + height);
  
  // Puntos en las esquinas
  doc.setFillColor(30, 77, 183);
  doc.circle(x + 3, y + 3, 1, 'F');
  doc.circle(x + width - 3, y + 3, 1, 'F');
  doc.circle(x + 3, y + height - 3, 1, 'F');
  doc.circle(x + width - 3, y + height - 3, 1, 'F');
  
  // Líneas decorativas
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.2);
  doc.line(x + 8, y + 8, x + 12, y + 8);
  doc.line(x + width - 12, y + 8, x + width - 8, y + 8);
  doc.line(x + 8, y + height - 8, x + 12, y + height - 8);
  doc.line(x + width - 12, y + height - 8, x + width - 8, y + height - 8);
}

// Función para obtener fecha y hora formateada
function getFormattedDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return now.toLocaleDateString('es-ES', options);
}

// Función para obtener solo la fecha
function getFormattedDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return now.toLocaleDateString('es-ES', options);
}

// Función para obtener solo la hora
function getFormattedTime() {
  const now = new Date();
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return now.toLocaleTimeString('es-ES', options);
}

function exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // === ENCABEZADO SIMPLE ===
  const logoWidth = 38, logoHeight = 24;
  const logoY = 15, logoX = 18;
  
  // Logo
  const img = new Image();
  img.src = logoCofa;
  doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
  
  // Información institucional
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const lines = [
    'MINISTERIO DE DEFENSA',
    'CORPORACIÓN DE LAS FF.AA. PARA EL DESARROLLO NACIONAL',
    'EMPRESA PÚBLICA NACIONAL ESTRATÉGICA'
  ];
  const lineHeight = 7;
  const totalTextHeight = lines.length * lineHeight;
  const textY = logoY + (logoHeight - totalTextHeight) / 2 + 5;
  const textMarginLeft = logoX + logoWidth + 10;
  const textMarginRight = 18;
  const textWidth = pageWidth - textMarginLeft - textMarginRight;
  
  lines.forEach((line, i) => {
    doc.text(line, textMarginLeft + textWidth / 2, textY + i * lineHeight, { align: 'center' });
  });
  
  // === LÍNEA SEPARADORA ===
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.5);
  doc.line(18, logoY + logoHeight + 8, pageWidth - 18, logoY + logoHeight + 8);
  
  // === TÍTULO DEL REPORTE ===
  let y = logoY + logoHeight + 20;
  
  // === SECCIÓN DE DATOS PRINCIPALES ===
  doc.setFontSize(14);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos de la Maquinaria', pageWidth / 2, y, { align: 'center' });
  y += 9;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 33, 33);
  doc.text('A continuación se presentan los datos principales de la maquinaria seleccionada.', 40, y, { maxWidth: pageWidth - 80 });
  y += 9;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const maqRows = maquinariaFields.map(f => [f.label, maquinaria[f.key] || 'No se encontraron datos']);
  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: maqRows,
    styles: { fontSize: 10, cellPadding: 2, rowHeight: 10 },
    headStyles: { fillColor: [30, 77, 183], textColor: 255 },
    bodyStyles: { textColor: 33 },
    margin: { left: 40, right: 40 },
    tableLineColor: [30, 77, 183],
    tableLineWidth: 0.2,
    pageBreak: 'avoid',
  });
  y = doc.lastAutoTable.finalY + 6;
  
  // === FUNCIÓN PARA RENDERIZAR SECCIONES ===
  function renderSection(title, data, opts = {}) {
    if (title === 'Mantenimiento') {
      doc.addPage();
      y = 20;
      
      // Repetir encabezado en nueva página
    }
    
    doc.setFontSize(13);
    doc.setTextColor(30, 77, 183);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 9;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    let intro = '';
    switch (title) {
      case 'Control':
        intro = 'Esta sección muestra los controles realizados sobre la maquinaria.';
        break;
      case 'Asignación':
        intro = 'Aquí se detallan las asignaciones históricas de la maquinaria.';
        break;
      case 'Mantenimiento':
        intro = 'Se listan los mantenimientos realizados y programados para la maquinaria.';
        break;
      case 'SOAT':
        intro = 'Información sobre el seguro SOAT vigente o histórico de la maquinaria.';
        break;
      case 'Seguros':
        intro = 'Detalle de otros seguros asociados a la maquinaria.';
        break;
      case 'ITV':
        intro = 'Resultados de las inspecciones técnicas vehiculares (ITV) realizadas.';
        break;
      case 'Impuestos':
        intro = 'Historial de pagos y obligaciones tributarias de la maquinaria.';
        break;
      default:
        intro = '';
    }
    if (intro) {
      doc.text(intro, 40, y, { maxWidth: pageWidth - 80 });
      y += 9;
    }
    doc.setFont('helvetica', 'bold');
    if (!data || data.length === 0) {
      autoTable(doc, {
        startY: y,
        head: [['Mensaje']],
        body: [['No se encontraron datos']],
        styles: { fontSize: 10, cellPadding: 2, rowHeight: 10 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 },
        tableLineColor: [30, 77, 183],
        tableLineWidth: 0.2,
        pageBreak: 'avoid',
      });
      y = doc.lastAutoTable.finalY + 6;
      return;
    }
    let rows = data.map(cleanRow);
    let keys = Object.keys(rows[0] || {});
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
    let tableOptions = {
      startY: y,
      head: [keys.map(formatHeader)],
      body: rows.map(r => keys.map(k => r[k] ?? 'No se encontraron datos')),
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 10 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 40, right: 40 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      pageBreak: 'avoid',
    };
    if (opts.pronostico) {
      keys = keys.filter(k => k !== 'fecha_creacion');
      rows = rows.map(r => {
        if (r.recomendaciones) {
          if (Array.isArray(r.recomendaciones)) {
            r.recomendaciones = r.recomendaciones.slice(0, 3).map(rec => `- ${rec}`).join('\n');
          } else if (typeof r.recomendaciones === 'string') {
            r.recomendaciones = r.recomendaciones.split(';').slice(0, 3).map(rec => `- ${rec.trim()}`).join('\n');
          }
        }
        return r;
      });
      tableOptions = {
        ...tableOptions,
        margin: { left: 20, right: 20 },
        columnStyles: {
          recomendaciones: { cellWidth: 120 }
        },
        didParseCell: function (data) {
          if (data.column.dataKey === 'recomendaciones') {
            data.cell.styles.cellPadding = 2;
            data.cell.text = data.cell.raw.split('\n');
          }
        },
        pageBreak: 'avoid',
      };
    }
    autoTable(doc, tableOptions);
    y = doc.lastAutoTable.finalY + 6;
  }
  
  // Renderizar todas las secciones
  renderSection('Control', control);
  renderSection('Asignación', asignacion);
  renderSection('Mantenimiento', mantenimiento);
  renderSection('SOAT', soat);
  renderSection('Seguros', seguros);
  renderSection('ITV', itv);
  renderSection('Impuestos', impuestos);
  
  // === SECCIÓN DE DEPRECIACIÓN ===
  doc.addPage();
  y = 20;
  
  // Repetir encabezado
  doc.setFontSize(12);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DETALLADO DE MAQUINARIA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('Tabla de Depreciación Anual', pageWidth / 2, y, { align: 'center' });
  y += 9;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 33, 33);
  doc.text('La siguiente tabla muestra el cálculo de la depreciación anual, la depreciación acumulada y el valor en libros de la maquinaria para cada año.', 40, y, { maxWidth: pageWidth - 80 });
  y += 9;
  doc.setFont('helvetica', 'bold');
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
    autoTable(doc, {
      startY: y,
      head: [['Año', 'Valor Anual Depreciado', 'Depreciación Acumulada', 'Valor en Libros']],
      body: depAnual.map(row => [
        row.anio ?? '-',
        formatCurrency(row.valor_anual_depreciado ?? row.valor),
        formatCurrency(row.depreciacion_acumulada),
        formatCurrency(row.valor_en_libros)
      ]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 40, right: 40 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text('No se encontraron datos de depreciación anual para esta maquinaria.', 40, y, { maxWidth: pageWidth - 80 });
    y += 9;
    doc.setFont('helvetica', 'bold');
    if (!depreciaciones?.length) {
      autoTable(doc, {
        startY: y,
        head: [['Mensaje']],
        body: [['No se encontraron datos']],
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 }
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      const depData = depreciaciones.map(dep => {
        const cleaned = {};
        depFields.forEach(f => {
          const value = dep[f.key];
          cleaned[f.label] = f.key.toLowerCase().includes('fecha')
            ? formatDateOnly(value)
            : value || '-';
        });
        return cleaned;
      });
      const keys = Object.keys(depData[0] || {});
      autoTable(doc, {
        startY: y,
        head: [keys],
        body: depData.map(r => keys.map(k => r[k])),
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 }
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }
  
  // === SECCIÓN DE PRONÓSTICOS ===
  doc.addPage();
  y = 20;
  
  // Repetir encabezado
  doc.setFontSize(12);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DETALLADO DE MAQUINARIA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('Pronósticos', pageWidth / 2, y, { align: 'center' });
  y += 9;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 33, 33);
  doc.text('En esta sección se presentan los pronósticos de mantenimiento y riesgo para la maquinaria, incluyendo recomendaciones específicas.', 40, y, { maxWidth: pageWidth - 80 });
  y += 9;
  doc.setFont('helvetica', 'bold');
  const pronosticosSinFecha = pronosticos.map(p => {
    const { fecha_creacion, creado_en, ...rest } = p;
    return rest;
  });
  function renderPronosticoTable(title, data) {
    if (!data || data.length === 0) {
      autoTable(doc, {
        startY: y,
        head: [['Mensaje']],
        body: [['No se encontraron datos']],
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 },
        tableLineColor: [30, 77, 183],
        tableLineWidth: 0.2,
      });
      y = doc.lastAutoTable.finalY + 6;
      return;
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
    // Formato vertical para pronósticos
    const header = ['Campo', 'Valor'];
    const body = cleanedData.map(r => {
      const campos = [];
      keys.forEach(k => {
        if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
          campos.push([formatHeader(k), r[k]]);
        }
      });
      return campos;
    }).flat();
    
    autoTable(doc, {
      startY: y,
      head: [header],
      body,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      columnStyles: {
        0: { cellWidth: '40%' },
        1: { cellWidth: '60%' }
      },
      didParseCell: function (data) {
        // Permitir saltos de línea en las celdas de recomendaciones
        if (data.section === 'body' && data.column.dataKey === 1) {
          const cellValue = data.cell.raw;
          if (typeof cellValue === 'string' && cellValue.includes('\n')) {
            data.cell.styles.cellPadding = 3;
            data.cell.text = cellValue.split('\n');
          }
        }
      }
    });
    y = doc.lastAutoTable.finalY + 6;
  }
  renderPronosticoTable('Pronósticos', pronosticosSinFecha);
  
  // === PIE DE PÁGINA CON INFORMACIÓN ADICIONAL ===
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageY = doc.internal.pageSize.getHeight() - 10;
    
    // Línea separadora
    doc.setDrawColor(30, 77, 183);
    doc.setLineWidth(0.2);
    doc.line(18, pageY - 5, pageWidth - 18, pageY - 5);
    
    // Información del pie de página
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageY, { align: 'center' });
    doc.text(`Generado el: ${getFormattedDateTime()}`, 18, pageY);
    doc.text(`Sistema de Gestión de Maquinaria`, pageWidth - 18, pageY, { align: 'right' });
  }
  
  doc.save(`reporte_${maquinaria.placa || maquinaria.codigo || 'maquinaria'}.pdf`);
}

// NUEVA FUNCIÓN PARA EXPORTACIÓN MASIVA HORIZONTAL
function exportPDFMasivo(data, filename = 'reporte') {
  const doc = new jsPDF({ orientation: 'landscape' });
  let page = 0;

  // Helper para crear tabla horizontal con formato de dos columnas
  function addTable(title, rows, fields = null, tablaKey = '') {
    if (!rows || rows.length === 0) return;
    if (page > 0) doc.addPage();
    page++;
    
    doc.setFontSize(13);
    doc.setTextColor(30, 77, 183);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 18);
    
    let keys = fields ? fields.map(f => f.key) : Object.keys(rows[0] || {});
    // Para tablas que no son maquinaria, usar solo campos específicos
    if (tablaKey && tablaKey !== 'maquinaria') {
      const camposPermitidos = {
        control: ['placa', 'detalle', 'ubicacion', 'gerente', 'encargado', 'hoja_tramite', 'fecha_ingreso', 'observacion', 'estado'],
        asignacion: ['placa', 'detalle', 'fecha_asignacion', 'fecha_liberacion', 'recorrido_km', 'recorrido_entregado', 'encargado'],
        mantenimiento: ['placa', 'detalle', 'tipo', 'cantidad', 'gestion', 'ubicacion', 'registrado_por', 'validado_por', 'autorizado_por'],
        soat: ['placa', 'detalle', 'importe_2024', 'importe_2025'],
        seguros: ['placa', 'detalle', 'numero_2024', 'importe', 'detalle'],
        itv: ['placa', 'detalle', 'detalle', 'importe'],
        impuestos: ['placa', 'detalle', 'importe_2023', 'importe_2024'],
        pronosticos: ['riesgo', 'resultado', 'probabilidad', 'fecha_asig', 'recorrido', 'horas_op', 'recomendaciones', 'fecha_mantenimiento', 'fecha_recordatorio', 'dias_hasta_mantenimiento', 'urgencia']
      };
      
      // Obtener los campos permitidos para esta tabla
      const camposTabla = camposPermitidos[tablaKey] || ['placa', 'detalle'];
      
      // Filtrar solo los campos que existen en los datos y excluir fechas
      keys = camposTabla.filter(campo => 
        rows.some(row => row[campo] !== undefined) &&
        campo !== 'fecha_creacion' &&
        campo !== 'fecha_actualizacion'
      );
    }
    
    // Para pronósticos usar formato vertical, para el resto horizontal
    let header, body;
    if (tablaKey === 'pronosticos' || title.toLowerCase().includes('pronóstico') || title.toLowerCase().includes('pronostico')) {
      // Formato vertical solo para pronósticos
      header = ['Campo', 'Valor'];
      body = [];
      
      // Procesar cada registro individualmente
      rows.forEach(r => {
        const campos = [];
        keys.forEach(k => {
          if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
            // Formatear fechas correctamente
            let valor = r[k];
            if (k.toLowerCase().includes('fecha') && valor) {
              valor = formatDateOnly(valor);
            }
            // Para recomendaciones, mostrar solo las primeras 3 con formato de lista
            if (k === 'recomendaciones' && valor) {
              if (Array.isArray(valor)) {
                valor = valor.slice(0, 3).map(rec => `• ${rec}`).join('\n');
              } else if (typeof valor === 'string') {
                valor = valor.split(';').slice(0, 3).map(rec => `• ${rec.trim()}`).join('\n');
              }
            }
            campos.push([formatHeader(k), valor]);
          }
        });
        body.push(...campos);
      });
    } else {
      // Formato horizontal para el resto de tablas
      header = keys.map(formatHeader);
      body = rows.map(r => {
        return keys.map(k => {
          if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
            // Formatear fechas correctamente
            let valor = r[k];
            if (k.toLowerCase().includes('fecha') && valor) {
              valor = formatDateOnly(valor);
            }
            return valor;
          }
          return '';
        });
      });
    }
    
     autoTable(doc, {
       startY: 24,
       head: [header],
       body,
       styles: { fontSize: 8, cellPadding: 2 },
       headStyles: { fillColor: [30, 77, 183], textColor: 255 },
       bodyStyles: { textColor: 33 },
       margin: { left: 10, right: 10 },
       tableLineColor: [30, 77, 183],
       tableLineWidth: 0.2,
       pageBreak: 'auto',
       theme: 'grid',
       columnStyles: (tablaKey === 'pronosticos' || title.toLowerCase().includes('pronóstico') || title.toLowerCase().includes('pronostico')) ? {
         0: { cellWidth: '40%' },
         1: { cellWidth: '60%' }
       } : {},
       didParseCell: (tablaKey === 'pronosticos' || title.toLowerCase().includes('pronóstico') || title.toLowerCase().includes('pronostico')) ? function (data) {
         // Permitir saltos de línea en las celdas de recomendaciones
         if (data.section === 'body' && data.column.dataKey === 1) {
           const cellValue = data.cell.raw;
           if (typeof cellValue === 'string' && cellValue.includes('\n')) {
             data.cell.styles.cellPadding = 3;
             data.cell.text = cellValue.split('\n');
           }
         }
       } : undefined,
     });
  }

  // Maquinaria
  if (data.maquinaria && data.maquinaria.length > 0) {
    addTable('Maquinaria', data.maquinaria, maquinariaFields, 'maquinaria');
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
      addTable(t.label, data[t.key], null, t.key);
    }
  }

  doc.save(`${filename}.pdf`);
}

export default exportPDF;
export { exportPDFMasivo }; 