import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useIsReadOnly, useUser } from '../../../../components/UserContext';

const SOATForm = ({ onSubmit, initialData, isEditing, isReadOnly, submitLoading = false }) => {
  const [form, setForm] = useState({
    gestion: '',
    archivo_pdf: null,
    nombre_archivo: '',
    _remove_existing_file: false,
    ...initialData
  });
  const [errors, setErrors] = useState({});
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  const fieldLabels = [
    { name: 'gestion', label: 'Gestión', required: true, type: 'number' },
    { name: 'registrado_por', label: 'Registrado por', readonly: true },
    { name: 'validado_por', label: 'Validado por', readonly: true },
    { name: 'autorizado_por', label: 'Autorizado por', readonly: true },
  ];

  const validateForm = () => {
    const newErrors = {};
    fieldLabels.forEach(field => {
      if (field.required && !form[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
      if (field.name === 'gestion' && form[field.name]) {
        const gestionValue = parseInt(form[field.name]);
        if (isNaN(gestionValue) || gestionValue < 1000 || gestionValue > 9999) {
          newErrors[field.name] = 'La gestión debe ser un número de 4 dígitos (1000-9999)';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      // Verificar tamaño del archivo (máximo 20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 20MB.');
        return;
      }
      
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm({
          ...form,
          archivo_pdf: event.target.result, // base64 string
          nombre_archivo: file.name,
          _remove_existing_file: false
        });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert('Por favor selecciona un archivo PDF válido');
    }
  };

  const clearFile = () => {
    if (isEditing && initialData?.archivo_pdf) {
      setForm({
        ...form,
        archivo_pdf: null,
        nombre_archivo: '',
        _remove_existing_file: true
      });
    } else {
      setForm({ ...form, archivo_pdf: null, nombre_archivo: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const data = {
        gestion: form.gestion,
        registrado_por: form.registrado_por,
        validado_por: form.validado_por,
        autorizado_por: form.autorizado_por
      };
      
      // Solo agregar archivo si existe
      if (form.archivo_pdf) {
        data.archivo_pdf = form.archivo_pdf;
        data.nombre_archivo = form.nombre_archivo;
      } else if (isEditing && initialData?.archivo_pdf && !form._remove_existing_file) {
        data.archivo_pdf = initialData.archivo_pdf;
        data.nombre_archivo = initialData.nombre_archivo;
      }
      
      console.log('Datos preparados:', data);
      onSubmit(data);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar SOAT' : 'Nuevo Registro'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
        {fieldLabels.filter(field => 
          isEditing || !['registrado_por', 'validado_por', 'autorizado_por'].includes(field.name)
        ).map((field) => (
          <Grid item xs={12} sm={6} key={field.name}>
            <TextField
              fullWidth
              label={field.label}
              name={field.name}
              type={field.type || 'text'}
              value={form[field.name] || ''}
              onChange={(e) => {
                const value = field.name === 'gestion' ? parseInt(e.target.value) || '' : e.target.value;
                setForm({ ...form, [field.name]: value });
              }}
              error={!!errors[field.name]}
              helperText={errors[field.name]}
              required={field.required}
              disabled={
                isReadOnly || 
                (field.name === 'registrado_por') ||
                (field.name === 'validado_por' && !canEditAuthFields) ||
                (field.name === 'autorizado_por' && !canEditAuthFields)
              }
            />
          </Grid>
        ))}
        
        {/* Archivo PDF */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Archivo PDF
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-file-input"
              type="file"
              onChange={handleFileChange}
              disabled={isReadOnly}
            />
            <label htmlFor="pdf-file-input">
              <Button 
                variant="outlined" 
                component="span" 
                startIcon={<AttachFileIcon />}
                disabled={isReadOnly}
              >
                {isEditing ? 'Cambiar PDF' : 'Adjuntar PDF'}
              </Button>
            </label>
            {(form.nombre_archivo || (isEditing && initialData?.nombre_archivo)) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PictureAsPdfIcon color="error" />
                <Typography variant="body2" color="text.secondary">
                  {form.nombre_archivo || initialData?.nombre_archivo}
                  {isEditing && !form.nombre_archivo && initialData?.nombre_archivo && ' (actual)'}
                </Typography>
                {(form.archivo_pdf || (isEditing && initialData?.archivo_pdf)) && (
                  <IconButton 
                    size="small" 
                    onClick={clearFile} 
                    disabled={isReadOnly} 
                    title="Eliminar archivo"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            )}
            {isEditing && initialData?.archivo_pdf && !form.nombre_archivo && (
              <Typography variant="caption" color="text.secondary">
                (Manteniendo archivo actual)
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2, 
        mt: 3,
        flexWrap: 'wrap'
      }}>
        <Button 
          type="submit"
          variant="contained" 
          color="success"
          disabled={isReadOnly || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitLoading ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar')}
        </Button>
      </Box>
      </form>
    </Paper>
  );
};

SOATForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  submitLoading: PropTypes.bool
};

export default SOATForm; 