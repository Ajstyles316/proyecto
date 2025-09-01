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
import SeguroForm from './SeguroForm';
import SeguroTable from './SeguroTable';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanEdit, useCanDelete, useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const SeguroMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingSeguro, setEditingSeguro] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const { user } = useUser();
  const canView = useCanView('Seguros');
  const canCreate = useCanCreate('Seguros');
  const canEdit = useCanEdit('Seguros');
  const canDelete = useCanDelete('Seguros');
  const isReadOnly = useIsReadOnly();
  const isPermissionDenied = useIsPermissionDenied('Seguros');
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
          No tienes permisos para acceder al módulo de Seguros.
        </Typography>
      </Paper>
    );
  }

  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

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
    setSubmitLoading(true);
    const url = editingSeguro 
      ? `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${editingSeguro._id}/` 
      : `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/`;

    const method = editingSeguro ? 'PUT' : 'POST';

    // Si es FormData, agregar los campos adicionales
    if (formData instanceof FormData) {
      console.log('FormData detectado:', {
        isEditing: editingSeguro,
        hasFile: formData.get('archivo_pdf'),
        fileType: formData.get('archivo_pdf')?.constructor?.name
      });
      
      // Para edición, solo enviar los campos que han cambiado
      if (editingSeguro) {
        console.log('Editando seguro existente');
        // En edición, enviar todos los campos que estén en el FormData
        if (formData.get('fecha_inicial')) {
          formData.set('fecha_inicial', new Date(formData.get('fecha_inicial')).toISOString().split('T')[0]);
        }
        if (formData.get('fecha_final')) {
          formData.set('fecha_final', new Date(formData.get('fecha_final')).toISOString().split('T')[0]);
        }
        if (formData.get('importe')) {
          formData.set('importe', formData.get('importe'));
        }
        // Para archivos, si hay uno nuevo, enviarlo; si no, mantener el existente
        if (formData.get('archivo_pdf') && formData.get('archivo_pdf') instanceof File) {
          // Hay un archivo nuevo, mantenerlo
          console.log('Archivo PDF nuevo detectado en edición');
        } else if (editingSeguro.archivo_pdf) {
          // Mantener el archivo existente
          console.log('Manteniendo archivo PDF existente');
          formData.append('archivo_pdf', editingSeguro.archivo_pdf);
          formData.append('nombre_archivo', editingSeguro.nombre_archivo || '');
        }
      } else {
        // Para creación, agregar todos los campos requeridos
        console.log('Creando nuevo seguro');
        formData.append('maquinaria', maquinariaId);
        formData.append('fecha_inicial', formData.get('fecha_inicial') ? new Date(formData.get('fecha_inicial')).toISOString().split('T')[0] : '');
        formData.append('fecha_final', formData.get('fecha_final') ? new Date(formData.get('fecha_final')).toISOString().split('T')[0] : '');
        formData.append('importe', formData.get('importe') || '0');
        formData.append('registrado_por', user?.Nombre || user?.Email || 'Usuario');
      }
    } else {
      // Si es objeto normal, crear payload
      console.log('Objeto normal detectado, convirtiendo a payload');
      const payload = {
        ...formData,
        maquinaria: maquinariaId,
        fecha_inicial: formData.fecha_inicial ? new Date(formData.fecha_inicial).toISOString().split('T')[0] : null,
        fecha_final: formData.fecha_final ? new Date(formData.fecha_final).toISOString().split('T')[0] : null,
        importe: Number(formData.importe) || 0,
        ...(editingSeguro ? {} : { registrado_por: user?.Nombre || user?.Email || 'Usuario' }),
      };
      formData = payload;
    }

    try {
      const headers = {
        'X-User-Email': user.Email
      };

      // Solo agregar Content-Type si no es FormData
      if (!(formData instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      console.log('Enviando petición:', {
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este seguro?')) return;
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.Email
        }
      });
      if (!response.ok) throw new Error('Error al desactivar');
      setSnackbar({ open: true, message: 'Seguro desactivado exitosamente!', severity: 'success' });
      fetchSeguros();
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
        <Typography variant="h6">Seguro Anual</Typography>
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
          isReadOnly={editingSeguro && !canEdit && !isEncargado}
          submitLoading={submitLoading}
        />
      )}

      <SeguroTable
        seguros={seguros}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
        isReadOnly={isReadOnly || (!canEdit && !isEncargado)}
        canEdit={canEdit}
        canDelete={canDelete || isEncargado}
        deleteLoading={deleteLoading}
      />
    </Box>
  );
};

SeguroMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default SeguroMain; 