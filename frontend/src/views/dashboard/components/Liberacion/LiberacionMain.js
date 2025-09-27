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
import LiberacionForm from './LiberacionForm';
import LiberacionTable from './LiberacionTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import { useUnidades } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const LiberacionMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [liberaciones, setLiberaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingLiberacion, setEditingLiberacion] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const { normalizeUnidadForDB } = useUnidades();
  const canView = useCanView('Liberación');
  const canCreate = useCanCreate('Liberación');
  const canEdit = useCanEdit('Liberación');
  const canDelete = useCanDelete('Liberación');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('Liberación');
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
          No tienes permisos para acceder al módulo de Liberación.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchLiberaciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/liberacion/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar liberaciones');
      const data = await response.json();
      setLiberaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setLiberaciones([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user.Email]);

  useEffect(() => {
    if (maquinariaId) {
      fetchLiberaciones();
    }
  }, [maquinariaId, fetchLiberaciones]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingLiberacion(null);
  };

  const handleOpenEditForm = (liberacion) => {
    setEditingLiberacion(liberacion);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const url = editingLiberacion 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/liberacion/${editingLiberacion._id}/` 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/liberacion/`;

    const method = editingLiberacion ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      fecha_liberacion: formData.fecha_liberacion ? new Date(formData.fecha_liberacion).toISOString().split('T')[0] : null,
      kilometraje_entregado: Number(formData.kilometraje_entregado) || 0,
      unidad: normalizeUnidadForDB(formData.unidad),
      ...(editingLiberacion ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
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
        message: `Liberación ${editingLiberacion ? 'actualizada' : 'creada'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchLiberaciones();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/liberacion/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Liberación desactivada exitosamente!', severity: 'success' });
      fetchLiberaciones();
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
        <Typography variant="h6">Liberaciones</Typography>
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
            {showForm ? 'Cancelar' : 'Nueva Liberación'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <LiberacionForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingLiberacion}
          isEditing={!!editingLiberacion}
          isReadOnly={editingLiberacion && !canEdit && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <LiberacionTable
        liberaciones={liberaciones}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={canEdit}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
      />
    </Box>
  );
};

LiberacionMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default LiberacionMain;
