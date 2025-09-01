import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useUser } from '../../../../components/UserContext';

const ControlForm = ({ onSubmit, initialData, isEditing, isReadOnly, submitLoading = false }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  // Usar los fieldLabels correctos del archivo centralizado
  const controlFields = [
    { name: 'fecha_inicio', label: 'Fecha de Inicio', required: true },
    { name: 'fecha_final', label: 'Fecha Final', required: true },
    { name: 'proyecto', label: 'Proyecto', required: true },
    { name: 'ubicacion', label: 'Ubicación', required: true },
    { name: 'estado', label: 'Estado', required: true},
    { name: 'tiempo', label: 'Tiempo', required: true },
    { name: 'operador', label: 'Operador', required: true },
    // Solo mostrar estos campos cuando se está editando (no al crear nuevo)
    ...(isEditing ? [
      { name: 'registrado_por', label: 'Registrado por', readonly: true },
      { name: 'validado_por', label: 'Validado por', readonly: true },
      { name: 'autorizado_por', label: 'Autorizado por', readonly: true },
    ] : []),
  ];

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
    } else {
      setForm({});
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    controlFields.forEach(field => {
      if (field.required && !form[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(form);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Control' : 'Nuevo Registro'}
      </Typography>

      <Grid container spacing={2}>
        {controlFields.map((field) => (
          <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
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
          </Grid>
        ))}
      </Grid>

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

ControlForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  submitLoading: PropTypes.bool
};

export default ControlForm;
