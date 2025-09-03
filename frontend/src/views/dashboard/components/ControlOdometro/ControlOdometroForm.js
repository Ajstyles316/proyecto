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
  Card,
  CardMedia,
  CardActions,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useUser } from '../../../../components/UserContext';
import { useUnidades } from '../../../../components/hooks';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';

const ControlOdometroForm = ({ onSubmit, initialData, isEditing, isReadOnly, submitLoading = false }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [fotos, setFotos] = useState([]);
  const [fotoFiles, setFotoFiles] = useState([]);
  const { user } = useUser();
  const { unidades, normalizeUnidadForDB } = useUnidades();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado; // Solo el encargado puede validar y autorizar

  // Campos del formulario
  const controlOdometroFields = [
    { name: 'unidad', label: 'Unidad', required: true, type: 'text' },
    { name: 'odometro_inicial', label: 'Odómetro Inicial', required: true, type: 'number' },
    { name: 'odometro_final', label: 'Odómetro Final', required: true, type: 'number' },
    { name: 'odometro_mes', label: 'Odómetro del Mes', required: true, type: 'number' },
    // Solo mostrar estos campos cuando se está editando (no al crear nuevo)
    ...(isEditing ? [
      { name: 'registrado_por', label: 'Registrado por', readonly: true },
      { name: 'validado_por', label: 'Validado por', readonly: !canEditAuthFields },
      { name: 'autorizado_por', label: 'Autorizado por', readonly: !canEditAuthFields },
    ] : []),
  ];



  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
      // Cargar fotos existentes si las hay
      if (initialData.fotos && Array.isArray(initialData.fotos)) {
        setFotos(initialData.fotos);
      }
    } else {
      setForm({});
      setFotos([]);
      setFotoFiles([]);
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos requeridos
    controlOdometroFields.forEach(field => {
      if (field.required && !form[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
    });

    // Validar que se hayan subido fotos antes de guardar
    if (!isEditing && fotos.length === 0) {
      newErrors.fotos = 'Debe subir al menos una foto antes de guardar';
    }

    // Validar que los odómetros sean números válidos
    if (form.odometro_inicial && form.odometro_inicial < 0) {
      newErrors.odometro_inicial = 'El odómetro inicial no puede ser negativo';
    }
    if (form.odometro_final && form.odometro_final < 0) {
      newErrors.odometro_final = 'El odómetro final no puede ser negativo';
    }
    if (form.odometro_mes && form.odometro_mes < 0) {
      newErrors.odometro_mes = 'El odómetro del mes no puede ser negativo';
    }

    // Validar que el odómetro final sea mayor o igual al inicial
    if (form.odometro_final && form.odometro_inicial && parseFloat(form.odometro_final) < parseFloat(form.odometro_inicial)) {
      newErrors.odometro_final = 'El odómetro final debe ser mayor o igual al inicial';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/jpg';
      if (!isValidType) {
        setErrors(prev => ({
          ...prev,
          fotos: 'Solo se permiten archivos JPG o JPEG'
        }));
      }
      return isValidType;
    });

    if (validFiles.length > 0) {
      setErrors(prev => ({ ...prev, fotos: null }));
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFoto = e.target.result;
          setFotos(prev => [...prev, newFoto]);
          setFotoFiles(prev => [...prev, file]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
    setFotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const formData = {
        ...form,
        unidad: normalizeUnidadForDB(form.unidad),
        fotos: fotos
      };

      // Manejar campos de auditoría según el cargo del usuario
      if (isEditing) {
        // Solo el encargado puede validar
        if (canEditAuthFields && form.validado_por === '') {
          formData.validado_por = null; // Enviar null para indicar que se debe validar
        }
        
        // Solo el encargado puede autorizar
        if (canEditAuthFields && form.autorizado_por === '') {
          formData.autorizado_por = null; // Enviar null para indicar que se debe autorizar
        }
      }

      onSubmit(formData);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Control de Odómetro' : 'Nuevo Control de Odómetro'}
              </Typography>

        <Grid container spacing={2}>
        {controlOdometroFields.map((field) => (
          <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
            {field.name === 'unidad' ? (
              <TextField
                select
                fullWidth
                label={field.label}
                name={field.name}
                value={form[field.name] || ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                required={field.required}
                disabled={isReadOnly}
              >
                <MenuItem value="">Seleccione una unidad</MenuItem>
                {unidades.map((unidad) => (
                  <MenuItem key={unidad} value={unidad}>
                    {unidad}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={form[field.name] || ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                multiline={field.multiline}
                minRows={field.multiline ? 4 : undefined}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                required={field.required}
                disabled={isReadOnly ||
                  (field.name === 'registrado_por') ||
                  (field.name === 'validado_por' && !canEditAuthFields) ||
                  (field.name === 'autorizado_por' && !canEditAuthFields)
                }
              />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Sección de fotos */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Fotos del Odómetro
        </Typography>
        
        {/* Botón para subir fotos */}
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/jpeg,image/jpg"
            style={{ display: 'none' }}
            id="foto-upload"
            multiple
            type="file"
            onChange={handleFileChange}
            disabled={isReadOnly}
          />
          <label htmlFor="foto-upload">
            <IconButton
              color="primary"
              aria-label="subir fotos"
              component="span"
              disabled={isReadOnly}
            >
              <PhotoCameraIcon />
            </IconButton>
            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
              Subir fotos (JPG/JPEG)
            </Typography>
          </label>
        </Box>

        {/* Mostrar error de fotos */}
        {errors.fotos && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {errors.fotos}
          </Typography>
        )}

        {/* Grid de fotos */}
        <Grid container spacing={2}>
          {fotos.map((foto, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={foto}
                  alt={`Foto ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardActions>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeFoto(index)}
                    disabled={isReadOnly}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Mensaje informativo */}
        {!isEditing && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            * Es obligatorio subir al menos una foto antes de guardar el registro
          </Typography>
        )}
      </Box>

      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 3,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={isReadOnly || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitLoading ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar')}
        </Button>
      </Box>
    </Paper>
  );
};

ControlOdometroForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  submitLoading: PropTypes.bool
};

export default ControlOdometroForm;
