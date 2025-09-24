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
  Select,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useCanEdit } from 'src/components/hooks';

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
  const [loadingOdometer, setLoadingOdometer] = useState(false);
  const [error, setError] = useState('');

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

  // Función para cargar datos del odómetro
  const fetchOdometerData = async (maquinariaId) => {
    if (!maquinariaId) return;
    
    setLoadingOdometer(true);
    try {
      const response = await fetch(`/api/maquinaria/${maquinariaId}/control-odometro/`);
      if (response.ok) {
        const data = await response.json();
        setOdometerData(data);
        
        // Calcular total de horas del período si hay datos
        if (data && data.length > 0) {
          const totalHoras = data.reduce((sum, record) => {
            return sum + (parseFloat(record.odometro_mes) || 0);
          }, 0);
          
          // Actualizar las horas del período automáticamente
          setEditableData(prev => ({
            ...prev,
            horas_periodo: totalHoras.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del odómetro:', error);
    } finally {
      setLoadingOdometer(false);
    }
  };

  // Cargar datos del odómetro cuando se cambie el método a depreciación por horas
  useEffect(() => {
    if (editableData.metodo === 'depreciacion_por_horas' && maquinariaInfo?._id) {
      fetchOdometerData(maquinariaInfo._id);
    }
  }, [editableData.metodo, maquinariaInfo?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
    setError('');
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
      if (!editableData.ufv_inicial || Number(editableData.ufv_inicial) <= 0) {
        setError('El UFV inicial es obligatorio y debe ser mayor a 0.');
        return;
      }
      if (!editableData.ufv_final || Number(editableData.ufv_final) <= 0) {
        setError('El UFV final es obligatorio y debe ser mayor a 0.');
        return;
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
    if (!costo_activo || !fecha_compra || vida_util <= 0) return [];
    
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
      // Depreciación por horas según las fórmulas exactas proporcionadas
      const ufv_inicial = parseFloat(editableData.ufv_inicial) || 1;
      const ufv_final = parseFloat(editableData.ufv_final) || 1;
      const horas_periodo = parseFloat(editableData.horas_periodo) || 0;
      const depreciacion_por_hora = parseFloat(editableData.depreciacion_por_hora) || 0;
      
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
      const depreciacion_acumulada_anterior = 0; // C (asumiendo primer período)
      const valor_neto_anterior = valor_activo_fijo - depreciacion_acumulada_anterior; // D = B - C
      
      // Fórmula: F = G - A (pero necesitamos G primero)
      // Fórmula: G = B * UFV FINAL / UFV INICIAL
      const valor_actualizado = valor_activo_fijo * (ufv_final / ufv_inicial); // G
      const incremento_actualizacion_activo = valor_actualizado - valor_activo_fijo; // F = G - B
      
      // Fórmula: H = C * UFV FINAL / UFV INICIAL
      const incremento_actualizacion_depreciacion = depreciacion_acumulada_anterior * (ufv_final / ufv_inicial); // H
      
      // Fórmula: I = A * E (Horas × Depreciación por hora)
      const depreciacion_periodo = horas_periodo * depreciacion_por_hora; // I
      
      // Fórmula: J = I + H + C (Depreciación período + Incremento actualización + Depreciación acumulada anterior)
      const depreciacion_acumulada_total = depreciacion_periodo + incremento_actualizacion_depreciacion + depreciacion_acumulada_anterior; // J
      
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
        costo_por_hora_efectiva: parseFloat(costo_por_hora_efectiva.toFixed(2))
      });
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
        value={editableData.metodo === 'depreciacion_por_horas' ? 'Depreciación por horas' : 'Línea recta'}
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
            Esta maquinaria usa depreciación por horas porque su método de depreciación contiene "HRS."
          </Alert>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UFV Inicial"
            name="ufv_inicial"
            type="number"
            value={editableData.ufv_inicial}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0, step: 0.00001 }}
            disabled={!canEditDepreciacion}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UFV Final"
            name="ufv_final"
            type="number"
            value={editableData.ufv_final}
            onChange={handleInputChange}
            variant="outlined"
            inputProps={{ min: 0, step: 0.00001 }}
            disabled={!canEditDepreciacion}
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
    
    {/* Mostrar datos del odómetro si están disponibles */}
    {editableData.metodo === 'depreciacion_por_horas' && odometerData.length > 0 && (
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Datos del Control Odómetro ({odometerData.length} registros)
        </Typography>
        <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', p: 1 }}>
          {odometerData.map((record, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: '0.875rem' }}>
              <span>{record.unidad || 'N/A'}</span>
              <span>{record.odometro_mes || 0} horas</span>
            </Box>
          ))}
        </Box>
      </Grid>
    )}
    
    {loadingOdometer && (
      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary">
          Cargando datos del odómetro...
        </Typography>
      </Grid>
    )}
  </Grid>
)}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Tabla de Depreciación Anual
        </Typography>

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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Año</TableCell>
                <TableCell align="right">Valor Anual Depreciado</TableCell>
                <TableCell align="right">Depreciación Acumulada</TableCell>
                <TableCell align="right">Valor en Libros</TableCell>
                {editableData.metodo === 'depreciacion_por_horas' && (
                  <>
                    <TableCell align="right">Valor Actualizado</TableCell>
                    <TableCell align="right">Horas Período</TableCell>
                    <TableCell align="right">Depreciación/Hora</TableCell>
                    <TableCell align="right">Valor Activo Fijo</TableCell>
                    <TableCell align="right">Incremento Activo</TableCell>
                    <TableCell align="right">Incremento Deprec.</TableCell>
                    <TableCell align="right">Costo/Hora Efectiva</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {detalleConAcumulado.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.anio}</TableCell>
                  <TableCell align="right">{`Bs. ${item.valor.toFixed(2)}`}</TableCell>
                  <TableCell align="right">{`Bs. ${item.acumulado.toFixed(2)}`}</TableCell>
                  <TableCell align="right">{`Bs. ${item.valor_en_libros.toFixed(2)}`}</TableCell>
                  {editableData.metodo === 'depreciacion_por_horas' && (
                    <>
                      <TableCell align="right">{`Bs. ${(item.valor_actualizado || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="right">{item.horas_periodo || 0}</TableCell>
                      <TableCell align="right">{`Bs. ${(item.depreciacion_por_hora || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="right">{`Bs. ${(item.valor_activo_fijo || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="right">{`Bs. ${(item.incremento_actualizacion_activo || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="right">{`Bs. ${(item.incremento_actualizacion_depreciacion || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="right">{`Bs. ${(item.costo_por_hora_efectiva || 0).toFixed(2)}`}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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