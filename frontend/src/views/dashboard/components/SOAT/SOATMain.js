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
import SOATForm from './SOATForm';
import SOATTable from './SOATTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const SOATMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [soats, setSoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingSOAT, setEditingSOAT] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const canView = useCanView('SOAT');
  const canCreate = useCanCreate('SOAT');
  const canEdit = useCanEdit('SOAT');
  const canDelete = useCanDelete('SOAT');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('SOAT');
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
          No tienes permisos para acceder al módulo de SOAT.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchSOATs = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/soat/`);
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
    fetchSOATs();
  }, [fetchSOATs]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingSOAT(null);
  };

  const handleOpenEditForm = (soat) => {
    setEditingSOAT(soat);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setSubmitLoading(true);
    const url = editingSOAT 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/soat/${editingSOAT._id}/` 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/soat/`;
    const method = editingSOAT ? 'PUT' : 'POST';
    
    try {
      const payload = {
        ...data,
        maquinaria: maquinariaId
      };

      if (!editingSOAT) {
        payload.registrado_por = user?.Nombre || user?.Email || 'Usuario';
      }

      console.log('Enviando datos SOAT:', payload);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.Email
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Manejar error específico de archivo demasiado grande
        if (response.status === 413 || (errorData.error && (errorData.error.includes('demasiado grande') || errorData.error.includes('timeout')))) {
          throw new Error('El archivo PDF es demasiado grande o la operación tardó demasiado. El tamaño máximo permitido es 20MB.');
        }
        
        throw new Error(errorData.error || 'Error en la operación');
      }
      
      setSnackbar({ 
        open: true, 
        message: `SOAT ${editingSOAT ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchSOATs();
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
    if (!window.confirm('¿Desactivar este SOAT?')) return;
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/soat/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'SOAT desactivado exitosamente!', severity: 'success' });
      fetchSOATs();
    } catch (error) {
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
        <Typography variant="h6">SOAT</Typography>
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
            {showForm ? 'Cancelar' : 'Nuevo SOAT'}
          </Button>
        </Box>
      </Box>

      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tienes acceso solo de lectura. No puedes crear, editar ni eliminar registros.
        </Alert>
      )}

      {showForm && (
        <SOATForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingSOAT}
          isEditing={!!editingSOAT}
          isReadOnly={editingSOAT && !canEdit && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <SOATTable
        soats={soats}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={canEdit}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
        showActionsColumn={!(user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'tecnico' || user?.Cargo?.toLowerCase() === 'técnico')}
      />
    </Box>
  );
};

SOATMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SOATMain; 