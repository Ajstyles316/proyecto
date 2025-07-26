import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ControlForm from './ControlForm';
import ControlTable from './ControlTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';

const ControlMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const { user } = useUser();
  const permisosControl = user?.permisos?.Control || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosControl.eliminar;
  const canEdit = isAdminOrEncargado || permisosControl.editar;
  const isReadOnly = !canEdit && permisosControl.ver;

  const fetchControls = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/control/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar controles');
      const data = await response.json();
      setControls(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setControls([]);
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
    const url = editingControl 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/control/${editingControl._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/control/`;

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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este registro?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/control/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Control desactivado exitosamente!', severity: 'success' });
      fetchControls();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Control</Typography>;
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
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">Historial de Control</Typography>
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
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <ControlTable
        controls={controls}
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

ControlMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ControlMain; 