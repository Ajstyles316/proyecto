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

const SOATList = ({ maquinariaId, maquinariaPlaca, onNewRecord }) => {
  const [soatRecords, setSoatRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSoat, setCurrentSoat] = useState(null); // For edit or create
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  const fieldLabels = [
    { name: 'placa', label: 'Placa' },
    { name: 'importe_2024', label: 'Importe 2024', type: 'number' },
    { name: 'importe_2025', label: 'Importe 2025', type: 'number' },
  ];

  useEffect(() => {
    if (maquinariaId) {
      fetchSoatRecords();
    }
  }, [maquinariaId]);

  const fetchSoatRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`);
      if (!response.ok) throw new Error('Error al cargar registros de SOAT');
      const data = await response.json();
      setSoatRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setSoatRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (soat = null) => {
    setCurrentSoat(soat);
    setModalForm(soat ? { ...soat } : {});
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentSoat(null);
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

    const method = currentSoat ? 'PUT' : 'POST';
    const url = currentSoat
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${currentSoat._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`;

    const payload = {
      ...modalForm,
      maquinaria: maquinariaId,
      importe_2024: Number(modalForm.importe_2024) || 0,
      importe_2025: Number(modalForm.importe_2025) || 0,
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

      setSnackbar({ open: true, message: `Registro SOAT ${currentSoat ? 'actualizado' : 'creado'} exitosamente!`, severity: 'success' });
      handleCloseModal();
      fetchSoatRecords();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Registro SOAT eliminado exitosamente!', severity: 'success' });
      fetchSoatRecords();
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
        <Typography variant="h6">Registros SOAT para Maquinaria: {maquinariaPlaca}</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nuevo SOAT
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : soatRecords.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
          No hay registros de SOAT para esta maquinaria.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Importe 2024</TableCell>
              <TableCell>Importe 2025</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {soatRecords.map((soat) => (
              <TableRow key={soat._id}>
                <TableCell>{soat.placa || ''}</TableCell>
                <TableCell>{soat.importe_2024 || ''}</TableCell>
                <TableCell>{soat.importe_2025 || ''}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => handleOpenModal(soat)}>Editar</Button>
                  <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDelete(soat._id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 4, width: '90%', maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>{currentSoat ? 'Editar Registro SOAT' : 'Nuevo Registro SOAT'}</Typography>
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

export default SOATList; 