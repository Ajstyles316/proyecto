import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
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
  // Configuración del logo
  const logoWidth = 38;
  const logoHeight = 24;
  const logoX = 18;
  const logoY = 15;
  doc.addImage(logoCofa, 'PNG', logoX, logoY, logoWidth, logoHeight);

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
  const textY = logoY + (logoHeight - totalTextHeight) / 2 + 5;
  const textMarginLeft = logoX + logoWidth + 10;
  const textMarginRight = 18;
  const textWidth = pageWidth - textMarginLeft - textMarginRight;
  lines.forEach((line, i) => doc.text(line, textMarginLeft + textWidth / 2, textY + i * lineHeight, { align: 'center' }));


  // Línea divisoria
  doc.setDrawColor(30, 77, 183);
  doc.setLineWidth(0.5);
  doc.line(18, logoY + logoHeight + 8, pageWidth - 18, logoY + logoHeight + 8);

  // Retornar la altura total del header
  return textY + lines.length * lineHeight + 10;
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
  
  const doc = new jsPDF();
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
        fontSize: 9, 
        cellPadding: 2,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9,
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.3,
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
        fontSize: 9, 
        cellPadding: 2,
        minCellHeight: 8,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.3,
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
    autoTable(doc, {
      startY: y,
      head: [['Año', 'Valor Anual Depreciado', 'Depreciación Acumulada', 'Valor en Libros']],
      body: depAnual.map(row => [
        row.anio ?? '-', 
        formatCurrency(row.valor_anual_depreciado ?? row.valor),
        formatCurrency(row.depreciacion_acumulada), 
        formatCurrency(row.valor_en_libros)
      ]),
      styles: { 
        fontSize: 9, 
        cellPadding: 2,
        minCellHeight: 8,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.3,
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
        fontSize: 9, 
        cellPadding: 2,
        minCellHeight: 8,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9,
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.3,
      theme: 'grid',
      didParseCell(data) {
        if (data.section === 'body' && data.column.dataKey === 1 && typeof data.cell.raw === 'string' && data.cell.raw.includes('\n')) {
          data.cell.styles.cellPadding = 2;
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
  const doc = new jsPDF({ orientation: 'landscape' });
  let currentY = 20;

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
      field.key !== 'archivo_pdf' && // Excluir solo columna de archivo PDF del PDF exportado
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
        fontSize: 9, 
        cellPadding: 3,
        textColor: 33,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [30, 77, 183], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        textColor: 33,
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.3,
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
            data.cell.styles.cellPadding = 4;
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
    { key: 'depreciaciones', label: 'Depreciación', fields: depFields },
    { key: 'pronosticos', label: 'Pronóstico' },
  ];

  for (const t of tablas) {
    console.log(`🔍 PROCESANDO TABLA ${t.key}:`, data[t.key]);
    if (data[t.key]?.length) {
      console.log(`🔍 AGREGANDO TABLA ${t.key} con ${data[t.key].length} registros`);
      addTable(t.label, data[t.key], t.fields || null, t.key);
    } else {
      console.log(`🔍 TABLA ${t.key} NO TIENE DATOS`);
    }
  }

  // pie de página
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
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

export default exportPDF;
export { exportPDFMasivo };