import { useState, useEffect } from 'react';
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
import { useIsReadOnly, useUser } from '../../../../components/UserContext';

const SeguroForm = ({ onSubmit, initialData, isEditing, submitLoading = false }) => {
  const [form, setForm] = useState({
    fecha_inicial: '',
    fecha_final: '',
    numero_poliza: '',
    compania_aseguradora: '',
    importe: '',
    archivo_pdf: null,
    nombre_archivo: '',
  });
  const [errors, setErrors] = useState({});
  const isReadOnly = useIsReadOnly();
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  useEffect(() => {
    if (initialData) {
      setForm({
        fecha_inicial: initialData.fecha_inicial || '',
        fecha_final: initialData.fecha_final || '',
        numero_poliza: initialData.numero_poliza || '',
        compania_aseguradora: initialData.compania_aseguradora || '',
        importe: initialData.importe || '',
        archivo_pdf: initialData.archivo_pdf || null,
        nombre_archivo: initialData.nombre_archivo || '',
      });
    }
  }, [initialData]);

  const fieldLabels = [
    { name: 'fecha_inicial', label: 'Fecha Inicial', type: 'date', required: true },
    { name: 'fecha_final', label: 'Fecha Final', type: 'date', required: true },
    { name: 'numero_poliza', label: 'N° Póliza', required: true },
    { name: 'compania_aseguradora', label: 'Compañía Aseguradora', required: true },
    { name: 'importe', label: 'Importe', type: 'number', required: true },
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
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setForm({
        ...form,
        archivo_pdf: file,
        nombre_archivo: file.name
      });
    } else {
      alert('Por favor selecciona un archivo PDF válido');
    }
  };

  const removeFile = () => {
    setForm({
      ...form,
      archivo_pdf: null,
      nombre_archivo: ''
    });
  };

  // Función para limpiar archivo en edición
  const clearFile = () => {
    if (isEditing && initialData?.archivo_pdf) {
      // En edición, marcar que se quiere eliminar el archivo existente
      setForm({
        ...form,
        archivo_pdf: null,
        nombre_archivo: '',
        _remove_existing_file: true // Marca para eliminar archivo existente
      });
    } else {
      removeFile();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Crear FormData para enviar archivo
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'archivo_pdf') {
          // Para archivos PDF, manejar diferente en edición vs creación
          if (form[key]) {
            // Hay un archivo nuevo o existente
            formData.append(key, form[key]);
            if (form.nombre_archivo) {
              formData.append('nombre_archivo', form.nombre_archivo);
            }
          } else if (isEditing && initialData?.archivo_pdf && !form._remove_existing_file) {
            // En edición, si no hay archivo nuevo pero hay uno existente y no se quiere eliminar, mantenerlo
            formData.append(key, initialData.archivo_pdf);
            if (initialData.nombre_archivo) {
              formData.append('nombre_archivo', initialData.nombre_archivo);
            }
          }
          // Si _remove_existing_file es true, no se envía el archivo (se elimina)
        } else if (key !== 'archivo_pdf' && key !== '_remove_existing_file' && form[key] !== null && form[key] !== undefined && form[key] !== '') {
          // Solo enviar campos que tengan valor (no vacíos)
          formData.append(key, form[key]);
        }
      });
      onSubmit(formData);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Seguro' : 'Nuevo Seguro'}
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
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
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
          
          {/* Campo de archivo PDF */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                accept=".pdf"
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
              
              {/* Mostrar archivo actual o nuevo */}
              {(form.nombre_archivo || (isEditing && initialData?.nombre_archivo)) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              
              {/* Información adicional en edición */}
              {isEditing && initialData?.archivo_pdf && !form.archivo_pdf && (
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
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitLoading ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

SeguroForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    fecha_inicial: PropTypes.string,
    fecha_final: PropTypes.string,
    numero_poliza: PropTypes.string,
    compania_aseguradora: PropTypes.string,
    importe: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    archivo_pdf: PropTypes.object,
    nombre_archivo: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
  submitLoading: PropTypes.bool
};

export default SeguroForm; 