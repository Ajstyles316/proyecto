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

const ITVMain = ({ maquinariaId, maquinariaPlaca }) => {
  const [itvs, setItvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingItv, setEditingItv] = useState(null);

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
    };
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
    if (!window.confirm('¿Eliminar este ITV?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSnackbar({ open: true, message: 'ITV eliminado exitosamente!', severity: 'success' });
      fetchItvs();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

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
        <Typography variant="h6">ITV</Typography>
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
        >
          {showForm ? 'Cancelar' : 'Nuevo ITV'}
        </Button>
      </Box>

      {showForm && (
        <ITVForm
          onSubmit={handleSubmit}
          onCancel={handleResetForm}
          initialData={editingItv}
          isEditing={!!editingItv}
        />
      )}

      <ITVTable
        itvs={itvs}
        maquinariaPlaca={maquinariaPlaca}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
        loading={loading}
      />
    </Box>
  );
};

ITVMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
};

export default ITVMain; 