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
  Modal,
  Paper,
  TextField,
  Grid,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const AsignacionList = ({ maquinariaId, maquinariaPlaca }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAsignacion, setCurrentAsignacion] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

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

  const handleOpenModal = (asignacion = null) => {
    setCurrentAsignacion(asignacion);
    setModalForm(asignacion ? { ...asignacion } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentAsignacion(null);
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

    const method = currentAsignacion ? 'PUT' : 'POST';
    const url = currentAsignacion
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${currentAsignacion._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      fecha_asignacion: modalForm.fecha_asignacion ? new Date(modalForm.fecha_asignacion).toISOString().split('T')[0] : null,
      fecha_liberacion: modalForm.fecha_liberacion ? new Date(modalForm.fecha_liberacion).toISOString().split('T')[0] : null,
      recorrido_km: Number(modalForm.recorrido_km) || 0,
      recorrido_entregado: Number(modalForm.recorrido_entregado) || 0,
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

      setSnackbar({ open: true, message: `Asignación ${currentAsignacion ? 'actualizada' : 'creada'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchAsignaciones();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Asignaciones - {maquinariaPlaca}</Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Nueva Asignación
        </Button>
      </Box>

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
                <TableCell>{formatDate(asignacion.fecha_asignacion)}</TableCell>
                <TableCell>{formatDate(asignacion.fecha_liberacion)}</TableCell>
                <TableCell>{asignacion.recorrido_km || ''}</TableCell>
                <TableCell>{asignacion.recorrido_entregado || ''}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenModal(asignacion)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(asignacion._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal de formulario */}
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
          <Typography variant="h6" sx={{ mb: 3 }}>
            {currentAsignacion ? 'Editar Asignación' : 'Nueva Asignación'}
          </Typography>
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
AsignacionList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};
export default AsignacionList;