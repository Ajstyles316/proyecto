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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`);
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

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const url = editingImpuesto 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${editingImpuesto._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/`;
    const method = editingImpuesto ? 'PUT' : 'POST';
    
    if (formData instanceof FormData) {
      console.log('FormData detectado para Impuesto:', {
        isEditing: editingImpuesto,
        hasFile: formData.get('archivo_pdf'),
        fileType: formData.get('archivo_pdf')?.constructor?.name
      });
      
      if (editingImpuesto) {
        console.log('Editando Impuesto existente');
        // Handle file for update
        if (formData.get('archivo_pdf') && formData.get('archivo_pdf') instanceof File) {
          console.log('Archivo PDF nuevo detectado en edición de Impuesto');
        } else if (editingImpuesto.archivo_pdf) {
          console.log('Manteniendo archivo PDF existente de Impuesto');
          formData.append('archivo_pdf', editingImpuesto.archivo_pdf);
          formData.append('nombre_archivo', editingImpuesto.nombre_archivo || '');
        }
      } else {
        console.log('Creando nuevo Impuesto');
        formData.append('maquinaria', maquinariaId);
        formData.append('registrado_por', user?.Nombre || user?.Email || 'Usuario');
      }
    } else {
      console.log('Objeto normal detectado para Impuesto, convirtiendo a payload');
      const payload = {
        ...formData,
        maquinaria: maquinariaId,
        ...(editingImpuesto ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
      };
      formData = payload;
    }
    
    try {
      const headers = { 'X-User-Email': user.Email };
      if (!(formData instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      console.log('Enviando petición Impuesto:', {
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
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${id}/`, {
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