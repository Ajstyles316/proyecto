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

const ITVList = ({ maquinariaId, maquinariaPlaca, onNewRecord }) => {
  const [itvRecords, setItvRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItv, setCurrentItv] = useState(null); // For edit or create
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  const fieldLabels = [
    { name: 'placa', label: 'Placa' },
    { name: 'detalle', label: 'Detalle' },
    { name: 'importe', label: 'Importe', type: 'number' },
  ];

  useEffect(() => {
    if (maquinariaId) {
      fetchItvRecords();
    }
  }, [maquinariaId]);

  const fetchItvRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`);
      if (!response.ok) throw new Error('Error al cargar registros de ITV');
      const data = await response.json();
      setItvRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setItvRecords([]);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const validateForm = () => {
    const errors = {};
    // Add validation logic here if needed
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Error en la operación');
      }

      setSnackbar({ open: true, message: `Registro ITV ${currentItv ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchItvRecords();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Registro ITV eliminado exitosamente!', severity: 'success' });
      fetchItvRecords();
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
        <Typography variant="h6">Registros ITV para Maquinaria: {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo ITV
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : itvRecords.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de ITV para esta maquinaria.
        </Typography>
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
            {itvRecords.map((itv) => (
              <TableRow key={itv._id}>
                <TableCell>{itv.placa || ''}</TableCell>
                <TableCell>{itv.detalle || ''}</TableCell>
                <TableCell>{itv.importe || ''}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => handleOpenModal(itv)}>Editar</Button>
                  <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDelete(itv._id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 4, width: '90%', maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>{currentItv ? 'Editar Registro ITV' : 'Nuevo Registro ITV'}</Typography>
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
                  disabled={field.name === 'placa'}
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

export default ITVList; 