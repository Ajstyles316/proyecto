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

const ControlForm = ({ onSubmit, initialData, isEditing }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const fieldLabels = [
    { name: 'ubicacion', label: 'Ubicación', required: true },
    { name: 'gerente', label: 'Gerente' },
    { name: 'encargado', label: 'Encargado de Activos' },
    { name: 'estado', label: 'Estado' },
    { name: 'hoja_tramite', label: 'Hoja de Trámite' },
    { name: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date', required: true },
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
        {fieldLabels.map((field) => (
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
            name="observacion"
            value={form.observacion || ''}
            onChange={(e) => setForm({ ...form, observacion: e.target.value })}
            error={!!errors.observacion}
            helperText={errors.observacion}
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
};

export default ControlForm;
