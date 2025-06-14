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

const ImpuestoList = ({ maquinariaId, maquinariaPlaca }) => {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImpuesto, setCurrentImpuesto] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

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

  const handleOpenModal = (impuesto = null) => {
    setCurrentImpuesto(impuesto);
    setModalForm(impuesto ? { ...impuesto } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentImpuesto(null);
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

    const method = currentImpuesto ? 'PUT' : 'POST';
    const url = currentImpuesto
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${currentImpuesto._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      importe_2023: Number(modalForm.importe_2023) || 0,
      importe_2024: Number(modalForm.importe_2024) || 0,
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

      setSnackbar({ open: true, message: `Impuesto ${currentImpuesto ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchImpuestos();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Impuestos - {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo Impuesto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : impuestos.length === 0 ? (
        <Typography align="center" sx={{ py: 5 }}>No hay registros de impuestos</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Importe 2023</TableCell>
              <TableCell>Importe 2024</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {impuestos.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i.importe_2023}</TableCell>
                <TableCell>{i.importe_2024}</TableCell>
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
          <Typography variant="h6" sx={{ mb: 3 }}>{currentImpuesto ? 'Editar' : 'Nuevo'} Impuesto</Typography>
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

ImpuestoList.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ImpuestoList;