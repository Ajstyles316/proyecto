import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
import { maquinariaFields, depFields} from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

function exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoWidth = 38, logoHeight = 24;
  const logoY = 10, logoX = 18;
  const img = new Image();
  img.src = logoCofa;
  doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
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
  let y = logoY + logoHeight + 12;
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
  doc.setFontSize(16);
  doc.setTextColor(30, 77, 183);
  doc.setFont('helvetica', 'bold');
  function renderSection(title, data, opts = {}) {
    if (title === 'Mantenimiento') {
      doc.addPage();
      y = 20;
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
  renderSection('Control', control);
  renderSection('Asignación', asignacion);
  renderSection('Mantenimiento', mantenimiento);
  renderSection('SOAT', soat);
  renderSection('Seguros', seguros);
  renderSection('ITV', itv);
  renderSection('Impuestos', impuestos);
  doc.addPage();
  y = 20;
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
  doc.addPage();
  y = 20;
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
    autoTable(doc, {
      startY: y,
      head: [keys.map(formatHeader)],
      body: cleanedData.map(r => keys.map(k => r[k])),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 77, 183], textColor: 255 },
      bodyStyles: { textColor: 33 },
      margin: { left: 20, right: 20 },
      tableLineColor: [30, 77, 183],
      tableLineWidth: 0.2,
      columnStyles: {
        recomendaciones: { cellWidth: 120 }
      }
    });
    y = doc.lastAutoTable.finalY + 6;
  }
  renderPronosticoTable('Pronósticos', pronosticosSinFecha);
  doc.save(`reporte_${maquinaria.placa || maquinaria.codigo || 'maquinaria'}.pdf`);
}

export default exportPDF; 