import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { maquinariaFields, depFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

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
  doc.setFontSize(12);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  return y + 7;
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

function exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos }) {
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

  const maqRows = maquinariaFields.map(f => [f.label, maquinaria[f.key] || 'No se encontraron datos']);
  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: maqRows,
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

    const rows = ensureArray(data).map(cleanRow);
    const keys = Object.keys(rows[0] || {});
    
    let filteredKeys = [];
    
    if (title === 'Asignación') {
      filteredKeys = ['placa', 'recorrido_km', 'recorrido_entregado', 'encargado', 'fecha_asignacion', 'fecha_liberacion']
        .filter(k => keys.includes(k));
    } else {
      filteredKeys = keys.filter(k =>
        !k.toLowerCase().includes('creacion') &&
        !k.toLowerCase().includes('actualizacion') &&
        !columnsToRemove.includes(k) &&
        !['fecha_desactivacion', 'fecha_reactivacion'].includes(k.toLowerCase())
      );
    }

    if (filteredKeys.length === 0) return;

    autoTable(doc, {
      startY: y,
      head: [filteredKeys.map(formatHeader)],
      body: rows.map(r => filteredKeys.map(k => fmt(r[k]) || '-')),
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
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      pageBreak: 'auto',
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  const sections = [
    { key: 'control', title: 'Control', intro: 'Esta sección muestra los controles realizados sobre la maquinaria.' },
    { key: 'asignacion', title: 'Asignación', intro: 'Aquí se detallan las asignaciones históricas de la maquinaria.' },
    { key: 'mantenimiento', title: 'Mantenimiento', intro: 'Se listan los mantenimientos realizados y programados para la maquinaria.' },
    { key: 'soat', title: 'SOAT', intro: 'Información sobre el seguro SOAT vigente o histórico de la maquinaria.' },
    { key: 'seguros', title: 'Seguros', intro: 'Detalle de otros seguros asociados a la maquinaria.' },
    { key: 'itv', title: 'ITV', intro: 'Resultados de las inspecciones técnicas vehiculares (ITV) realizadas.' },
    { key: 'impuestos', title: 'Impuestos', intro: 'Historial de pagos y obligaciones tributarias de la maquinaria.' },
  ];

  const dataMap = { control, asignacion, mantenimiento, soat, seguros, itv, impuestos };

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
      margin: { left: 30, right: 30 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2
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
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      didParseCell(data) {
        if (data.section === 'body' && data.column.dataKey === 1 && typeof data.cell.raw === 'string' && data.cell.raw.includes('\n')) {
          data.cell.styles.cellPadding = 1.5;
          data.cell.text = data.cell.raw.split('\n');
        }
      }
    });
  }

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
  let sectionIndex = 0;

  // helper tabla por sección (una tabla por módulo, deduplicada)
  function addTable(title, rows, fields = null, tablaKey = '') {
    const raw = ensureArray(rows);
    if (!raw.length) return;

    // deduplicado por módulo
    const deduped = dedupeBy(raw, DEDUPE_KEYS[tablaKey]);

    if (sectionIndex > 0) doc.addPage();
    sectionIndex++;

    // título visible (Control => Control y Seguimiento)
    const visibleTitle = tablaKey === 'control' ? 'Control y Seguimiento' : title;
    doc.setFontSize(13); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
    doc.text(`${visibleTitle} (${deduped.length})`, 14, 18);

    // columnas
    let keys = fields ? fields.map(f => f.key) : Object.keys(deduped[0] || {});

    if (tablaKey && tablaKey !== 'maquinaria' && !fields) {
      const camposPermitidos = {
        control: ['placa', 'detalle', 'ubicacion', 'gerente', 'encargado', 'hoja_tramite', 'fecha_ingreso', 'observacion', 'estado'],
        asignacion: ['placa', 'detalle', 'fecha_asignacion', 'fecha_liberacion', 'recorrido_km', 'recorrido_entregado', 'encargado'],
        mantenimiento: ['placa', 'detalle', 'tipo', 'cantidad', 'gestion', 'ubicacion', 'registrado_por', 'validado_por', 'autorizado_por'],
        soat: ['placa', 'detalle', 'importe_2024', 'importe_2025'],
        seguros: ['placa', 'detalle', 'numero_2024', 'importe', 'detalle_seg'],
        // itv puede venir como 'detalle' o 'detalle_itv'
        itv: ['placa', 'detalle', 'detalle_itv', 'importe'],
        impuestos: ['placa', 'detalle', 'importe_2023', 'importe_2024'],
        depreciaciones: ['placa', 'detalle', 'costo_activo', 'fecha_compra', 'vida_util', 'bien_uso', 'metodo_depreciacion', 'valor_residual', 'coeficiente'],
        pronosticos: ['placa', 'detalle', 'fecha_asig', 'horas_op', 'recorrido', 'resultado', 'riesgo', 'probabilidad', 'fecha_mantenimiento', 'urgencia', 'recomendaciones'],
      };

      // elegir columnas que existan
      const candidatos = camposPermitidos[tablaKey] || ['placa', 'detalle'];
      keys = candidatos.filter(c => deduped.some(r => r[c] !== undefined && r[c] !== null));
      // excluir metadata
      keys = keys.filter(k => !/fecha_creacion|fecha_actualizacion|^id$|^_id$|_id$/.test(k));
    }

    let head, body, columnStyles = {};
    if (tablaKey === 'pronosticos') {
      // encabezado fijo para pronósticos (horizontal)
      head = [['Placa', 'Detalle', 'Fecha Asignación', 'Horas Operación', 'Recorrido', 'Resultado', 'Riesgo', 'Probabilidad', 'Fecha Mantenimiento', 'Urgencia', 'Recomendaciones']];
      body = deduped.map(r => [
        r.placa || '',
        r.detalle || '',
        fmt(r.fecha_asig),
        r.horas_op ?? '',
        r.recorrido ?? '',
        r.resultado ?? '',
        r.riesgo ?? '',
        r.probabilidad ?? '',
        fmt(r.fecha_mantenimiento),
        r.urgencia ?? '',
        Array.isArray(r.recomendaciones) ? r.recomendaciones.slice(0, 3).join('; ') : (r.recomendaciones || '')
      ]);
      columnStyles = COLUMN_WIDTHS.pronosticos;
    } else {
      head = [keys.map(formatHeader)];
      body = deduped.map(r => keys.map(k => {
        let v = r[k];
        if (k.toLowerCase().includes('fecha')) v = fmt(v);
        return v ?? '';
      }));
    }

    autoTable(doc, {
      startY: 24,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 10, right: 10 },
      tableLineColor: [30, 77, 183], tableLineWidth: 0.2,
      pageBreak: 'auto',
      theme: 'grid',
      columnStyles,
      didParseCell: tablaKey === 'pronosticos' ? function (data) {
        // multilínea para recomendaciones
        if (data.section === 'body' && data.column.dataKey === 10) {
          const cellValue = data.cell.raw;
          if (typeof cellValue === 'string' && cellValue.includes(';')) {
            data.cell.styles.cellPadding = 3;
            data.cell.text = cellValue.split(';').map(rec => rec.trim());
          }
        }
      } : undefined,
    });
  }

  // Orden fijo de secciones (coherente con tu UI)
  if (data.maquinaria?.length) addTable('Maquinaria', data.maquinaria, maquinariaFields, 'maquinaria');

  const tablas = [
    { key: 'control', label: 'Control' },
    { key: 'asignacion', label: 'Asignación' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
    { key: 'soat', label: 'SOAT' },
    { key: 'seguros', label: 'Seguros' },
    { key: 'itv', label: 'ITV' },
    { key: 'impuestos', label: 'Impuestos' },
    { key: 'depreciaciones', label: 'Depreciación', fields: depFields },
    { key: 'pronosticos', label: 'Pronóstico' },
  ];

  for (const t of tablas) {
    if (data[t.key]?.length) {
      addTable(t.label, data[t.key], t.fields || null, t.key);
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