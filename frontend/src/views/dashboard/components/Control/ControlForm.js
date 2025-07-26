import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useUser } from '../../../../components/UserContext';

const ControlForm = ({ onSubmit, initialData, isEditing, isReadOnly }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  const fieldLabels = [
    { name: 'ubicacion', label: 'Ubicación', required: true },
    { name: 'gerente', label: 'Gerente' },
    { name: 'encargado', label: 'Encargado de Activos' },
    { name: 'estado', label: 'Estado' },
    { name: 'hoja_tramite', label: 'Hoja de Trámite' },
    { name: 'fecha', label: 'Fecha de Ingreso', type: 'date', required: true },
    { name: 'registrado_por', label: 'Registrado por', readonly: true },
    { name: 'validado_por', label: 'Validado por', readonly: true },
    { name: 'autorizado_por', label: 'Autorizado por', readonly: true },
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
    fieldLabels.forEach(field => {
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

        {/* Campo de Observación visible siempre, grande y multiline */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Observación"
            name="observaciones"
            value={form.observaciones || ''}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            error={!!errors.observaciones}
            helperText={errors.observaciones}
            disabled={isReadOnly}
          />
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
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={isReadOnly}
        >
          {isEditing ? 'Actualizar' : 'Guardar'}
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
};

export default ControlForm;
