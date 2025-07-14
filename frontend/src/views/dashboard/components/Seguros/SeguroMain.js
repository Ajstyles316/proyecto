import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import SeguroForm from './SeguroForm';
import SeguroTable from './SeguroTable';
import { useIsReadOnly, useUser } from '../../../../components/UserContext';

const SeguroMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingSeguro, setEditingSeguro] = useState(null);
  const { user } = useUser();
  const permisosSeguros = user?.permisos?.Seguros || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosSeguros.eliminar;
  const canEdit = isAdminOrEncargado || permisosSeguros.editar;
  const isReadOnly = !canEdit && permisosSeguros.ver;

  const fetchSeguros = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar seguros');
      const data = await response.json();
      setSeguros(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setSeguros([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user.Email]);

  useEffect(() => {
    fetchSeguros();
  }, [fetchSeguros]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingSeguro(null);
  };

  const handleOpenEditForm = (seguro) => {
    setEditingSeguro(seguro);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const url = editingSeguro 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${editingSeguro._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`;

    const method = editingSeguro ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      importe: Number(formData.importe) || 0,
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
        message: `Seguro ${editingSeguro ? 'actualizado' : 'creado'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchSeguros();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este seguro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Seguro eliminado exitosamente!', severity: 'success' });
      fetchSeguros();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Seguros</Typography>;
  }

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
        <Typography variant="h6">Seguros</Typography>
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
            {showForm ? 'Cancelar' : 'Nuevo Seguro'}
          </Button>
        </Box>
      </Box>

      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tienes acceso solo de lectura. No puedes crear, editar ni eliminar registros.
        </Alert>
      )}

      {showForm && (
        <SeguroForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingSeguro}
          isEditing={!!editingSeguro}
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <SeguroTable
        seguros={seguros}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={isReadOnly ? undefined : handleOpenEditForm}
        onDelete={isReadOnly ? undefined : handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || !canEdit}
      />
    </Box>
  );
};

SeguroMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SeguroMain; 