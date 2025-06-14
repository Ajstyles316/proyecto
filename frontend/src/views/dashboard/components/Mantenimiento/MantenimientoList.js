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
  Modal,
  Paper,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const MantenimientoList = ({ maquinariaId, maquinariaPlaca }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMantenimiento, setCurrentMantenimiento] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});
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

  const handleOpenModal = (mantenimiento = null) => {
    setCurrentMantenimiento(mantenimiento);
    setModalForm(mantenimiento ? { ...mantenimiento } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentMantenimiento(null);
    setModalForm({});
    setModalErrors({});
  };

  const validateForm = () => {
    const errors = {};
    fieldLabels.forEach(field => {
      if (field.required && !modalForm[field.name]) {
        errors[field.name] = `${field.label} es obligatorio`;
      }
    });
    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const method = currentMantenimiento ? 'PUT' : 'POST';
    const url = currentMantenimiento
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${currentMantenimiento._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      cantidad: Number(modalForm.cantidad) || 0,
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

      setSnackbar({ open: true, message: `Mantenimiento ${currentMantenimiento ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchMantenimientos();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Mantenimientos - {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo Mantenimiento
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : mantenimientos.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de mantenimiento</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
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
                <TableCell>{m.tipo}</TableCell>
                <TableCell>{m.cantidad}</TableCell>
                <TableCell>{m.gestion}</TableCell>
                <TableCell>{m.ubicacion}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenModal(m)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(m._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          p: 4,
          width: '90%',
          maxWidth: 600,
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>{currentMantenimiento ? 'Editar' : 'Nuevo'} Mantenimiento</Typography>
          <Grid container spacing={2}>
            {fieldLabels.map((field) => (
              <Grid item xs={12} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={modalForm[field.name] || ''}
                  onChange={(e) => setModalForm({ ...modalForm, [field.name]: e.target.value })}
                  error={!!modalErrors[field.name]}
                  helperText={modalErrors[field.name]}
                  required={field.required}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleCloseModal}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

MantenimientoList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default MantenimientoList;