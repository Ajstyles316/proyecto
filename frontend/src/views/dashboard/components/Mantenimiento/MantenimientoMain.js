import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import MantenimientoForm from './MantenimientoForm';
import MantenimientoTable from './MantenimientoTable';
import { useIsReadOnly } from 'src/components/UserContext.jsx';

const MantenimientoMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const isReadOnly = useIsReadOnly();

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

  const handleResetForm = () => {
    setShowForm(false);
    setEditingMantenimiento(null);
  };

  const handleOpenEditForm = (mantenimiento) => {
    setEditingMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const url = editingMantenimiento 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${editingMantenimiento._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`;

    const method = editingMantenimiento ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      cantidad: Number(formData.cantidad) || 0,
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
        message: `Mantenimiento ${editingMantenimiento ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchMantenimientos();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
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
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Mantenimientos</Typography>
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
          disabled={isReadOnly}
        >
          {showForm ? 'Cancelar' : 'Nuevo Mantenimiento'}
        </Button>
      </Box>

      {showForm && (
        <MantenimientoForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingMantenimiento}
          isEditing={!!editingMantenimiento}
          isReadOnly={isReadOnly}
        />
      )}

      <MantenimientoTable
        mantenimientos={mantenimientos}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly}
      />
    </Box>
  );
};

MantenimientoMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default MantenimientoMain; 