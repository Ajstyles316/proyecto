import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ITVForm from './ITVForm';
import ITVTable from './ITVTable';
import { useIsReadOnly, useUser } from '../../../../components/UserContext';

const ITVMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [itvs, setItvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingItv, setEditingItv] = useState(null);
  const { user } = useUser();
  const permisosITV = user?.permisos?.ITV || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosITV.eliminar;
  const canEdit = isAdminOrEncargado || permisosITV.editar;
  const isReadOnly = !canEdit && permisosITV.ver;

  const fetchItvs = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`);
      if (!response.ok) throw new Error('Error al cargar ITVs');
      const data = await response.json();
      setItvs(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setItvs([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId]);

  useEffect(() => {
    fetchItvs();
  }, [fetchItvs]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingItv(null);
  };

  const handleOpenEditForm = (itv) => {
    setEditingItv(itv);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const url = editingItv 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${editingItv._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/`;
    const method = editingItv ? 'PUT' : 'POST';
    
    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      importe: Number(formData.importe) || 0,
      ...(editingItv ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
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
        message: `ITV ${editingItv ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchItvs();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este ITV?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'ITV desactivado exitosamente!', severity: 'success' });
      fetchItvs();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a ITV</Typography>;
  }

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
        <Typography variant="h6">Inspección Técnica Vehicular - ITV</Typography>
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
            disabled={!canEdit}
          >
            {showForm ? 'Cancelar' : 'Nuevo ITV'}
          </Button>
        </Box>
      </Box>

      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tienes acceso solo de lectura. No puedes crear, editar ni eliminar registros.
        </Alert>
      )}

      {showForm && (
        <ITVForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingItv}
          isEditing={!!editingItv}
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <ITVTable
        itvs={itvs}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={isReadOnly ? undefined : handleOpenEditForm}
        onDelete={isReadOnly ? undefined : handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || !canEdit}
        isEncargado={isEncargado}
      />
    </Box>
  );
};

ITVMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ITVMain; 