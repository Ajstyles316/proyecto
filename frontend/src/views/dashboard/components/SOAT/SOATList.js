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
  TextField,
  Paper,
  Grid,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const SOATList = ({ maquinariaId, maquinariaPlaca }) => {
  const [soats, setSoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingSoat, setEditingSoat] = useState(null);

  const fieldLabels = [
    { name: 'importe_2024', label: 'Importe 2024', type: 'number', required: true },
    { name: 'importe_2025', label: 'Importe 2025', type: 'number', required: true },
  ];

  const fetchSoats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`);
      if (!response.ok) throw new Error('Error al cargar SOATs');
      const data = await response.json();
      setSoats(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setSoats([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    if (maquinariaId) fetchSoats();
  }, [maquinariaId, fetchSoats]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingSoat(null);
  };

  const handleOpenEditForm = (soat = null) => {
    if (soat) {
      setForm({ ...soat });
      setEditingSoat(soat);
    } else {
      setForm({});
      setEditingSoat(null);
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
    
    const method = editingSoat ? 'PUT' : 'POST';
    const url = editingSoat
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${editingSoat._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`;
    
    const payload = {
      ...form,
      maquinaria: maquinariaId,
      importe_2024: Number(form.importe_2024) || 0,
      importe_2025: Number(form.importe_2025) || 0,
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
        message: `SOAT ${editingSoat ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchSoats();
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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'SOAT eliminado exitosamente!', severity: 'success' });
      fetchSoats();
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
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">SOAT</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"}
          onClick={() =>{
            handleOpenEditForm(null);
            setShowForm(!showForm)
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo SOAT'}
        </Button>
      </Box>

      {/* Formulario arriba de la tabla */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingSoat ? 'Editar SOAT' : 'Nuevo Registro'}
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
              {editingSoat ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : soats.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de SOAT para esta maquinaria.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Importe 2024</TableCell>
              <TableCell>Importe 2025</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {soats.map((soat) => (
              <TableRow key={soat._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{soat.importe_2024 || ''}</TableCell>
                <TableCell>{soat.importe_2025 || ''}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenEditForm(soat)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(soat._id)}
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

SOATList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SOATList;