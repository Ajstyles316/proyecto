import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Paper,
  TextField,
  Grid,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const ControlList = ({ maquinariaId, maquinariaPlaca }) => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentControl, setCurrentControl] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

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

  const handleOpenModal = (control = null) => {
    setCurrentControl(control);
    setModalForm(control ? { ...control } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentControl(null);
    setModalForm({});
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

    const method = currentControl ? 'PUT' : 'POST';
    const url = currentControl
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/control/${currentControl._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/control/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      fecha_ingreso: modalForm.fecha_ingreso ? new Date(modalForm.fecha_ingreso).toISOString().split('T')[0] : null,
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

      setSnackbar({ open: true, message: `Control ${currentControl ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchControls();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Historial de Control - {maquinariaPlaca}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenModal()}
          >
            Nuevo Control
          </Button>
        </Box>
      </Box>

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
                    onClick={() => handleOpenModal(control)}
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

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          p: 4, 
          width: '90%', 
          maxWidth: 600 
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>{currentControl ? 'Editar Control' : 'Nuevo Control'}</Typography>
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
                  required={field.required}
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

ControlList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ControlList;