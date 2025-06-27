import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import AsignacionForm from './AsignacionForm';
import AsignacionTable from './AsignacionTable';

const AsignacionMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);

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

  const handleResetForm = () => {
    setShowForm(false);
    setEditingAsignacion(null);
  };

  const handleOpenEditForm = (asignacion) => {
    setEditingAsignacion(asignacion);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const url = editingAsignacion 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${editingAsignacion._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`;

    const method = editingAsignacion ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      fecha_asignacion: formData.fecha_asignacion ? new Date(formData.fecha_asignacion).toISOString().split('T')[0] : null,
      fecha_liberacion: formData.fecha_liberacion ? new Date(formData.fecha_liberacion).toISOString().split('T')[0] : null,
      recorrido_km: Number(formData.recorrido_km) || 0,
      recorrido_entregado: Number(formData.recorrido_entregado) || 0,
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

      setSnackbar({ 
        open: true, 
        message: `Asignación ${editingAsignacion ? 'actualizada' : 'creada'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchAsignaciones();
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
        <Typography variant="h6">Asignaciones</Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: { xs: 2, sm: 0 }
        }}>
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
            {showForm ? 'Cancelar' : 'Nueva Asignación'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <AsignacionForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingAsignacion}
          isEditing={!!editingAsignacion}
        />
      )}

      <AsignacionTable
        asignaciones={asignaciones}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
      />
    </Box>
  );
};

AsignacionMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default AsignacionMain; 