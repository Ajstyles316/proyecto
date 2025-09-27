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
import ImpuestoForm from './ImpuestoForm';
import ImpuestoTable from './ImpuestoTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const ImpuestoMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingImpuesto, setEditingImpuesto] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const canView = useCanView('Impuestos');
  const canCreate = useCanCreate('Impuestos');
  const canEdit = useCanEdit('Impuestos');
  const canDelete = useCanDelete('Impuestos');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('Impuestos');
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
          No tienes permisos para acceder al módulo de Impuestos.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchImpuestos = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/impuestos/`);
      if (!response.ok) throw new Error('Error al cargar Impuestos');
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

  const handleResetForm = () => {
    setShowForm(false);
    setEditingImpuesto(null);
  };

  const handleOpenEditForm = (impuesto) => {
    setEditingImpuesto(impuesto);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setSubmitLoading(true);
    const url = editingImpuesto 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/impuestos/${editingImpuesto._id}/` 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/impuestos/`;
    const method = editingImpuesto ? 'PUT' : 'POST';
    
    try {
      const payload = {
        ...data,
        maquinaria: maquinariaId
      };

      if (!editingImpuesto) {
        payload.registrado_por = user?.Nombre || user?.Email || 'Usuario';
      }

      console.log('Enviando datos Impuesto:', payload);

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
          throw new Error('El archivo PDF es demasiado grande o la operación tardó demasiado. El tamaño máximo permitido es 5MB.');
        }
        
        throw new Error(errorData.error || 'Error en la operación');
      }
      
      setSnackbar({ 
        open: true, 
        message: `Impuesto ${editingImpuesto ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchImpuestos();
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
    if (!window.confirm('¿Desactivar este Impuesto?')) return;
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/maquinaria/${maquinariaId}/impuestos/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Impuesto desactivado exitosamente!', severity: 'success' });
      fetchImpuestos();
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
        <Typography variant="h6">Impuestos</Typography>
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
            {showForm ? 'Cancelar' : 'Nuevo Impuesto'}
          </Button>
        </Box>
      </Box>

      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tienes acceso solo de lectura. No puedes crear, editar ni eliminar registros.
        </Alert>
      )}

      {showForm && (
        <ImpuestoForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingImpuesto}
          isEditing={!!editingImpuesto}
          isReadOnly={editingImpuesto && !canEdit && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <ImpuestoTable
        impuestos={impuestos}
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

ImpuestoMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ImpuestoMain; 