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
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';

const MantenimientoMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const { user } = useUser();
  const permisosMantenimiento = user?.permisos?.Mantenimiento || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosMantenimiento.eliminar;
  const canEdit = isAdminOrEncargado || permisosMantenimiento.editar;
  const isReadOnly = !canEdit && permisosMantenimiento.ver;

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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este mantenimiento?')) return;
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
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Mantenimiento</Typography>;
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
          disabled={!canEdit}
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
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <MantenimientoTable
        mantenimientos={mantenimientos}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || !canEdit}
        isEncargado={isEncargado}
      />
    </Box>
  );
};

MantenimientoMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default MantenimientoMain; 