import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import ControlForm from './ControlForm';
import ControlTable from './ControlTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const ControlMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const canView = useCanView('Control');
  const canCreate = useCanCreate('Control');
  const canEdit = useCanEdit('Control');
  const canDelete = useCanDelete('Control');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('Control');
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';

  // Si el permiso está denegado, mostrar mensaje de acceso denegado
  if (isPermissionDenied) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder al módulo de Control.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchControls = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/control/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar controles');
      const data = await response.json();
      setControles(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setControles([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user.Email]);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingControl(null);
  };

  const handleOpenEditForm = (control) => {
    setEditingControl(control);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const url = editingControl 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/control/${editingControl._id}/` 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/control/`;

    const method = editingControl ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      fecha: formData.fecha ? new Date(formData.fecha).toISOString().split('T')[0] : null,
      ...(editingControl ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
    };



    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.Email
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Error en la operación');
      }

      setSnackbar({ 
        open: true, 
        message: `Control ${editingControl ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchControls();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este registro?')) return;
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      console.log('Desactivando registro:', id);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/control/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      console.log('Respuesta DELETE:', response.status, response.statusText);
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Control desactivado exitosamente!', severity: 'success' });
      console.log('Recargando controles...');
      await fetchControls();
      console.log('Controles recargados');
    } catch (error) {
      console.error('Error en handleDelete:', error);
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Removed isDenied check as we're using new permission system

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
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Control y Seguimiento</Typography>
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
            disabled={!canCreate}
          >
            {showForm ? 'Cancelar' : 'Nuevo Control'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <ControlForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingControl}
          isEditing={!!editingControl}
          isReadOnly={editingControl && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <ControlTable
        controls={controles}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={isEncargado}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
      />
    </Box>
  );
};

ControlMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ControlMain; 