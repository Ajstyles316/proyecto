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

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const url = editingSOAT 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${editingSOAT._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/`;
    const method = editingSOAT ? 'PUT' : 'POST';
    
    if (formData instanceof FormData) {
      console.log('FormData detectado para SOAT:', {
        isEditing: editingSOAT,
        hasFile: formData.get('archivo_pdf'),
        fileType: formData.get('archivo_pdf')?.constructor?.name
      });
      
      if (editingSOAT) {
        console.log('Editando SOAT existente');
        // Handle file for update
        if (formData.get('archivo_pdf') && formData.get('archivo_pdf') instanceof File) {
          console.log('Archivo PDF nuevo detectado en edición de SOAT');
        } else if (editingSOAT.archivo_pdf) {
          console.log('Manteniendo archivo PDF existente de SOAT');
          formData.append('archivo_pdf', editingSOAT.archivo_pdf);
          formData.append('nombre_archivo', editingSOAT.nombre_archivo || '');
        }
      } else {
        console.log('Creando nuevo SOAT');
        formData.append('maquinaria', maquinariaId);
        formData.append('registrado_por', user?.Nombre || user?.Email || 'Usuario');
      }
    } else {
      console.log('Objeto normal detectado para SOAT, convirtiendo a payload');
      const payload = {
        ...formData,
        maquinaria: maquinariaId,
        ...(editingSOAT ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
      };
      formData = payload;
    }
    
    try {
      const headers = { 'X-User-Email': user.Email };
      if (!(formData instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      console.log('Enviando petición SOAT:', {
        method,
        url,
        headers,
        isFormData: formData instanceof FormData,
        bodyType: formData instanceof FormData ? 'FormData' : 'JSON'
      });
      const response = await fetch(url, {
        method,
        headers,
        body: formData instanceof FormData ? formData : JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${id}/`, {
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