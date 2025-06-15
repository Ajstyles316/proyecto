import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
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
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ImpuestoList = ({ maquinariaId, maquinariaPlaca }) => {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [currentImpuesto, setCurrentImpuesto] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const fieldLabels = [
    { name: 'importe_2023', label: 'Importe 2023', type: 'number', required: true },
    { name: 'importe_2024', label: 'Importe 2024', type: 'number', required: true },
  ];

  const fetchImpuestos = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`);
      if (!response.ok) throw new Error('Error al cargar impuestos');
      const data = await response.json();
      setImpuestos(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setImpuestos([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    fetchImpuestos();
  }, [fetchImpuestos]);

  const handleResetForm = () => {
    setForm({});
    setErrors({});
    setShowForm(false);
    setCurrentImpuesto(null);
  };

  const handleOpenEditForm = (impuesto = null) => {
    if (impuesto) {
      setForm({ ...impuesto });
      setCurrentImpuesto(impuesto);
    } else {
      setForm({});
      setCurrentImpuesto(null);
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
    
    const method = currentImpuesto ? 'PUT' : 'POST';
    const url = currentImpuesto
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${currentImpuesto._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`;
    
    const payload = {
      ...form,
      maquinaria: maquinariaId,
      importe_2023: Number(form.importe_2023) || 0,
      importe_2024: Number(form.importe_2024) || 0,
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
        message: `Impuesto ${currentImpuesto ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchImpuestos();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este impuesto?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Impuesto eliminado exitosamente!', severity: 'success' });
      fetchImpuestos();
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
        <Typography variant="h6">Impuestos</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"} 
          onClick={() =>{
            handleOpenEditForm(null);
            setShowForm(!showForm)
          } }
        >
          {showForm ? 'Cancelar' : 'Nuevo Impuesto'}
        </Button>
      </Box>

      {/* Formulario arriba de la tabla */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {currentImpuesto ? 'Editar Impuesto' : 'Nuevo Registro'}
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
              {currentImpuesto ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : impuestos.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de impuestos</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Importe 2023</TableCell>
              <TableCell>Importe 2024</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {impuestos.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{maquinariaPlaca}</TableCell>
                <TableCell>{i.importe_2023}</TableCell>
                <TableCell>{i.importe_2024}</TableCell>
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

ImpuestoList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ImpuestoList;