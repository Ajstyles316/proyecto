// importaciones corregidas para ESM
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
import { maquinariaFields, depFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

// ================= utilidades =================

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

// Llaves de deduplicado por módulo (clave para Pronóstico)
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

// Anchos de columnas (evita saltos innecesarios)
const COLUMN_WIDTHS = {
  pronosticos: {
    0: { cellWidth: '12%' }, // Placa
    1: { cellWidth: '15%' }, // Detalle
    2: { cellWidth: '12%' }, // Fecha Asignación
    3: { cellWidth: '8%' },  // Horas Operación
    4: { cellWidth: '8%' },  // Recorrido
    5: { cellWidth: '8%' },  // Resultado
    6: { cellWidth: '8%' },  // Riesgo
    7: { cellWidth: '8%' },  // Probabilidad
    8: { cellWidth: '12%' }, // Fecha Mantenimiento
    9: { cellWidth: '8%' },  // Urgencia
    10:{ cellWidth: '15%' }, // Recomendaciones
  },
};

// Funciones de sello y dashboard (se mantienen por si las usas luego)
function createElegantStamp(doc, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2 - 2;
  doc.setDrawColor(30, 77, 183); doc.setLineWidth(0.5); doc.circle(centerX, centerY, radius, 'S');
  doc.setLineWidth(0.2); doc.circle(centerX, centerY, radius - 3, 'S');
  doc.setLineWidth(0.1);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const startX = centerX + Math.cos(angle) * (radius - 8);
    const startY = centerY + Math.sin(angle) * (radius - 8);
    const endX = centerX + Math.cos(angle) * (radius - 15);
    const endY = centerY + Math.sin(angle) * (radius - 15);
    doc.line(startX, startY, endX, endY);
  }
  doc.setFillColor(30, 77, 183); doc.circle(centerX, centerY, 1, 'F');
}

function createSimpleDashboard(doc, x, y, width, height) {
  const centerX = x + width / 2; const centerY = y + height / 2;
  doc.setDrawColor(30, 77, 183); doc.setLineWidth(0.3); doc.rect(x, y, width, height, 'S');
  doc.setLineWidth(0.1); doc.line(x, centerY, x + width, centerY); doc.line(centerX, y, centerX, y + height);
  doc.setFillColor(30, 77, 183);
  doc.circle(x + 3, y + 3, 1, 'F'); doc.circle(x + width - 3, y + 3, 1, 'F');
  doc.circle(x + 3, y + height - 3, 1, 'F'); doc.circle(x + width - 3, y + height - 3, 1, 'F');
  doc.setDrawColor(30, 77, 183); doc.setLineWidth(0.2);
  doc.line(x + 8, y + 8, x + 12, y + 8); doc.line(x + width - 12, y + 8, x + width - 8, y + 8);
  doc.line(x + 8, y + height - 8, x + 12, y + height - 8); doc.line(x + width - 12, y + height - 8, x + width - 8, y + height - 8);
}

// fecha/hora
function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ================= export individual =================

function exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Encabezado (logo + títulos)
  const logoWidth = 38, logoHeight = 24;
  const logoY = 15, logoX = 18;
  const img = new Image(); img.src = logoCofa;
  doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
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

  doc.setDrawColor(30, 77, 183); doc.setLineWidth(0.5);
  doc.line(18, logoY + logoHeight + 8, pageWidth - 18, logoY + logoHeight + 8);

  let y = logoY + logoHeight + 20;

  // Datos de la Maquinaria
  doc.setFontSize(14); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
  doc.text('Datos de la Maquinaria', pageWidth / 2, y, { align: 'center' }); y += 9;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 33, 33);
  doc.text('A continuación se presentan los datos principales de la maquinaria seleccionada.', 40, y, { maxWidth: pageWidth - 80 }); y += 9;

  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
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

  // Render genérico de sección
  function renderSection(title, data, opts = {}) {
    // título visible para Control
    const titleVisible = title === 'Control' ? 'Control y Seguimiento' : title;

    doc.setFontSize(13); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
    doc.text(titleVisible, pageWidth / 2, y, { align: 'center' }); y += 9;

    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 33, 33);
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
    if (intro) { doc.text(intro, 40, y, { maxWidth: pageWidth - 80 }); y += 9; }

    if (!data || data.length === 0) {
      autoTable(doc, {
        startY: y, head: [['Mensaje']], body: [['No se encontraron datos']],
        styles: { fontSize: 10, cellPadding: 2, rowHeight: 10 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 },
        tableLineColor: [30, 77, 183], tableLineWidth: 0.2, pageBreak: 'avoid',
      });
      y = doc.lastAutoTable.finalY + 6;
      return;
    }

    // limpieza y columnas
    let rows = ensureArray(data).map(cleanRow);
    let keys = Object.keys(rows[0] || {});
    if (opts.skipDates) keys = keys.filter(k => !k.toLowerCase().includes('creacion') && !k.toLowerCase().includes('actualizacion'));

    // tabla
    autoTable(doc, {
      startY: y,
      head: [keys.map(formatHeader)],
      body: rows.map(r => keys.map(k => r[k] ?? 'No se encontraron datos')),
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 10 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 40, right: 40 },
      tableLineColor: [30, 77, 183], tableLineWidth: 0.2,
      pageBreak: 'auto',
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Secciones
  renderSection('Control', control);
  renderSection('Asignación', asignacion);
  renderSection('Mantenimiento', mantenimiento);
  renderSection('SOAT', soat);
  renderSection('Seguros', seguros);
  renderSection('ITV', itv);
  renderSection('Impuestos', impuestos);

  // Depreciación (se mantiene)
  doc.addPage(); y = 20;
  doc.setFontSize(12); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DETALLADO DE MAQUINARIA', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(13); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
  doc.text('Tabla de Depreciación Anual', pageWidth / 2, y, { align: 'center' }); y += 9;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 33, 33);
  doc.text('La siguiente tabla muestra el cálculo de la depreciación anual, la depreciación acumulada y el valor en libros.', 40, y, { maxWidth: pageWidth - 80 }); y += 9;

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
        row.anio ?? '-', formatCurrency(row.valor_anual_depreciado ?? row.valor),
        formatCurrency(row.depreciacion_acumulada), formatCurrency(row.valor_en_libros)
      ]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 40, right: 40 },
      tableLineColor: [30, 77, 183], tableLineWidth: 0.2
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 33, 33);
    doc.text('No se encontraron datos de depreciación anual para esta maquinaria.', 40, y, { maxWidth: pageWidth - 80 }); y += 9;
    if (!depreciaciones?.length) {
      autoTable(doc, {
        startY: y, head: [['Mensaje']], body: [['No se encontraron datos']],
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
          cleaned[f.label] = f.key.toLowerCase().includes('fecha') ? formatDateOnly(value) : (value || '-');
        });
        return cleaned;
      });
      const keys = Object.keys(depData[0] || {});
      autoTable(doc, {
        startY: y, head: [keys], body: depData.map(r => keys.map(k => r[k])),
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [30, 77, 183], textColor: 255 },
        bodyStyles: { textColor: 33 },
        margin: { left: 40, right: 40 }
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // Pronósticos (individual) – deduplicado y formato vertical limpio
  doc.addPage(); y = 20;
  doc.setFontSize(12); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DETALLADO DE MAQUINARIA', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(13); doc.setTextColor(30, 77, 183); doc.setFont('helvetica', 'bold');
  doc.text('Pronósticos', pageWidth / 2, y, { align: 'center' }); y += 9;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 33, 33);
  doc.text('En esta sección se presentan los pronósticos de mantenimiento y riesgo para la maquinaria.', 40, y, { maxWidth: pageWidth - 80 }); y += 9;

  const pronosticosClean = ensureArray(pronosticos).map(({ fecha_creacion, creado_en, ...rest }) => rest);
  const pronDedupe = dedupeBy(pronosticosClean, DEDUPE_KEYS.pronosticos);

  if (!pronDedupe.length) {
    autoTable(doc, {
      startY: y, head: [['Mensaje']], body: [['No se encontraron datos']],
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 40, right: 40 },
    });
  } else {
    const cleanedData = pronDedupe.map(item => {
      const cleaned = {};
      Object.entries(item).forEach(([key, value]) => {
        if (key === 'id' || key === '_id' || key.endsWith('_id')) return;
        if (key === 'recomendaciones') {
          if (Array.isArray(value)) cleaned[key] = value.slice(0, 3).map(rec => `- ${rec}`).join('\n');
          else if (typeof value === 'string') cleaned[key] = value.split(';').slice(0, 3).map(rec => `- ${rec.trim()}`).join('\n');
          else cleaned[key] = '-';
        } else if (key.toLowerCase().includes('fecha') && value) {
          cleaned[key] = formatDateOnly(value);
        } else {
          cleaned[key] = value ?? '-';
        }
      });
      return cleaned;
    });

    const keys = Object.keys(cleanedData[0] || {});
    const header = ['Campo', 'Valor'];
    const body = cleanedData.flatMap(r =>
      keys
        .filter(k => r[k] !== undefined && r[k] !== null && r[k] !== '')
        .map(k => [formatHeader(k), r[k]])
    );

    autoTable(doc, {
      startY: y,
      head: [header],
      body,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183], tableLineWidth: 0.2,
      didParseCell(data) {
        // multilínea para recomendaciones
        if (data.section === 'body' && data.column.dataKey === 1) {
          const cellValue = data.cell.raw;
          if (typeof cellValue === 'string' && cellValue.includes('\n')) {
            data.cell.styles.cellPadding = 3;
            data.cell.text = cellValue.split('\n');
          }
        }
      }
    });
  }

  // Pie de página
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

  doc.save(`reporte_${maquinaria.placa || maquinaria.codigo || 'maquinaria'}.pdf`);
}

// ================= export masivo =================

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
