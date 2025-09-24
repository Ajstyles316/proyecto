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

// Función global para aplicar estilos avanzados
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

function exportXLS(data, filename = 'reporte') {
  const wb = XLSX.utils.book_new();

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

// Función específica para exportar Hoja de Vida
export const exportHojaVidaExcel = (data, filename = 'hoja_vida') => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Datos de Maquinaria
  if (data.maquinaria) {
    const maquinariaData = [
      ['HOJA DE VIDA HISTORIAL DE MANTENIMIENTO'],
      [''],
      ['DATOS DE MAQUINARIA'],
      [''],
      ['Campo', 'Valor'],
      ['Equipo', data.maquinaria.detalle || ''],
      ['Placa', data.maquinaria.placa || ''],
      ['Marca', data.maquinaria.marca || ''],
      ['Modelo', data.maquinaria.modelo || ''],
      ['Chasis', data.maquinaria.nro_chasis || ''],
      ['Tipo', data.maquinaria.tipo || ''],
      ['Color', data.maquinaria.color || ''],
      ['Tracción', data.maquinaria.tipo_vehiculo || ''],
      ['No. del Motor', data.maquinaria.nro_motor || ''],
      ['Estado', 'OPERABLE']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(maquinariaData);
    applyAdvancedStyles(ws1, true);
    XLSX.utils.book_append_sheet(wb, ws1, 'Datos Maquinaria');
  }

  // Hoja 2: Depreciaciones - Tabla de Depreciación Anual
  if (data.depreciaciones && data.depreciaciones.length > 0) {
    const depData = [];
    
    data.depreciaciones.forEach(item => {
      const costoActivo = parseFloat(item.costo_activo) || 0;
      const vidaUtil = parseInt(item.vida_util) || 1;
      const depreciacionAnual = costoActivo / vidaUtil;
      
      // Valor inicial al principio
      depData.push(['VALOR INICIAL:', costoActivo.toLocaleString('es-BO', { minimumFractionDigits: 2 }), '', '']);
      
      // Encabezados
      depData.push([
        'AÑO',
        'DEPRECIACIÓN ANUAL',
        'DEPRECIACIÓN ACUMULADA',
        'VALOR RESIDUAL'
      ]);
      
      for (let año = 1; año <= vidaUtil; año++) {
        const depreciacionAcumulada = depreciacionAnual * año;
        const valorResidual = costoActivo - depreciacionAcumulada;
        
        depData.push([
          año,
          depreciacionAnual.toLocaleString('es-BO', { minimumFractionDigits: 2 }),
          depreciacionAcumulada.toLocaleString('es-BO', { minimumFractionDigits: 2 }),
          valorResidual.toLocaleString('es-BO', { minimumFractionDigits: 2 })
        ]);
      }
      
      // Separador entre depreciaciones
      depData.push(['', '', '', '']);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(depData);
    applyAdvancedStyles(ws2, true);
    XLSX.utils.book_append_sheet(wb, ws2, 'Depreciaciones');
  }

  // Hoja 3: Pronósticos - Campos reales de la BD
  if (data.pronosticos && data.pronosticos.length > 0) {
    const pronosticoHeaders = [
      'PLACA',
      'FECHA ASIGNACIÓN',
      'HORAS OPERACIÓN',
      'RECORRIDO',
      'RESULTADO',
      'RIESGO',
      'PROBABILIDAD',
      'FECHA SUGERIDA',
      'FECHA MANTENIMIENTO',
      'FECHA RECORDATORIO',
      'DÍAS HASTA MANTENIMIENTO',
      'URGENCIA'
    ];
    
    const pronosticoData = data.pronosticos.map(item => [
      item.placa || '',
      formatDateOnly(item.fecha_asig),
      item.horas_op ? item.horas_op.toLocaleString('es-BO') : '',
      item.recorrido ? item.recorrido.toLocaleString('es-BO') : '',
      item.resultado || '',
      item.riesgo || '',
      item.probabilidad || '',
      formatDateOnly(item.fecha_sugerida),
      formatDateOnly(item.fecha_mantenimiento),
      formatDateOnly(item.fecha_recordatorio),
      item.dias_hasta_mantenimiento || '',
      item.urgencia || ''
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet([pronosticoHeaders, ...pronosticoData]);
    applyAdvancedStyles(ws3, true);
    XLSX.utils.book_append_sheet(wb, ws3, 'Pronósticos');
  }

  // Hoja 4: Mantenimientos - EXACTAMENTE como en la imagen
  if (data.mantenimientos && data.mantenimientos.length > 0) {
    const mantenimientoData = [];
    
    data.mantenimientos.forEach(item => {
      // Primera fila de encabezados principales (solo hasta columna K)
      mantenimientoData.push([
        'FECHA',
        'N° SALIDA MATERIALES',
        'DESCRIPCIÓN DAÑOS/EVENTOS',
        'REPARACIÓN REALIZADA',
        'COSTO TOTAL (Bs.)',
        'HOR/KM',
        'OPERADOR',
        'ATENDIDO POR',
        'ENCARGADO ACTIVOS FIJOS',
        'UNIDAD/EMPRESA',
        'UBICACIÓN FÍSICO/PROYECTO'
      ]);

      // Segunda fila con datos principales (solo hasta columna K)
      mantenimientoData.push([
        formatDateOnly(item.fecha_mantenimiento),
        item.numero_salida_materiales || '',
        item.descripcion_danos_eventos || '',
        item.reparacion_realizada || '',
        item.costo_total ? item.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '',
        item.horas_kilometros ? item.horas_kilometros.toLocaleString('es-BO') : '',
        item.operador || '',
        item.atendido_por || '',
        item.encargado_activos_fijos || '',
        item.unidad_empresa || '',
        item.ubicacion_fisico_proyecto || ''
      ]);

      // Filas vacías antes de comenzar las subsecciones (solo hasta columna K)
      mantenimientoData.push(['', '', '', '', '', '', '', '', '', '', '']);
      mantenimientoData.push(['', '', '', '', '', '', '', '', '', '', '']);

      // Encabezados de subsecciones - TIPO en columna A (fila 4)
      mantenimientoData.push([
        'TIPO',
        'CANTIDAD',
        'NÚMERO/TIPO',
        'CAMBIO (HR/KM)',
        'NÚMERO FILTRO/DESCRI'
      ]);

      // NUMERO DE LLANTA (como en la imagen)
      if (item.tipo_desplazamiento_cantidad || item.tipo_desplazamiento_numero_llanta || item.tipo_desplazamiento_numero_llanta_delantera || item.tipo_desplazamiento_vida_util) {
        mantenimientoData.push([
          'NUMERO DE LLAN',
          item.tipo_desplazamiento_cantidad || '',
          '',
          item.tipo_desplazamiento_vida_util || '',
          item.tipo_desplazamiento_numero_llanta_delantera || ''
        ]);
      }

      // SISTEMA ELECTRICO (como en la imagen)
      if (item.cantidad_sistema_electrico || item.voltaje_sistema_electrico || item.amperaje_sistema_electrico || item.vida_util_sistema_electrico) {
        mantenimientoData.push([
          'SISTEMA ELECTRIC',
          item.cantidad_sistema_electrico || '',
          '',
          item.vida_util_sistema_electrico || '',
          item.voltaje_sistema_electrico || ''
        ]);
      }

      // ACEITE DE MOTOR (como en la imagen)
      if (item.aceite_motor_cantidad || item.aceite_motor_numero || item.aceite_motor_cambio_km_hr || item.aceite_motor_numero_filtro) {
        mantenimientoData.push([
          'ACEITE DE MOTOR',
          item.aceite_motor_cantidad || '',
          '',
          item.aceite_motor_cambio_km_hr || '',
          item.aceite_motor_numero_filtro || ''
        ]);
      }

      // ACEITE DE HIDRAULICO (como en la imagen)
      if (item.aceite_hidraulico_cantidad || item.aceite_hidraulico_numero || item.aceite_hidraulico_cambio_km_hr || item.aceite_hidraulico_numero_filtro) {
        mantenimientoData.push([
          'ACEITE DE HIDRAU',
          item.aceite_hidraulico_cantidad || '',
          '',
          item.aceite_hidraulico_cambio_km_hr || '',
          item.aceite_hidraulico_numero_filtro || ''
        ]);
      }

      // ACEITE DE TRANSMISION (como en la imagen)
      if (item.aceite_transmision_cantidad || item.aceite_transmision_numero || item.aceite_transmision_cambio_km_hr || item.aceite_transmision_numero_filtro) {
        mantenimientoData.push([
          'ACEITE DE TRANSN',
          item.aceite_transmision_cantidad || '',
          '',
          item.aceite_transmision_cambio_km_hr || '',
          item.aceite_transmision_numero_filtro || ''
        ]);
      }

      // LIQUIDO DE FRENO (como en la imagen)
      if (item.liquido_freno_cantidad || item.liquido_freno_numero) {
        mantenimientoData.push([
          'LIQUIDO DE FRENC',
          item.liquido_freno_cantidad || '',
          '',
          '',
          ''
        ]);
      }

      // LIQUIDO REFRIGERANTE (como en la imagen)
      if (item.liquido_refrigerante_tipo || item.liquido_refrigerante_cantidad_lt || item.liquido_refrigerante_frecuencia_cambio) {
        mantenimientoData.push([
          'LIQUIDO REFRIGER',
          item.liquido_refrigerante_cantidad_lt || '',
          '',
          item.liquido_refrigerante_frecuencia_cambio || '',
          ''
        ]);
      }

      // OTROS ACEITES (como en la imagen)
      if (item.otros_aceites_tipo || item.otros_aceites_cantidad_lt || item.otros_aceites_frecuencia_cambio) {
        mantenimientoData.push([
          'OTROS ACEITES',
          item.otros_aceites_cantidad_lt || '',
          '',
          item.otros_aceites_frecuencia_cambio || '',
          ''
        ]);
      }

      // SISTEMA DE COMBUSTIBLE (como en la imagen)
      if (item.gasolina || item.gasolina_cantidad_lt || item.cantidad_filtros || item.codigo_filtro_combustible) {
        mantenimientoData.push([
          'SISTEMA DE COMB',
          item.gasolina_cantidad_lt || '',
          item.gasolina || '',
          '',
          item.codigo_filtro_combustible || ''
        ]);
      }

      // OTROS FILTROS (como en la imagen)
      if (item.otros_filtros_cantidad || item.otros_filtros_numero || item.otros_filtros_cambio || item.otros_filtros_descripcion) {
        mantenimientoData.push([
          'OTROS FILTROS',
          item.otros_filtros_cantidad || '',
          '',
          item.otros_filtros_cambio || '',
          item.otros_filtros_descripcion || ''
        ]);
      }

      // Fila separadora
      mantenimientoData.push(['---', '', '', '', '']);
    });

    const ws4 = XLSX.utils.aoa_to_sheet(mantenimientoData);
    applyAdvancedStyles(ws4, true);
    XLSX.utils.book_append_sheet(wb, ws4, 'Mantenimientos');
  }

  // Hoja 5: Control
  if (data.control && data.control.length > 0) {
    const controlHeaders = ['FECHA INICIO', 'FECHA FINAL', 'PROYECTO', 'UBICACIÓN', 'ESTADO', 'TIEMPO', 'OPERADOR'];
    const controlData = data.control.map(item => [
      formatDateOnly(item.fecha_inicio),
      formatDateOnly(item.fecha_final),
      item.proyecto || '',
      item.ubicacion || '',
      item.estado || '',
      item.tiempo || '',
      item.operador || ''
    ]);

    const ws5 = XLSX.utils.aoa_to_sheet([controlHeaders, ...controlData]);
    applyAdvancedStyles(ws5, true);
    XLSX.utils.book_append_sheet(wb, ws5, 'Control');
  }

  // Hoja 6: Asignación
  if (data.asignacion && data.asignacion.length > 0) {
    const asignacionHeaders = ['UNIDAD', 'FECHA ASIGNACIÓN', 'KILOMETRAJE', 'GERENTE', 'ENCARGADO'];
    const asignacionData = data.asignacion.map(item => [
      item.unidad || '',
      formatDateOnly(item.fecha_asignacion),
      item.kilometraje || '',
      item.gerente || '',
      item.encargado || ''
    ]);

    const ws6 = XLSX.utils.aoa_to_sheet([asignacionHeaders, ...asignacionData]);
    applyAdvancedStyles(ws6, true);
    XLSX.utils.book_append_sheet(wb, ws6, 'Asignación');
  }

  // Hoja 7: Liberación
  if (data.liberacion && data.liberacion.length > 0) {
    const liberacionHeaders = ['UNIDAD', 'FECHA LIBERACIÓN', 'KILOMETRAJE ENTREGADO', 'GERENTE', 'ENCARGADO'];
    const liberacionData = data.liberacion.map(item => [
      item.unidad || '',
      formatDateOnly(item.fecha_liberacion),
      item.kilometraje_entregado || '',
      item.gerente || '',
      item.encargado || ''
    ]);

    const ws7 = XLSX.utils.aoa_to_sheet([liberacionHeaders, ...liberacionData]);
    applyAdvancedStyles(ws7, true);
    XLSX.utils.book_append_sheet(wb, ws7, 'Liberación');
  }

  // Hoja 8: Seguros
  if (data.seguros && data.seguros.length > 0) {
    const segurosHeaders = ['FECHA INICIAL', 'FECHA FINAL', 'Nº PÓLIZA', 'COMPAÑÍA ASEGURADORA', 'IMPORTE', 'ARCHIVO'];
    const segurosData = data.seguros.map(item => [
      formatDateOnly(item.fecha_inicial),
      formatDateOnly(item.fecha_final),
      item.numero_poliza || '',
      item.compania_aseguradora || '',
      item.importe ? item.importe.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '',
      item.nombre_archivo || ''
    ]);

    const ws8 = XLSX.utils.aoa_to_sheet([segurosHeaders, ...segurosData]);
    applyAdvancedStyles(ws8, true);
    XLSX.utils.book_append_sheet(wb, ws8, 'Seguros');
  }

  // Hoja 9: ITV
  if (data.itv && data.itv.length > 0) {
    const itvHeaders = ['GESTIÓN', 'ARCHIVO'];
    const itvData = data.itv.map(item => [
      item.gestion || '',
      item.nombre_archivo || ''
    ]);

    const ws9 = XLSX.utils.aoa_to_sheet([itvHeaders, ...itvData]);
    applyAdvancedStyles(ws9, true);
    XLSX.utils.book_append_sheet(wb, ws9, 'ITV');
  }

  // Hoja 10: SOAT
  if (data.soat && data.soat.length > 0) {
    const soatHeaders = ['GESTIÓN', 'ARCHIVO'];
    const soatData = data.soat.map(item => [
      item.gestion || '',
      item.nombre_archivo || ''
    ]);

    const ws10 = XLSX.utils.aoa_to_sheet([soatHeaders, ...soatData]);
    applyAdvancedStyles(ws10, true);
    XLSX.utils.book_append_sheet(wb, ws10, 'SOAT');
  }

  // Hoja 11: Impuestos
  if (data.impuestos && data.impuestos.length > 0) {
    const impuestosHeaders = ['GESTIÓN', 'ARCHIVO'];
    const impuestosData = data.impuestos.map(item => [
      item.gestion || '',
      item.nombre_archivo || ''
    ]);

    const ws11 = XLSX.utils.aoa_to_sheet([impuestosHeaders, ...impuestosData]);
    applyAdvancedStyles(ws11, true);
    XLSX.utils.book_append_sheet(wb, ws11, 'Impuestos');
  }

  // Generar y descargar el archivo
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Función específica para exportar tabla de depreciación detallada
export const exportTablaDepreciacionExcel = (data, filename = 'tabla_depreciacion') => {
  const wb = XLSX.utils.book_new();
  
  // Hoja 1: Información de la maquinaria
  const infoHeaders = ['CAMPO', 'VALOR'];
  const infoData = [
    ['Placa', data.maquinaria?.placa || '-'],
    ['Código', data.maquinaria?.codigo || '-'],
    ['Detalle', data.maquinaria?.detalle || '-'],
    ['Costo del Activo', `Bs. ${(data.maquinaria?.costo_activo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`],
    ['Fecha de Compra', data.maquinaria?.fecha_compra || '-'],
    ['Método', data.maquinaria?.metodo || '-'],
    ['Vida Útil', `${data.maquinaria?.vida_util || '-'} años`]
  ];
  
  // Agregar campos específicos para depreciación por horas
  if (data.maquinaria?.metodo === 'depreciacion_por_horas') {
    infoData.push(
      ['UFV Inicial', data.maquinaria?.ufv_inicial || '-'],
      ['UFV Final', data.maquinaria?.ufv_final || '-'],
      ['Horas Período', data.maquinaria?.horas_periodo || '-'],
      ['Depreciación por Hora', `Bs. ${(data.maquinaria?.depreciacion_por_hora || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`]
    );
  }
  
  const ws1 = XLSX.utils.aoa_to_sheet([infoHeaders, ...infoData]);
  applyAdvancedStyles(ws1, true);
  XLSX.utils.book_append_sheet(wb, ws1, 'Información');
  
  // Hoja 2: Tabla de depreciación
  if (data.tabla_depreciacion && data.tabla_depreciacion.length > 0) {
    const isDepreciacionPorHoras = data.maquinaria?.metodo === 'depreciacion_por_horas';
    
    let headers = ['Año', 'Valor Anual Depreciado', 'Depreciación Acumulada', 'Valor en Libros'];
    if (isDepreciacionPorHoras) {
      headers.push('Valor Actualizado', 'Horas Período', 'Depreciación/Hora', 'Valor Activo Fijo', 'Incremento Activo', 'Incremento Deprec.', 'Costo/Hora Efectiva');
    }
    
    const tableData = data.tabla_depreciacion.map(item => {
      const row = [
        item.anio || '-',
        item.valor || 0,
        item.acumulado || 0,
        item.valor_en_libros || 0
      ];
      
      if (isDepreciacionPorHoras) {
        row.push(
          item.valor_actualizado || 0,
          item.horas_periodo || 0,
          item.depreciacion_por_hora || 0,
          item.valor_activo_fijo || 0,
          item.incremento_actualizacion_activo || 0,
          item.incremento_actualizacion_depreciacion || 0,
          item.costo_por_hora_efectiva || 0
        );
      }
      
      return row;
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet([headers, ...tableData]);
    applyAdvancedStyles(ws2, true);
    XLSX.utils.book_append_sheet(wb, ws2, 'Tabla Depreciación');
  }
  
  // Generar y descargar el archivo
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export default exportXLS; 