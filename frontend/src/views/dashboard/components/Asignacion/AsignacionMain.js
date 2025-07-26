import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import AsignacionForm from './AsignacionForm';
import AsignacionTable from './AsignacionTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';

const AsignacionMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const { user } = useUser();
  const permisosAsignacion = user?.permisos?.['Asignación'] || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosAsignacion.eliminar;
  const canEdit = isAdminOrEncargado || permisosAsignacion.editar;
  const isReadOnly = !canEdit && permisosAsignacion.ver;

  const fetchAsignaciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      const data = await response.json();
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user.Email]);

  useEffect(() => {
    if (maquinariaId) {
      fetchAsignaciones();
    }
  }, [maquinariaId, fetchAsignaciones]);

  const handleResetForm = () => {
    setShowForm(false);
    setEditingAsignacion(null);
  };

  const handleOpenEditForm = (asignacion) => {
    setEditingAsignacion(asignacion);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    const url = editingAsignacion 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${editingAsignacion._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/`;

    const method = editingAsignacion ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      fechaAsignacion: formData.fechaAsignacion ? new Date(formData.fechaAsignacion).toISOString().split('T')[0] : null,
      fechaLiberacion: formData.fechaLiberacion ? new Date(formData.fechaLiberacion).toISOString().split('T')[0] : null,
      recorrido_km: Number(formData.recorrido_km) || 0,
      recorrido_entregado: Number(formData.recorrido_entregado) || 0,
      ...(editingAsignacion ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
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
        message: `Asignación ${editingAsignacion ? 'actualizada' : 'creada'} exitosamente!`, 
        severity: 'success' 
      });
      
      handleResetForm();
      fetchAsignaciones();
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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Asignación desactivada exitosamente!', severity: 'success' });
      fetchAsignaciones();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Asignación</Typography>;
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
        <Typography variant="h6">Asignaciones</Typography>
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
            {showForm ? 'Cancelar' : 'Nueva Asignación'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <AsignacionForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingAsignacion}
          isEditing={!!editingAsignacion}
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <AsignacionTable
        asignaciones={asignaciones}
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

AsignacionMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default AsignacionMain; 