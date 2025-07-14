import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ImpuestoForm from './ImpuestoForm';
import ImpuestoTable from './ImpuestoTable';
import { useIsReadOnly, useUser } from '../../../../components/UserContext';

const ImpuestoMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingImpuesto, setEditingImpuesto] = useState(null);
  const { user } = useUser();
  const permisosImpuestos = user?.permisos?.Impuestos || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosImpuestos.eliminar;
  const canEdit = isAdminOrEncargado || permisosImpuestos.editar;
  const isReadOnly = !canEdit && permisosImpuestos.ver;

  const fetchImpuestos = useCallback(async () => {
    if (!maquinariaId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`);
      if (!response.ok) throw new Error('Error al cargar impuestos');
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

  const handleSubmit = async (formData) => {
    const url = editingImpuesto 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${editingImpuesto._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`;

    const method = editingImpuesto ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      maquinaria: maquinariaId,
      importe_2023: Number(formData.importe_2023) || 0,
      importe_2024: Number(formData.importe_2024) || 0,
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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este impuesto?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'Impuesto eliminado exitosamente!', severity: 'success' });
      fetchImpuestos();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Impuestos</Typography>;
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
            disabled={!canEdit}
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
          isReadOnly={isReadOnly || !canEdit}
        />
      )}

      <ImpuestoTable
        impuestos={impuestos}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={isReadOnly ? undefined : handleOpenEditForm}
        onDelete={isReadOnly ? undefined : handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || !canEdit}
      />
    </Box>
  );
};

ImpuestoMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ImpuestoMain; 