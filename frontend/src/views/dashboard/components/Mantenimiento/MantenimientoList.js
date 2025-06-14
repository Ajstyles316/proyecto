import React, { useState, useEffect } from 'react';
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
  Modal,
  Paper,
  TextField,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const MantenimientoList = ({ maquinariaId, maquinariaPlaca, onNewRecord }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMantenimiento, setCurrentMantenimiento] = useState(null); // Para editar o crear
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  const fieldLabels = [
    { name: 'tipo', label: 'Tipo' },
    { name: 'gestion', label: 'Gestión' },
    { name: 'lugar', label: 'Lugar de Mantenimiento' },
  ];

  useEffect(() => {
    if (maquinariaId) {
      fetchMantenimientos();
    }
  }, [maquinariaId]);

  const fetchMantenimientos = async () => {
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
  };

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
  };

  const validateForm = () => {
    const errors = {};
    // Add validation logic here if needed
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

      setSnackbar({ open: true, message: `Mantenimiento ${currentMantenimiento ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchMantenimientos();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Mantenimientos para Maquinaria: {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo Mantenimiento
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : mantenimientos.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de mantenimiento para esta maquinaria.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Gestión</TableCell>
              <TableCell>Lugar de Mantenimiento</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mantenimientos.map((mantenimiento) => (
              <TableRow key={mantenimiento._id}>
                <TableCell>{mantenimiento.tipo || ''}</TableCell>
                <TableCell>{mantenimiento.gestion || ''}</TableCell>
                <TableCell>{mantenimiento.lugar || ''}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => handleOpenModal(mantenimiento)}>Editar</Button>
                  <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDelete(mantenimiento._id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 4, width: '90%', maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>{currentMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</Typography>
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
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  error={!!modalErrors[field.name]}
                  helperText={modalErrors[field.name]}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={handleCloseModal}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default MantenimientoList; 