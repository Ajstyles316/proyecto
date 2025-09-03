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
import ControlOdometroForm from './ControlOdometroForm';
import ControlOdometroTable from './ControlOdometroTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const ControlOdometroMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [controlesOdometro, setControlesOdometro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const canView = useCanView('ControlOdometro');
  const canCreate = useCanCreate('ControlOdometro');
  const canEdit = useCanEdit('ControlOdometro');
  const canDelete = useCanDelete('ControlOdometro');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('ControlOdometro');
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isTecnico = user?.Cargo?.toLowerCase() === 'técnico';

  // Si el permiso está denegado, mostrar mensaje de acceso denegado
  if (isPermissionDenied) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder al módulo de Control de Odómetros.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const fetchControlesOdometro = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching controles de odómetro for maquinaria:', maquinariaId);
      console.log('User email:', user?.Email);
      
      const response = await fetch(`/api/maquinaria/${maquinariaId}/control-odometro/`, {
        headers: {
          'X-User-Email': user?.Email || '',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data);
        setControlesOdometro(data);
      } else {
        const errorText = await response.text();
        console.error('Error al cargar controles de odómetro:', response.status, response.statusText);
        console.error('Error response:', errorText);
        setSnackbar({
          open: true,
          message: `Error al cargar los controles de odómetro: ${response.status}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error al cargar controles de odómetro:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los controles de odómetro',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, user?.Email]);

  useEffect(() => {
    fetchControlesOdometro();
  }, [fetchControlesOdometro]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      const url = editingControl 
        ? `/api/maquinaria/${maquinariaId}/control-odometro/${editingControl._id}/`
        : `/api/maquinaria/${maquinariaId}/control-odometro/`;
      
      const method = editingControl ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user?.Email || '',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({
          open: true,
          message: editingControl ? 'Control de odómetro actualizado exitosamente' : 'Control de odómetro creado exitosamente',
          severity: 'success'
        });
        handleResetForm();
        fetchControlesOdometro();
      } else {
        const errorData = await response.json();
        console.error('Error al guardar control de odómetro:', errorData);
        setSnackbar({
          open: true,
          message: 'Error al guardar el control de odómetro',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error al guardar control de odómetro:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar el control de odómetro',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenEditForm = (control) => {
    // Solo el encargado puede editar
    if (!isEncargado) {
      setSnackbar({
        open: true,
        message: 'Solo el encargado puede editar registros existentes',
        severity: 'warning'
      });
      return;
    }
    setEditingControl(control);
    setShowForm(true);
  };

  const handleResetForm = () => {
    setShowForm(false);
    setEditingControl(null);
  };

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [id]: true }));
      const response = await fetch(`/api/maquinaria/${maquinariaId}/control-odometro/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user?.Email || '',
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Control de odómetro desactivado exitosamente',
          severity: 'success'
        });
        fetchControlesOdometro();
      } else {
        console.error('Error al desactivar control de odómetro:', response.statusText);
        setSnackbar({
          open: true,
          message: 'Error al desactivar el control de odómetro',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error al desactivar control de odómetro:', error);
      setSnackbar({
        open: true,
        message: 'Error al desactivar el control de odómetro',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
    }
  };

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
        <Typography variant="h6">Control de Odómetros</Typography>
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
            disabled={!isEncargado && !isTecnico}
          >
            {showForm ? 'Cancelar' : 'Registro de Odómetro'}
          </Button>
        </Box>
      </Box>

      {showForm && (
        <ControlOdometroForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingControl}
          isEditing={!!editingControl}
          isReadOnly={editingControl && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <ControlOdometroTable
        controlesOdometro={controlesOdometro}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={isEncargado}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
      />
    </Box>
  );
};

ControlOdometroMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ControlOdometroMain;
