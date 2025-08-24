import * as XLSX from 'xlsx';
import { maquinariaFields } from './fields';
import { formatDateOnly, cleanRow, formatHeader, formatCurrency, calcularDepreciacionAnual } from './exportHelpers';

function exportXLS(data, filename = 'reporte') {
  const wb = XLSX.utils.book_new();

  // Helper para crear hoja horizontal con formato de dos columnas
  function horizontalSheet(title, rows, fields = null) {
    if (!rows || rows.length === 0) return null;
    let keys = fields ? fields.map(f => f.key) : Object.keys(rows[0] || {});
    
    // Para pronósticos usar formato vertical, para el resto horizontal
    let header, body;
    if (tablaKey === 'pronosticos') {
      // Formato vertical solo para pronósticos
      header = ['Campo', 'Valor'];
      body = rows.map(r => {
        const campos = [];
        keys.forEach(k => {
          if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
            // Formatear fechas correctamente
            let valor = r[k];
            if (k.toLowerCase().includes('fecha') && valor) {
              valor = formatDateOnly(valor);
            }
            // Para recomendaciones, mostrar solo las primeras 3
            if (k === 'recomendaciones' && valor) {
              if (Array.isArray(valor)) {
                valor = valor.slice(0, 3).map(rec => `- ${rec}`).join('\n');
              } else if (typeof valor === 'string') {
                valor = valor.split(';').slice(0, 3).map(rec => `- ${rec.trim()}`).join('\n');
              }
            }
            campos.push([formatHeader(k), valor]);
          }
        });
        return campos;
      }).flat();
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
    
    return XLSX.utils.aoa_to_sheet([
      header,
      ...body
    ]);
  }

  // Maquinaria
  if (data.maquinaria && Array.isArray(data.maquinaria) && data.maquinaria.length > 0) {
    if (data.maquinaria.length === 1) {
      // Hoja vertical tipo ficha para una sola maquinaria
      const maq = data.maquinaria[0];
      const ficha = maquinariaFields.map(f => [f.label, maq[f.key] ?? '']);
      const fichaSheet = XLSX.utils.aoa_to_sheet([
        ['Campo', 'Valor'],
        ...ficha
      ]);
      XLSX.utils.book_append_sheet(wb, fichaSheet, 'Datos de la Maquinaria');
    } else {
      // Capitalizar método y otros campos string para varias maquinarias
      const maquis = data.maquinaria.map(row => {
        const obj = { ...row };
        Object.keys(obj).forEach(k => {
          if ((k === 'metodo' || k === 'método') && typeof obj[k] === 'string') {
            obj[k] = (obj[k].toLowerCase() === 'linea_recta') ? 'Línea Recta' : obj[k].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else if (typeof obj[k] === 'string') {
            // Si el string ya tiene espacios y parece estar bien formateado, devolverlo tal como está
            if (obj[k].includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(obj[k])) {
              // No hacer nada, mantener el string tal como está
            } else if (obj[k].includes('_')) {
              obj[k] = obj[k].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            } else {
              obj[k] = obj[k].charAt(0).toUpperCase() + obj[k].slice(1).toLowerCase();
            }
          }
        });
        return obj;
      });
      const maqSheet = horizontalSheet('Maquinaria', maquis, maquinariaFields);
      if (maqSheet) XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
    }
  } else if (!data.maquinaria || (Array.isArray(data.maquinaria) && data.maquinaria.length === 0)) {
    // Solo si realmente no hay datos, agrega la hoja vacía
    const maqSheet = XLSX.utils.aoa_to_sheet([
      ['No hay datos de maquinaria para exportar']
    ]);
    XLSX.utils.book_append_sheet(wb, maqSheet, 'Maquinaria');
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
    { key: 'pronosticos', label: 'Pronóstico' },
  ];
  for (const t of tablas) {
    if (data[t.key] && data[t.key].length > 0) {
      // Solo incluir placa y detalle, más los campos específicos de cada tabla
      const camposPermitidos = {
        control: ['placa', 'detalle', 'ubicacion', 'gerente', 'encargado', 'hoja_tramite', 'fecha_ingreso', 'observacion', 'estado'],
        asignacion: ['placa', 'detalle', 'fecha_asignacion', 'fecha_liberacion', 'recorrido_km', 'recorrido_entregado', 'encargado'],
        mantenimiento: ['placa', 'detalle', 'tipo', 'cantidad', 'gestion', 'ubicacion', 'registrado_por', 'validado_por', 'autorizado_por'],
        soat: ['placa', 'detalle', 'importe_2024', 'importe_2025'],
        seguros: ['placa', 'detalle', 'numero_2024', 'importe', 'detalle'],
        itv: ['placa', 'detalle', 'detalle', 'importe'],
        impuestos: ['placa', 'detalle', 'importe_2023', 'importe_2024'],
        pronosticos: ['riesgo', 'resultado', 'probabilidad', 'fecha_asig', 'recorrido', 'horas_op', 'recomendaciones', 'fechas_futuras']
      };
      
      // Obtener los campos permitidos para esta tabla
      const camposTabla = camposPermitidos[t.key] || ['placa', 'detalle'];
      
      // Filtrar solo los campos que existen en los datos y excluir fechas
      const allKeys = camposTabla.filter(campo => 
        data[t.key].some(row => row[campo] !== undefined) &&
        campo !== 'fecha_creacion' &&
        campo !== 'fecha_actualizacion'
      );
      
      
      // Para pronósticos usar formato horizontal, para el resto horizontal
      let header, body;
      if (t.key === 'pronosticos') {
        // Formato horizontal para pronósticos - igual que en CSVButtons
        // Los datos ya vienen con placa y detalle agregados desde ExportarReportes.jsx
        header = ['Placa', 'Detalle', 'Fecha Asignación', 'Horas Operación', 'Recorrido', 'Resultado', 'Riesgo', 'Probabilidad', 'Fecha Mantenimiento', 'Urgencia', 'Recomendaciones'];
        body = data[t.key].map(r => [
          r.placa || '',
          r.detalle || '',
          r.fecha_asig || '',
          r.horas_op || '',
          r.recorrido || '',
          r.resultado || '',
          r.riesgo || '',
          r.probabilidad || '',
          r.fecha_mantenimiento || '',
          r.urgencia || '',
          Array.isArray(r.recomendaciones) ? r.recomendaciones.join('; ') : (r.recomendaciones || '')
        ]);
      } else {
        // Formato horizontal para el resto de tablas
        header = allKeys.map(formatHeader);
        body = data[t.key].map(r => {
          return allKeys.map(k => {
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
      
      const sheet = XLSX.utils.aoa_to_sheet([
        header,
        ...body
      ]);
      XLSX.utils.book_append_sheet(wb, sheet, t.label);
    }
  }
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