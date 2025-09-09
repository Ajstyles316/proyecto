import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import MantenimientoForm from './MantenimientoForm';
import MantenimientoTable from './MantenimientoTable';
import HojaVidaMantenimiento from '../Reportes/HojaVidaMantenimiento';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';
import DescriptionIcon from '@mui/icons-material/Description';

const MantenimientoMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [showHojaVida, setShowHojaVida] = useState(false);
  const [maquinariaData, setMaquinariaData] = useState(null);
  const { user } = useUser();
  const canView = useCanView('Mantenimiento');
  const canCreate = useCanCreate('Mantenimiento');
  const canEdit = useCanEdit('Mantenimiento');
  const canDelete = useCanDelete('Mantenimiento');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('Mantenimiento');
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
          No tienes permisos para acceder al módulo de Mantenimiento.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchMantenimientos = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar mantenimientos');
      const data = await response.json();
      setMantenimientos(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user.Email]);

  const fetchMaquinariaData = useCallback(async () => {
    if (!maquinariaId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar datos de maquinaria');
      const data = await response.json();
      setMaquinariaData(data);
    } catch (error) {
      console.error('Error al cargar datos de maquinaria:', error);
    }
  }, [maquinariaId, user.Email]);

  useEffect(() => {
    fetchMantenimientos();
    fetchMaquinariaData();
  }, [fetchMantenimientos, fetchMaquinariaData]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingMantenimiento(null);
  };

  const handleOpenEditForm = (mantenimiento) => {
    setEditingMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const url = editingMantenimiento 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${editingMantenimiento._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/`;

    const method = editingMantenimiento ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      // Convertir fecha si viene como string
      fecha_mantenimiento: formData.fecha_mantenimiento || new Date().toISOString().split('T')[0],
      ...(editingMantenimiento ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este mantenimiento?')) return;
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Mantenimiento desactivado exitosamente!', severity: 'success' });
      fetchMantenimientos();
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
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6">Mantenimientos</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="info"
            startIcon={<DescriptionIcon />}
            onClick={() => setShowHojaVida(true)}
            disabled={mantenimientos.length === 0}
          >
            Hoja de Vida
          </Button>
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
            {showForm ? 'Cancelar' : 'Nuevo Mantenimiento'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <MantenimientoForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingMantenimiento}
          isEditing={!!editingMantenimiento}
          isReadOnly={editingMantenimiento && !canEdit && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <MantenimientoTable
        mantenimientos={mantenimientos}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={canEdit}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
      />

      {/* Diálogo para mostrar la hoja de vida */}
      <Dialog
        open={showHojaVida}
        onClose={() => setShowHojaVida(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Hoja de Vida Historial de Mantenimiento
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <HojaVidaMantenimiento 
            maquinaria={maquinariaData} 
            mantenimientos={mantenimientos} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setShowHojaVida(false)}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

MantenimientoMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default MantenimientoMain; 