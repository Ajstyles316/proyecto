import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Paper,
  TextField,
  Grid,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const AsignacionList = ({ maquinariaId, maquinariaPlaca }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingAsignacion, setEditingAsignacion] = useState(null);

  // Campos del formulario con validación
  const fieldLabels = [
    { name: 'fecha_asignacion', label: 'Fecha Asignación', type: 'date', required: true },
    { name: 'fecha_liberacion', label: 'Fecha Liberación', type: 'date' },
    { name: 'recorrido_km', label: 'Recorrido Asignado (Km)', type: 'number', required: true },
    { name: 'recorrido_entregado', label: 'Recorrido Entregado (Km)', type: 'number' },
  ];

  const fetchAsignaciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`);
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      const data = await response.json();
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    if (maquinariaId) {
      fetchAsignaciones();
    }
  }, [maquinariaId, fetchAsignaciones]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingAsignacion(null);
  };

  const handleOpenEditForm = (asignacion) => {
    setEditingAsignacion(asignacion);
    setForm({ ...asignacion });
    setErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const newErrors = {};
    fieldLabels.forEach(field => {
      if (field.required && !form[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const url = editingAsignacion 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${editingAsignacion._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`;

    const method = editingAsignacion ? 'PUT' : 'POST';

    const payload = {
      ...form,
      maquinaria: maquinariaId,
      fecha_asignacion: form.fecha_asignacion ? new Date(form.fecha_asignacion).toISOString().split('T')[0] : null,
      fecha_liberacion: form.fecha_liberacion ? new Date(form.fecha_liberacion).toISOString().split('T')[0] : null,
      recorrido_km: Number(form.recorrido_km) || 0,
      recorrido_entregado: Number(form.recorrido_entregado) || 0,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Error en la operación');
      }

      setSnackbar({ 
        open: true, 
        message: `Asignación ${editingAsignacion ? 'actualizada' : 'creada'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchAsignaciones();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Asignación eliminada exitosamente!', severity: 'success' });
      fetchAsignaciones();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Asignaciones</Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: { xs: 2, sm: 0 }
        }}>
          <Button 
            variant="contained" 
            color={showForm ? "error" : "success"} 
            onClick={() => {
              setEditingAsignacion(null);
              setForm({});
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancelar' : 'Nueva Asignación'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingAsignacion ? 'Editar Asignación' : 'Nueva Asignación'}
          </Typography>
          <Grid container spacing={2}>
            {fieldLabels.map((field) => (
              <Grid item xs={12} sm={6} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={form[field.name] || ''}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  required={field.required}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            mt: 3,
            flexWrap: 'wrap'
          }}>
            <Button 
              variant="contained" 
              color="success"
              onClick={handleSubmit}
            >
              {editingAsignacion ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : asignaciones.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de asignación para esta maquinaria.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Fecha Asignación</TableCell>
              <TableCell>Fecha Liberación</TableCell>
              <TableCell>Recorrido Asignado (Km)</TableCell>
              <TableCell>Recorrido Entregado (Km)</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {asignaciones.map((asignacion) => (
              <TableRow key={asignacion._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{formatDate(asignacion.fecha_asignacion)}</TableCell>
                <TableCell>{formatDate(asignacion.fecha_liberacion)}</TableCell>
                <TableCell>{asignacion.recorrido_km || ''}</TableCell>
                <TableCell>{asignacion.recorrido_entregado || ''}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenEditForm(asignacion)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(asignacion._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

AsignacionList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default AsignacionList;