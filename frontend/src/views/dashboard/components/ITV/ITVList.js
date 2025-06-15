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

const ITVList = ({ maquinariaId, maquinariaPlaca }) => {
  const [itvs, setItvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editingItv, setEditingItv] = useState(null);

  const fieldLabels = [
    { name: 'detalle', label: 'Detalle', required: true },
    { name: 'importe', label: 'Importe', type: 'number', required: true },
  ];

  const fetchItvs = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`);
      if (!response.ok) throw new Error('Error al cargar ITVs');
      const data = await response.json();
      setItvs(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setItvs([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    fetchItvs();
  }, [fetchItvs]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setEditingItv(null);
  };

  const handleOpenEditForm = (itv) => {
    setEditingItv(itv);
    setForm({ ...itv });
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
    
    const url = editingItv 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${editingItv._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`;
    const method = editingItv ? 'PUT' : 'POST';
    
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
        message: `ITV ${editingItv ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchItvs();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ITV?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'ITV eliminado exitosamente!', severity: 'success' });
      fetchItvs();
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
        <Typography variant="h6">ITV - {maquinariaPlaca}</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"}
          onClick={() => {
            if (showForm) {
              handleResetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo ITV'}
        </Button>
      </Box>

      {/* Formulario arriba de la tabla */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingItv ? 'Editar ITV' : 'Nuevo Registro'}
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
              {editingItv ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : itvs.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de ITV</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Detalle</TableCell>
              <TableCell>Importe</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itvs.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{i.detalle || ''}</TableCell>
                <TableCell>{i.importe || ''}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenEditForm(i)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(i._id)}
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

ITVList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ITVList;