import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
} from '@mui/material';

const AsignacionForm = ({ onSubmit, initialData, isEditing }) => {
  const [form, setForm] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  const fieldLabels = [
    { name: 'fecha_asignacion', label: 'Fecha Asignación', type: 'date', required: true },
    { name: 'fecha_liberacion', label: 'Fecha Liberación', type: 'date' },
    { name: 'recorrido_km', label: 'Recorrido Asignado (Km)', type: 'number', required: true },
    { name: 'recorrido_entregado', label: 'Recorrido Entregado (Km)', type: 'number' },
    { name: 'encargado', label: 'Encargado', type: 'text', required: false },
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

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(form);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
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

AsignacionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
};

export default AsignacionForm; 