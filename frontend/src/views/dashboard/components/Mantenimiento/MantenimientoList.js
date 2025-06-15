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
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const MantenimientoList = ({ maquinariaId, maquinariaPlaca }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);

  // Campos del formulario con validación
  const fieldLabels = [
    { name: 'tipo', label: 'Tipo', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
    { name: 'gestion', label: 'Gestión', required: true },
    { name: 'ubicacion', label: 'Ubicación', required: true },
  ];

  const fetchMantenimientos = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`);
      if (!response.ok) throw new Error('Error al cargar mantenimientos');
      const data = await response.json();
      setMantenimientos(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingMantenimiento(null);
  };

  const handleOpenEditForm = (mantenimiento) => {
    setEditingMantenimiento(mantenimiento);
    setForm({ ...mantenimiento });
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

    const url = editingMantenimiento 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${editingMantenimiento._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`;

    const method = editingMantenimiento ? 'PUT' : 'POST';

    const payload = {
      ...form,
      maquinaria: maquinariaId,
      cantidad: Number(form.cantidad) || 0,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la operación');
      }

      setSnackbar({ 
        open: true, 
        message: `Mantenimiento ${editingMantenimiento ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchMantenimientos();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este mantenimiento?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Mantenimiento eliminado exitosamente!', severity: 'success' });
      fetchMantenimientos();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Mantenimientos</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"}
          onClick={() => {
            setEditingMantenimiento(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo Mantenimiento'}
        </Button>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Registro'}
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
              {editingMantenimiento ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : mantenimientos.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de mantenimiento</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Gestión</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mantenimientos.map((m) => (
              <TableRow key={m._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{m.tipo || ''}</TableCell>
                <TableCell>{m.cantidad || ''}</TableCell>
                <TableCell>{m.gestion || ''}</TableCell>
                <TableCell>{m.ubicacion || ''}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenEditForm(m)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(m._id)}
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

MantenimientoList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default MantenimientoList;