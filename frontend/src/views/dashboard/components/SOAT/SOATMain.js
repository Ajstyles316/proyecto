import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import SOATForm from './SOATForm';
import SOATTable from './SOATTable';

const SOATMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [soats, setSoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingSoat, setEditingSoat] = useState(null);

  const fetchSoats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`);
      if (!response.ok) throw new Error('Error al cargar SOATs');
      const data = await response.json();
      setSoats(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setSoats([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    if (maquinariaId) fetchSoats();
  }, [maquinariaId, fetchSoats]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingSoat(null);
  };

  const handleOpenEditForm = (soat) => {
    setEditingSoat(soat);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const method = editingSoat ? 'PUT' : 'POST';
    const url = editingSoat
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${editingSoat._id}/`
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`;
    
    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      importe_2024: Number(formData.importe_2024) || 0,
      importe_2025: Number(formData.importe_2025) || 0,
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
        message: `SOAT ${editingSoat ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchSoats();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'SOAT eliminado exitosamente!', severity: 'success' });
      fetchSoats();
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

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">SOAT</Typography>
        <Button 
          variant="contained" 
          color={showForm ? "error" : "success"}
          onClick={() => {
            if (showForm) {
              handleResetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo SOAT'}
        </Button>
      </Box>

      {showForm && (
        <SOATForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingSoat}
          isEditing={!!editingSoat}
        />
      )}

      <SOATTable
        soats={soats}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
      />
    </Box>
  );
};

SOATMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SOATMain; 