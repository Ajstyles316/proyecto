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
import { useIsReadOnly } from '../../../../components/UserContext';

const ImpuestoForm = ({ onSubmit, initialData, isEditing, isReadOnly }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const fieldLabels = [
    { name: 'importe_2023', label: 'Importe 2023', type: 'number', required: true },
    { name: 'importe_2024', label: 'Importe 2024', type: 'number', required: true },
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
        {isEditing ? 'Editar Impuesto' : 'Nuevo Registro'}
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
              error={!!errors[field.name]}
              helperText={errors[field.name]}
              required={field.required}
              disabled={isReadOnly}
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
          disabled={isReadOnly}
        >
          {isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </Box>
    </Paper>
  );
};

ImpuestoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
};

export default ImpuestoForm; 