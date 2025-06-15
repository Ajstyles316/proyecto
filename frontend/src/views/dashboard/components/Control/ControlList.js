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

const ControlList = ({ maquinariaId, maquinariaPlaca }) => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingControl, setEditingControl] = useState(null);

  const fieldLabels = [
    { name: 'ubicacion', label: 'Ubicación', required: true },
    { name: 'gerente', label: 'Gerente/Director' },
    { name: 'encargado', label: 'Encargado de Activos' },
    { name: 'hoja_tramite', label: 'Hoja de Trámite' },
    { name: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date', required: true },
    { name: 'observacion', label: 'Observación' },
  ];

  const fetchControls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/control/`);
      if (!response.ok) throw new Error('Error al cargar controles');
      const data = await response.json();
      setControls(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setControls([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    if (maquinariaId) fetchControls();
  }, [maquinariaId, fetchControls]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingControl(null);
  };

  const handleOpenEditForm = (control) => {
    setEditingControl(control);
    setForm({ ...control });
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

    const url = editingControl 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/control/${editingControl._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/control/`;

    const method = editingControl ? 'PUT' : 'POST';

    const payload = {
      ...form,
      maquinaria: maquinariaId,
      fecha_ingreso: form.fecha_ingreso ? new Date(form.fecha_ingreso).toISOString().split('T')[0] : null,
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
        message: `Control ${editingControl ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchControls();
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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/control/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Control eliminado exitosamente!', severity: 'success' });
      fetchControls();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
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
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Historial de Control</Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: { xs: 2, sm: 0 }
        }}>
          <Button 
            variant="contained" 
            color={showForm ? "error" : "success"}
            onClick={() => {
              setEditingControl(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancelar' : 'Nuevo Control'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingControl ? 'Editar Control' : 'Nuevo Registro'}
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
              {editingControl ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : controls.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de control para esta maquinaria.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Gerente</TableCell>
              <TableCell>Encargado</TableCell>
              <TableCell>Hoja de Trámite</TableCell>
              <TableCell>Fecha Ingreso</TableCell>
              <TableCell>Observación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {controls.map((control) => (
              <TableRow key={control._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{control.ubicacion || ''}</TableCell>
                <TableCell>{control.gerente || ''}</TableCell>
                <TableCell>{control.encargado || ''}</TableCell>
                <TableCell>{control.hoja_tramite || ''}</TableCell>
                <TableCell>{control.fecha_ingreso ? new Date(control.fecha_ingreso).toLocaleDateString() : ''}</TableCell>
                <TableCell>{control.observacion || ''}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenEditForm(control)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(control._id)}
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

ControlList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ControlList;