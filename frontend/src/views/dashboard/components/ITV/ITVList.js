import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ITVList = ({ maquinariaId, maquinariaPlaca }) => {
  const [itvs, setItvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItv, setCurrentItv] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  // Campos del formulario con validación
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

  const handleOpenModal = (itv = null) => {
    setCurrentItv(itv);
    setModalForm(itv ? { ...itv } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentItv(null);
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

    const method = currentItv ? 'PUT' : 'POST';
    const url = currentItv
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${currentItv._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`;

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

      setSnackbar({ open: true, message: `ITV ${currentItv ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchItvs();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">ITV - {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo ITV
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : itvs.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de ITV</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Detalle</TableCell>
              <TableCell>Importe</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itvs.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i.detalle}</TableCell>
                <TableCell>{i.importe}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenModal(i)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(i._id)}>
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
          <Typography variant="h6" sx={{ mb: 3 }}>{currentItv ? 'Editar' : 'Nuevo'} ITV</Typography>
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

ITVList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ITVList;