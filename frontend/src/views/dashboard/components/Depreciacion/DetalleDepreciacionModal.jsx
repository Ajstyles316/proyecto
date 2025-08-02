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
import { useCanEdit } from 'src/components/UserContext.jsx';

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
  const canEditDepreciacion = useCanEdit('Depreciación');
  const [editableData, setEditableData] = useState({
    costo_activo: '',
    fecha_compra: '',
    bien_uso: '',
    vida_util: '',
    coeficiente: '',
    valor_residual: '',
    metodo: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (maquinariaInfo) {
      // Buscar bien de uso sugerido por nombre
      let bienUsoSugerido = BIENES_DE_USO.find(b => (maquinariaInfo.bien_de_uso || '').toLowerCase().includes(b.label.toLowerCase()));
      if (!bienUsoSugerido && maquinariaInfo.bien_de_uso) {
        bienUsoSugerido = { label: maquinariaInfo.bien_de_uso, vida_util: maquinariaInfo.vida_util, coeficiente: '' };
      }
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
        metodo: maquinariaInfo.metodo_depreciacion || maquinariaInfo.metodo || 'linea_recta',
      });
      setError('');
    }
  }, [maquinariaInfo]);

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
    onSave({
      ...editableData,
      vida_util: Number(editableData.vida_util),
      coeficiente: editableData.coeficiente ? Number(editableData.coeficiente) : '',
      valor_residual: editableData.valor_residual ? Number(editableData.valor_residual) : 0,
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
    } else if (metodo === 'saldo_decreciente') {
      const tasa = (1 / vida_util) * 2;
      for (let i = 0; i < vida_util; i++) {
        let dep_anual = valor_en_libros * tasa;
        if (i === vida_util - 1 || valor_en_libros - dep_anual < valor_residual) {
          dep_anual = valor_en_libros - valor_residual;
        }
        if (dep_anual < 0) dep_anual = 0;
        valor_en_libros -= dep_anual;
        tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(dep_anual.toFixed(2)), valor_en_libros: parseFloat(valor_en_libros.toFixed(2)) });
      }
    } else if (metodo === 'suma_digitos') {
      const suma_digitos = (vida_util * (vida_util + 1)) / 2;
      for (let i = 0; i < vida_util; i++) {
        const años_restantes = vida_util - i;
        const factor = años_restantes / suma_digitos;
        const dep_anual = (costo_activo - valor_residual) * factor;
        valor_en_libros -= dep_anual;
        tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(dep_anual.toFixed(2)), valor_en_libros: parseFloat(valor_en_libros.toFixed(2)) });
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
      <Select
        fullWidth
        name="metodo"
        value={editableData.metodo}
        onChange={handleInputChange}
        variant="outlined"
        disabled={!canEditDepreciacion}
      >
        <MenuItem value="linea_recta">Línea recta</MenuItem>
        <MenuItem value="saldo_decreciente">Saldo decreciente</MenuItem>
        <MenuItem value="suma_digitos">Suma de dígitos</MenuItem>
      </Select>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {detalleConAcumulado.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.anio}</TableCell>
                  <TableCell align="right">{`Bs. ${item.valor.toFixed(2)}`}</TableCell>
                  <TableCell align="right">{`Bs. ${item.acumulado.toFixed(2)}`}</TableCell>
                  <TableCell align="right">{`Bs. ${item.valor_en_libros.toFixed(2)}`}</TableCell>
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