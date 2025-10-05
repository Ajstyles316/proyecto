import {
  Modal,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { useCanEdit } from 'src/components/hooks';
import { exportTablaDepreciacionPDF } from '../Reportes/exportacionPDF';
import { exportTablaDepreciacionExcel } from '../Reportes/exportacionExcel';

const BIENES_DE_USO = [
  {
    label: 'Vehículos automotores',
    vida_util: 5,
    coeficiente: 0.20,
  },
  {
    label: 'Maquinaria en general',
    vida_util: 8,
    coeficiente: 0.125,
  },
  {
    label: 'Maquinaria para la construcción',
    vida_util: 5,
    coeficiente: 0.20,
  },
  {
    label: 'Equipos e instalaciones',
    vida_util: 8,
    coeficiente: 0.125,
  },
  {
    label: 'Equipos de computación',
    vida_util: 4,
    coeficiente: 0.25,
  },
  {
    label: 'Muebles y enseres de oficina',
    vida_util: 10,
    coeficiente: 0.10,
  },
];

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight="500">
      {value || '—'}
    </Typography>
  </Box>
);

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

function normalizaFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string') return fecha.split('T')[0];
  if (typeof fecha === 'object' && fecha.$date) return fecha.$date.split('T')[0];
  return '';
}

const DetalleDepreciacionModal = ({ open, handleClose, maquinariaInfo, onSave }) => {
  const canEditDepreciacion = useCanEdit('Depreciaciones');
  const [editableData, setEditableData] = useState({
    costo_activo: '',
    fecha_compra: '',
    bien_uso: '',
    vida_util: '',
    coeficiente: '',
    valor_residual: '',
    metodo: '',
    ufv_inicial: '',
    ufv_final: '',
    horas_periodo: '',
    depreciacion_por_hora: '',
  });
  const [odometerData, setOdometerData] = useState([]);
  const [error, setError] = useState('');
  
  // Estados para filtros y UFV
  const [ufvActivo, setUfvActivo] = useState(false);
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');

  useEffect(() => {
    if (maquinariaInfo) {
      // Buscar bien de uso sugerido por nombre
      let bienUsoSugerido = BIENES_DE_USO.find(b => (maquinariaInfo.bien_de_uso || '').toLowerCase().includes(b.label.toLowerCase()));
      if (!bienUsoSugerido && maquinariaInfo.bien_de_uso) {
        bienUsoSugerido = { label: maquinariaInfo.bien_de_uso, vida_util: maquinariaInfo.vida_util, coeficiente: '' };
      }
      // Determinar método automáticamente basado en el metodo_depreciacion de la maquinaria
      const metodoDepreciacion = (maquinariaInfo.metodo_depreciacion || '').toUpperCase();
      const metodoAutomatico = metodoDepreciacion.includes('HRS.') ? 'depreciacion_por_horas' : 'linea_recta';
      
      console.log('Método de depreciación:', metodoDepreciacion, 'Método determinado:', metodoAutomatico);
      
      // Función de prueba para verificar la lógica con todos los métodos de depreciación
      const metodosPrueba = [
        'HRS. 64 EQUIPOS (ExECE-ExICE)',
        'HRS. TRAB. ExECE-ExCIE', 
        'HRS. TRAB. PROPIO UERH',
        'LINEA RECTA VSIAF (ExECE-ExICE)',
        'LINEA RECTA VSIAF (PROPIO COFADENA)',
        'LINEA RECTA VSIAF (PROPIO UNIDAD)',
        'NO CORRESPONDE',
        'SE DESCONOCE'
      ];
      
      console.log('=== PRUEBA DE LÓGICA DE MÉTODOS ===');
      metodosPrueba.forEach(metodo => {
        const metodoCalculado = metodo.toUpperCase().includes('HRS.') ? 'depreciacion_por_horas' : 'linea_recta';
        console.log(`${metodo} → ${metodoCalculado}`);
      });
      console.log('=====================================');
      
      setEditableData({
        costo_activo:
          maquinariaInfo.costo_activo !== undefined && maquinariaInfo.costo_activo !== null
            ? String(maquinariaInfo.costo_activo)
            : (maquinariaInfo.adqui !== undefined && maquinariaInfo.adqui !== null ? String(maquinariaInfo.adqui) : ''),
        fecha_compra: normalizaFecha(maquinariaInfo.fecha_compra) || new Date().toISOString().slice(0, 10),
        bien_uso: bienUsoSugerido ? bienUsoSugerido.label : '',
        vida_util: bienUsoSugerido ? bienUsoSugerido.vida_util : maquinariaInfo.vida_util || '',
        coeficiente: bienUsoSugerido ? bienUsoSugerido.coeficiente : '',
        valor_residual: maquinariaInfo.valor_residual !== undefined ? maquinariaInfo.valor_residual : 0,
        metodo: metodoAutomatico,
        ufv_inicial: maquinariaInfo.ufv_inicial || '',
        ufv_final: maquinariaInfo.ufv_final || '',
        horas_periodo: maquinariaInfo.horas_periodo || '',
        depreciacion_por_hora: maquinariaInfo.depreciacion_por_hora || '',
      });
      setError('');
    }
  }, [maquinariaInfo]);

  // Función para cargar datos del odómetro y calcular automáticamente
  const fetchOdometerData = useCallback(async (maquinariaId) => {
    if (!maquinariaId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/control-odometro/`);
      if (response.ok) {
        const data = await response.json();
        setOdometerData(data);
        
        // Calcular total de horas del período si hay datos
        if (data && data.length > 0) {
          const totalHoras = data.reduce((sum, record) => {
            return sum + (parseFloat(record.odometro_mes) || 0);
          }, 0);
          
          // Calcular depreciación por hora automáticamente si no está definida
          const costoActivo = parseFloat(editableData.costo_activo) || 0;
          const vidaUtil = parseFloat(editableData.vida_util) || 1;
          const horasAnualesEstandar = 300 * 8; // 300 días * 8 horas = 2400 horas anuales
          
          // Factor UFV (por defecto 20 si no está especificado)
          const factorUfv = 20;
          
          // Fórmula corregida: costoActivo / ((300*8) * factorUfv)
          const depreciacionPorHora = costoActivo / (horasAnualesEstandar * factorUfv);
          
          // Actualizar los datos automáticamente
          setEditableData(prev => ({
            ...prev,
            horas_periodo: totalHoras.toString(),
            depreciacion_por_hora: depreciacionPorHora.toFixed(4)
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del odómetro:', error);
    }
  }, [editableData.costo_activo, editableData.vida_util]);

  // Cargar datos del odómetro cuando se cambie el método a depreciación por horas
  useEffect(() => {
    if (editableData.metodo === 'depreciacion_por_horas' && maquinariaInfo?._id) {
      fetchOdometerData(maquinariaInfo._id);
    }
  }, [editableData.metodo, maquinariaInfo?._id, fetchOdometerData]);

  // Recalcular automáticamente cuando cambien los datos del odómetro
  useEffect(() => {
    if (odometerData.length > 0 && editableData.metodo === 'depreciacion_por_horas') {
      const costoActivo = parseFloat(editableData.costo_activo) || 0;
      const vidaUtil = parseFloat(editableData.vida_util) || 1;
      const horasAnualesEstandar = 300 * 8; // 300 días * 8 horas = 2400 horas anuales
      
      // Factor UFV (por defecto 20 si no está especificado)
      const factorUfv = 20;
      
      // Fórmula corregida: costoActivo / ((300*8) * factorUfv)
      const depreciacionPorHora = costoActivo / (horasAnualesEstandar * factorUfv);
      
      setEditableData(prev => ({
        ...prev,
        depreciacion_por_hora: depreciacionPorHora.toFixed(4)
      }));
    }
  }, [odometerData, editableData.costo_activo, editableData.vida_util, editableData.metodo]);

  // Recalcular automáticamente cuando cambien los filtros de mes y año
  useEffect(() => {
    if (odometerData.length > 0 && editableData.metodo === 'depreciacion_por_horas') {
      // Filtrar datos según los filtros
      let odometerDataFiltrado = odometerData;
      if (filtroMes || filtroAnio) {
        odometerDataFiltrado = odometerData.filter(record => {
          if (!record.fecha_registro) return false;
          
          const fechaRegistro = new Date(record.fecha_registro);
          const mesRegistro = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
          const anioRegistro = String(fechaRegistro.getFullYear());
          
          const cumpleMes = !filtroMes || mesRegistro === filtroMes;
          const cumpleAnio = !filtroAnio || anioRegistro === filtroAnio;
          
          return cumpleMes && cumpleAnio;
        });
      }
      
      // Recalcular horas del período con datos filtrados
      const totalHoras = odometerDataFiltrado.reduce((sum, record) => {
        return sum + (parseFloat(record.odometro_mes) || 0);
      }, 0);
      
      setEditableData(prev => ({
        ...prev,
        horas_periodo: totalHoras.toString()
      }));
    }
  }, [filtroMes, filtroAnio, odometerData, editableData.metodo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Funciones de exportación
  const handleExportPDF = () => {
    const data = {
      maquinaria: {
        placa: maquinariaInfo?.placa || '',
        codigo: maquinariaInfo?.codigo || '',
        detalle: maquinariaInfo?.detalle || '',
        costo_activo: editableData.costo_activo,
        fecha_compra: editableData.fecha_compra,
        vida_util: editableData.vida_util,
        metodo_depreciacion: editableData.metodo,
        ufv_inicial: ufvActivo ? editableData.ufv_inicial : '0',
        ufv_final: ufvActivo ? editableData.ufv_final : '0',
        depreciacion_por_hora: editableData.depreciacion_por_hora,
        horas_periodo: editableData.horas_periodo
      },
      depreciaciones: detalleConAcumulado,
      odometerData: odometerData
    };
    
    const filename = `depreciacion_${maquinariaInfo?.placa || 'maquinaria'}_${new Date().toISOString().split('T')[0]}`;
    exportTablaDepreciacionPDF(data, filename);
  };

  const handleExportExcel = () => {
    const data = {
      maquinaria: {
        placa: maquinariaInfo?.placa || '',
        codigo: maquinariaInfo?.codigo || '',
        detalle: maquinariaInfo?.detalle || '',
        costo_activo: editableData.costo_activo,
        fecha_compra: editableData.fecha_compra,
        vida_util: editableData.vida_util,
        metodo_depreciacion: editableData.metodo,
        ufv_inicial: ufvActivo ? editableData.ufv_inicial : '0',
        ufv_final: ufvActivo ? editableData.ufv_final : '0',
        depreciacion_por_hora: editableData.depreciacion_por_hora,
        horas_periodo: editableData.horas_periodo
      },
      depreciaciones: detalleConAcumulado,
      odometerData: odometerData
    };
    
    const filename = `depreciacion_${maquinariaInfo?.placa || 'maquinaria'}_${new Date().toISOString().split('T')[0]}`;
    exportTablaDepreciacionExcel(data, filename);
  };

  const handleSaveClick = () => {
    if (!editableData.costo_activo || Number(editableData.costo_activo) <= 0) {
      setError('El costo del activo es obligatorio y debe ser mayor a 0.');
      return;
    }
    if (!editableData.fecha_compra) {
      setError('La fecha de compra es obligatoria.');
      return;
    }
    if (!editableData.vida_util || Number(editableData.vida_util) <= 0) {
      setError('La vida útil es obligatoria y debe ser mayor a 0.');
      return;
    }
    
    // Validaciones específicas para depreciación por horas
    if (editableData.metodo === 'depreciacion_por_horas') {
      // Solo validar UFV si está activado
      if (ufvActivo) {
        if (!editableData.ufv_inicial || Number(editableData.ufv_inicial) <= 0) {
          setError('El UFV inicial es obligatorio y debe ser mayor a 0 cuando está activado.');
          return;
        }
        if (!editableData.ufv_final || Number(editableData.ufv_final) <= 0) {
          setError('El UFV final es obligatorio y debe ser mayor a 0 cuando está activado.');
          return;
        }
      }
      if (!editableData.horas_periodo || Number(editableData.horas_periodo) < 0) {
        setError('Las horas del período son obligatorias y no pueden ser negativas.');
        return;
      }
      if (!editableData.depreciacion_por_hora || Number(editableData.depreciacion_por_hora) <= 0) {
        setError('La depreciación por hora es obligatoria y debe ser mayor a 0.');
        return;
      }
    }
    
    setError('');
    const depreciacion_por_anio = generarTablaDepreciacion();
    // Calcular depreciacion_acumulada para cada año
    let acumulado = 0;
    const depreciacion_por_anio_completa = depreciacion_por_anio.map((item) => {
      acumulado += item.valor;
      return {
        anio: item.anio,
        valor_anual_depreciado: item.valor,
        depreciacion_acumulada: parseFloat(acumulado.toFixed(2)),
        valor_en_libros: item.valor_en_libros
      };
    });
    
    console.log('Datos que se envían desde el modal:', {
      ...editableData,
      vida_util: Number(editableData.vida_util),
      coeficiente: editableData.coeficiente ? Number(editableData.coeficiente) : null,
      valor_residual: editableData.valor_residual ? Number(editableData.valor_residual) : 0,
      ufv_inicial: editableData.ufv_inicial && editableData.ufv_inicial !== '' ? Number(editableData.ufv_inicial) : null,
      ufv_final: editableData.ufv_final && editableData.ufv_final !== '' ? Number(editableData.ufv_final) : null,
      horas_periodo: editableData.horas_periodo && editableData.horas_periodo !== '' ? Number(editableData.horas_periodo) : null,
      depreciacion_por_hora: editableData.depreciacion_por_hora && editableData.depreciacion_por_hora !== '' ? Number(editableData.depreciacion_por_hora) : null,
      depreciacion_por_anio: depreciacion_por_anio_completa,
    });
    
    onSave({
      ...editableData,
      vida_util: Number(editableData.vida_util),
      coeficiente: editableData.coeficiente ? Number(editableData.coeficiente) : null,
      valor_residual: editableData.valor_residual ? Number(editableData.valor_residual) : 0,
      ufv_inicial: editableData.ufv_inicial && editableData.ufv_inicial !== '' ? Number(editableData.ufv_inicial) : null,
      ufv_final: editableData.ufv_final && editableData.ufv_final !== '' ? Number(editableData.ufv_final) : null,
      horas_periodo: editableData.horas_periodo && editableData.horas_periodo !== '' ? Number(editableData.horas_periodo) : null,
      depreciacion_por_hora: editableData.depreciacion_por_hora && editableData.depreciacion_por_hora !== '' ? Number(editableData.depreciacion_por_hora) : null,
      depreciacion_por_anio: depreciacion_por_anio_completa,
    });
  };

  const generarTablaDepreciacion = () => {
    const vida_util = Number(editableData.vida_util) || 5;
    const metodo = editableData.metodo || 'linea_recta';
    const fecha_compra = normalizaFecha(editableData.fecha_compra);
    const costo_activo = parseFloat(editableData.costo_activo);
    const coeficiente = editableData.coeficiente ? Number(editableData.coeficiente) : undefined;
    const valor_residual = editableData.valor_residual ? Number(editableData.valor_residual) : 0;
    
    // Debug logging para identificar el problema en despliegue
    console.log('=== DEBUG DEPRECIACIÓN ===');
    console.log('costo_activo:', costo_activo, 'tipo:', typeof costo_activo);
    console.log('fecha_compra:', fecha_compra, 'tipo:', typeof fecha_compra);
    console.log('vida_util:', vida_util, 'tipo:', typeof vida_util);
    console.log('metodo:', metodo);
    console.log('editableData completo:', editableData);
    console.log('========================');
    
    if (!costo_activo || !fecha_compra || vida_util <= 0) {
      console.log('❌ Retornando array vacío - faltan datos requeridos');
      return [];
    }
    
    // Filtrar datos de odómetros según los filtros de mes y año
    let odometerDataFiltrado = odometerData;
    if (filtroMes || filtroAnio) {
      odometerDataFiltrado = odometerData.filter(record => {
        if (!record.fecha_registro) return false;
        
        const fechaRegistro = new Date(record.fecha_registro);
        const mesRegistro = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
        const anioRegistro = String(fechaRegistro.getFullYear());
        
        const cumpleMes = !filtroMes || mesRegistro === filtroMes;
        const cumpleAnio = !filtroAnio || anioRegistro === filtroAnio;
        
        return cumpleMes && cumpleAnio;
      });
    }
    
    const tabla = [];
    let fecha = new Date(fecha_compra);
    let valor_en_libros = costo_activo;

    if ((metodo === 'coeficiente' || metodo === 'ds_24051') && coeficiente) {
        let base = costo_activo - valor_residual;
        if (base < 0) base = 0;
        
        for (let i = 0; i < vida_util; i++) {
            let dep_anual = base * coeficiente;
            if (i === vida_util - 1 || valor_en_libros - dep_anual < valor_residual) {
                dep_anual = valor_en_libros - valor_residual;
            }
            if (dep_anual < 0) dep_anual = 0;
            
            valor_en_libros -= dep_anual;
            base -= dep_anual; 
            
            tabla.push({ 
                anio: fecha.getFullYear() + i, 
                valor: parseFloat(dep_anual.toFixed(2)),
                valor_en_libros: parseFloat(valor_en_libros.toFixed(2))
            });
        }
    } else if (metodo === 'linea_recta') {
      const depreciacion_anual = (costo_activo - valor_residual) / vida_util;
      for (let i = 0; i < vida_util; i++) {
        let dep_anual;
        if (i === vida_util - 1) {
          dep_anual = valor_en_libros - valor_residual;
        } else {
          dep_anual = depreciacion_anual;
        }
        if (dep_anual < 0) dep_anual = 0;
        valor_en_libros -= dep_anual;
        tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(dep_anual.toFixed(2)), valor_en_libros: parseFloat(valor_en_libros.toFixed(2)) });
      }
    } else if (metodo === 'depreciacion_por_horas') {
      // Depreciación por horas - una fila por cada registro de control de odómetro
      const ufv_inicial = parseFloat(editableData.ufv_inicial) || 1;
      const ufv_final = parseFloat(editableData.ufv_final) || 1;
      const depreciacion_por_hora = parseFloat(editableData.depreciacion_por_hora) || 0;
      
      let depreciacion_acumulada_total = 0;
      let valor_actualizado = costo_activo * (ufv_final / ufv_inicial);
      
      // Acumular todas las horas de los registros de odómetro filtrados
      const totalHoras = odometerDataFiltrado.reduce((sum, record) => {
        return sum + (parseFloat(record.odometro_mes) || 0);
      }, 0);
      
      // Crear una sola fila con las horas acumuladas
      if (odometerDataFiltrado.length > 0) {
        const horas_periodo = totalHoras;
        
        // Variables según las columnas de la imagen:
        // A = HORAS (horas_periodo)
        // B = VALOR ACTIVO FIJO 31-12-23 (costo_activo)
        // C = DEPREC. ACUMULADA AL 31-12-23 (depreciacion_acumulada_anterior)
        // D = VALOR NETO 31-12-23 (valor_neto_anterior)
        // E = DEPRECIACIÓN BS/HORA (depreciacion_por_hora)
        // F = INCREM. P/ACTUAL. ACT FIJO (incremento_actualizacion_activo)
        // G = VALOR ACTUALIZADO 31-12-2024 (valor_actualizado)
        // H = INCREM. ACTUALIZ. DEPR.ACUM (incremento_actualizacion_depreciacion)
        // I = DEPREC. DE LA GESTION AL 31-12-2024 (depreciacion_periodo)
        // J = DEPREC. ACUMULADA AL 31-12-2024 (depreciacion_acumulada_total)
        // K = VALOR NETO AL 31-12-2024 (valor_neto_final)
        
        const valor_activo_fijo = costo_activo; // B
        const depreciacion_acumulada_anterior = depreciacion_acumulada_total; // C (acumulado hasta ahora)
        // const valor_neto_anterior = valor_activo_fijo - depreciacion_acumulada_anterior; // D = B - C (no usado)
        
        // Fórmula: G = B * UFV FINAL / UFV INICIAL
        const incremento_actualizacion_activo = valor_actualizado - valor_activo_fijo; // F = G - B
        
        // Fórmula: H = C * UFV FINAL / UFV INICIAL
        const incremento_actualizacion_depreciacion = depreciacion_acumulada_anterior * (ufv_final / ufv_inicial); // H
        
        // Fórmula: I = A * E (Horas × Depreciación por hora)
        const depreciacion_periodo = horas_periodo * depreciacion_por_hora; // I
        
        // Fórmula: J = I + H + C (Depreciación período + Incremento actualización + Depreciación acumulada anterior)
        depreciacion_acumulada_total = depreciacion_periodo + incremento_actualizacion_depreciacion + depreciacion_acumulada_anterior; // J
        
        // Fórmula: K = G - J (Valor actualizado - Depreciación acumulada total)
        const valor_neto_final = valor_actualizado - depreciacion_acumulada_total; // K
        
        // Fórmula adicional: Costo por hora efectiva = K / ((300*8) * factor_uso)
        const horas_anuales_estandar = 300 * 8; // 2400 horas anuales
        const factor_uso = 1; // Se puede ajustar según necesidades
        const costo_por_hora_efectiva = valor_neto_final / (horas_anuales_estandar * factor_uso);
        
        tabla.push({
          anio: fecha.getFullYear(),
          valor: parseFloat(depreciacion_periodo.toFixed(2)), // I
          valor_en_libros: parseFloat(valor_neto_final.toFixed(2)), // K
          valor_actualizado: parseFloat(valor_actualizado.toFixed(2)), // G
          depreciacion_acumulada: parseFloat(depreciacion_acumulada_total.toFixed(2)), // J
          horas_periodo: horas_periodo, // A
          depreciacion_por_hora: depreciacion_por_hora, // E
          valor_activo_fijo: parseFloat(valor_activo_fijo.toFixed(2)), // B
          ufv_inicial: ufv_inicial,
          ufv_final: ufv_final,
          incremento_actualizacion_activo: parseFloat(incremento_actualizacion_activo.toFixed(2)), // F
          incremento_actualizacion_depreciacion: parseFloat(incremento_actualizacion_depreciacion.toFixed(2)), // H
          costo_por_hora_efectiva: parseFloat(costo_por_hora_efectiva.toFixed(2)),
          unidad: `Total (${odometerDataFiltrado.length} registros)` // Mostrar total de registros filtrados
        });
      }
    } else { // Default to linea_recta if method is unknown
      const depreciacion_anual = (costo_activo - valor_residual) / vida_util;
      for (let i = 0; i < vida_util; i++) {
        let dep_anual;
        if (i === vida_util - 1) {
            dep_anual = valor_en_libros - valor_residual;
        } else {
            dep_anual = depreciacion_anual;
        }
        if (dep_anual < 0) dep_anual = 0;
        valor_en_libros -= dep_anual;
        tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(dep_anual.toFixed(2)), valor_en_libros: parseFloat(valor_en_libros.toFixed(2)) });
      }
    }
    
    console.log('✅ Tabla generada con', tabla.length, 'elementos:', tabla);
    return tabla;
  };

  const detalleArray = generarTablaDepreciacion();
  let acumulado = 0;
  const detalleConAcumulado = detalleArray.map((item) => {
    acumulado += item.valor;
    return { ...item, acumulado };
  });

  const faltaDatos =
    !editableData.costo_activo || Number(editableData.costo_activo) <= 0 || !editableData.fecha_compra || !editableData.vida_util;

  return (
    <Modal open={open} onClose={handleClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxWidth: 800,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Editar y Ver Detalle</Typography>
          <IconButton onClick={handleClose} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Box>

        {maquinariaInfo && (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid item xs={12} sm={4}>
      <InfoItem label="Placa" value={maquinariaInfo.placa} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <InfoItem label="Código" value={maquinariaInfo.codigo} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <InfoItem label="Detalle" value={maquinariaInfo.detalle} />
    </Grid>
    
    {/* Filtros y controles */}
    <Grid item xs={12}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={
            <Switch
              checked={ufvActivo}
              onChange={(e) => setUfvActivo(e.target.checked)}
              color="primary"
            />
          }
          label="Activar UFV"
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Mes</InputLabel>
          <Select
            value={filtroMes}
            label="Mes"
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="01">Enero</MenuItem>
            <MenuItem value="02">Febrero</MenuItem>
            <MenuItem value="03">Marzo</MenuItem>
            <MenuItem value="04">Abril</MenuItem>
            <MenuItem value="05">Mayo</MenuItem>
            <MenuItem value="06">Junio</MenuItem>
            <MenuItem value="07">Julio</MenuItem>
            <MenuItem value="08">Agosto</MenuItem>
            <MenuItem value="09">Septiembre</MenuItem>
            <MenuItem value="10">Octubre</MenuItem>
            <MenuItem value="11">Noviembre</MenuItem>
            <MenuItem value="12">Diciembre</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año</InputLabel>
          <Select
            value={filtroAnio}
            label="Año"
            onChange={(e) => setFiltroAnio(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="2023">2023</MenuItem>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
          </Select>
        </FormControl>
        
        {(filtroMes || filtroAnio) && (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={() => {
              setFiltroMes('');
              setFiltroAnio('');
            }}
          >
            Limpiar Filtros
          </Button>
        )}
        
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleExportPDF}
        >
          Exportar PDF
        </Button>
        
        <Button
          variant="outlined"
          color="success"
          size="small"
          onClick={handleExportExcel}
        >
          Exportar Excel
        </Button>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Costo del Activo"
        name="costo_activo"
        type="number"
        value={editableData.costo_activo}
        onChange={handleInputChange}
        variant="outlined"
        inputProps={{ min: 0 }}
        disabled={!canEditDepreciacion}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Fecha de Compra"
        name="fecha_compra"
        type="date"
        value={editableData.fecha_compra}
        onChange={handleInputChange}
        InputLabelProps={{ shrink: true }}
        variant="outlined"
        disabled={!canEditDepreciacion}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary" display="block">
        Método de depreciación
      </Typography>
      <TextField
        fullWidth
        name="metodo"
        value={editableData.metodo === 'depreciacion_por_horas' ? 'Depreciación por horas' : editableData.metodo === 'linea_recta' ? 'Línea recta' : editableData.metodo || 'No definido'}
        variant="outlined"
        InputProps={{ readOnly: true }}
        helperText="Se determina automáticamente según el método de depreciación de la maquinaria"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary" display="block">
        Vida Útil (años)
      </Typography>
      <TextField
        fullWidth
        name="vida_util"
        type="number"
        value={editableData.vida_util}
        variant="outlined"
        InputProps={{ readOnly: true }}
      />
    </Grid>
    
    {/* Campos específicos para depreciación por horas */}
    {editableData.metodo === 'depreciacion_por_horas' && (
      <>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta maquinaria usa depreciación por horas porque su método de depreciación contiene &quot;HRS.&quot;
          </Alert>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UFV Inicial"
            name="ufv_inicial"
            type="number"
            value={ufvActivo ? editableData.ufv_inicial : '0'}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0, step: 0.00001 }}
            disabled={!canEditDepreciacion || !ufvActivo}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UFV Final"
            name="ufv_final"
            type="number"
            value={ufvActivo ? editableData.ufv_final : '0'}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0, step: 0.00001 }}
            disabled={!canEditDepreciacion || !ufvActivo}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Horas del Período"
            name="horas_periodo"
            type="number"
            value={editableData.horas_periodo}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0 }}
            disabled={!canEditDepreciacion}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Depreciación por Hora (Bs.)"
            name="depreciacion_por_hora"
            type="number"
            value={editableData.depreciacion_por_hora}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0, step: 0.01 }}
            disabled={!canEditDepreciacion}
            required
          />
        </Grid>
      </>
    )}
    
  </Grid>
)}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h6">
            Tabla de Depreciación Anual
          </Typography>
          {(filtroMes || filtroAnio) && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Filtros activos:
              </Typography>
              {filtroMes && (
                <Chip 
                  label={`Mes: ${filtroMes}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
              {filtroAnio && (
                <Chip 
                  label={`Año: ${filtroAnio}`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>

        {maquinariaInfo?.advertencia && (
          <Alert severity="info" sx={{ mb: 2 }}>{maquinariaInfo.advertencia}</Alert>
        )}

        {faltaDatos ? (
          <Alert severity="warning" sx={{ my: 4 }}>
            Para calcular la depreciación anual, ingrese un costo del activo mayor a 0, una fecha de compra válida y vida útil.
          </Alert>
        ) : detalleConAcumulado.length === 0 ? (
          <Typography sx={{ textAlign: 'center', my: 4 }}>
            No hay detalle de depreciación disponible para este activo.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1600 }}>
              <TableHead>
              <TableRow>
                <TableCell>PRECIO MAQUINARIA</TableCell>
                <TableCell>PLACAS</TableCell>
                <TableCell align="right">HORAS</TableCell>
                <TableCell align="right">VALOR ACTIVO FIJO</TableCell>
                <TableCell align="right">DEPREC. ACUMULADA</TableCell>
                <TableCell align="right">VALOR NETO</TableCell>
                <TableCell align="right">DEPRECIACIÓN BS/HORA</TableCell>
                <TableCell align="right">INCREM. P/ACTUAL. ACT FIJO</TableCell>
                <TableCell align="right">VALOR ACTUALIZADO</TableCell>
                <TableCell align="right">INCREM. ACTUALIZ. DEPR.ACUM</TableCell>
                <TableCell align="right">DEPREC. DE LA GESTION</TableCell>
                <TableCell align="right">DEPREC. ACUMULADA FINAL</TableCell>
                <TableCell align="right">VALOR NETO FINAL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalleConAcumulado.map((item, index) => {
                // Calcular valores según las fórmulas de la imagen
                const precioMaquinaria = parseFloat(editableData.costo_activo) || 0;
                const placa = maquinariaInfo?.placa || '';
                const horas = item.horas_periodo || 0;
                const valorActivoFijo = precioMaquinaria;
                const deprecAcumulada = item.acumulado || 0;
                const valorNeto = valorActivoFijo - deprecAcumulada;
                const deprecPorHora = parseFloat(editableData.depreciacion_por_hora) || 0;
                
                // Factor UFV
                const ufvInicial = ufvActivo ? parseFloat(editableData.ufv_inicial) || 0 : 0;
                const ufvFinal = ufvActivo ? parseFloat(editableData.ufv_final) || 0 : 0;
                const factorUfv = ufvInicial > 0 ? ufvFinal / ufvInicial : 1;
                
                const incrementoActualizacion = valorActivoFijo * (factorUfv - 1);
                const valorActualizado = valorActivoFijo * factorUfv;
                const incrementoDeprecAcum = deprecAcumulada * (factorUfv - 1);
                const deprecGestion = horas * deprecPorHora;
                const deprecAcumuladaFinal = deprecAcumulada + incrementoDeprecAcum + deprecGestion;
                const valorNetoFinal = valorActualizado - deprecAcumuladaFinal;
                
                return (
                  <TableRow key={index}>
                    <TableCell>{precioMaquinaria.toFixed(2)}</TableCell>
                    <TableCell>{placa}</TableCell>
                    <TableCell align="right">{horas.toFixed(2)}</TableCell>
                    <TableCell align="right">{valorActivoFijo.toFixed(2)}</TableCell>
                    <TableCell align="right">{deprecAcumulada.toFixed(2)}</TableCell>
                    <TableCell align="right">{valorNeto.toFixed(2)}</TableCell>
                    <TableCell align="right">{deprecPorHora.toFixed(2)}</TableCell>
                    <TableCell align="right">{incrementoActualizacion.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: 'rgba(144, 238, 144, 0.3)' }}>
                      {valorActualizado.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">{incrementoDeprecAcum.toFixed(2)}</TableCell>
                    <TableCell align="right">{deprecGestion.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: 'rgba(255, 255, 0, 0.3)' }}>
                      {deprecAcumuladaFinal.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">{valorNetoFinal.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={handleClose} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveClick}
            sx={{ mr: 1 }}
            disabled={!canEditDepreciacion}
          >
            Guardar
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

DetalleDepreciacionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  maquinariaInfo: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default DetalleDepreciacionModal;