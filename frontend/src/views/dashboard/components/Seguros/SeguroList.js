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
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SeguroList = ({ maquinariaId, maquinariaPlaca }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingSeguro, setEditingSeguro] = useState(null);

  const fieldLabels = [
    { name: 'numero_2024', label: 'N° 2024', required: true },
    { name: 'importe', label: 'Importe', type: 'number', required: true },
    { name: 'detalle', label: 'Detalle', required: false },
  ];

  const fetchSeguros = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`);
      if (!response.ok) throw new Error('Error al cargar seguros');
      const data = await response.json();
      setSeguros(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setSeguros([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    fetchSeguros();
  }, [fetchSeguros]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingSeguro(null);
  };

  const handleOpenEditForm = (seguro = null) => {
    if (seguro) {
      setForm({ ...seguro });
      setEditingSeguro(seguro);
    } else {
      setForm({});
      setEditingSeguro(null);
    }
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

    const method = editingSeguro ? 'PUT' : 'POST';
    const url = editingSeguro
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${editingSeguro._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`;

    const payload = {
      ...form,
      maquinaria: maquinariaId,
      importe: Number(form.importe) || 0,
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
        message: `Seguro ${editingSeguro ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchSeguros();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este seguro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Seguro eliminado exitosamente!', severity: 'success' });
      fetchSeguros();
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
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Seguros</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"}
          onClick={() => {
            handleOpenEditForm(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo Seguro'}
        </Button>
      </Box>

      {/* Formulario arriba de la tabla */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingSeguro ? 'Editar Seguro' : 'Nuevo Registro'}
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
              {editingSeguro ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : seguros.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de seguro</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>N° 2024</TableCell>
              <TableCell>Importe</TableCell>
              <TableCell>Detalle</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seguros.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{s.numero_2024}</TableCell>
                <TableCell>{s.importe}</TableCell>
                <TableCell>{s.detalle}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleOpenEditForm(s)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(s._id)}
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

SeguroList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SeguroList;