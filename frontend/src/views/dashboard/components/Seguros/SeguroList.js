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
  CircularProgress,
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SeguroList = ({ maquinariaId, maquinariaPlaca }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSeguro, setCurrentSeguro] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  // Campos del formulario con validación
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

  const handleOpenModal = (seguro = null) => {
    setCurrentSeguro(seguro);
    setModalForm(seguro ? { ...seguro } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentSeguro(null);
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

    const method = currentSeguro ? 'PUT' : 'POST';
    const url = currentSeguro
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${currentSeguro._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      importe: Number(modalForm.importe) || 0,
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

      setSnackbar({ open: true, message: `Seguro ${currentSeguro ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchSeguros();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Seguros - {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo Seguro
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : seguros.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de seguro</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>N° 2024</TableCell>
              <TableCell>Importe</TableCell>
              <TableCell>Detalle</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seguros.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.numero_2024}</TableCell>
                <TableCell>{s.importe}</TableCell>
                <TableCell>{s.detalle}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenModal(s)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}>
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
          <Typography variant="h6" sx={{ mb: 3 }}>{currentSeguro ? 'Editar' : 'Nuevo'} Seguro</Typography>
          <Grid container spacing={2}>
            {fieldLabels.map((field) => (
              <Grid item xs={12} sm={6} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={modalForm[field.name] || ''}
                  onChange={(e) => setModalForm({ ...modalForm, [field.name]: e.target.value })}
                  error={!!modalErrors[field.name]}
                  helperText={modalErrors[field.name] || ''}
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

SeguroList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SeguroList;