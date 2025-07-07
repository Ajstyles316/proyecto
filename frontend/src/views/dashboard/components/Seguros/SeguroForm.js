import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { useIsReadOnly } from '../../../../components/UserContext';

const SeguroForm = ({ onSubmit, initialData, isEditing }) => {
  const [form, setForm] = useState({
    numero2024: '',
    importe: '',
    detalle: '',
  });
  const [errors, setErrors] = useState({});
  const isReadOnly = useIsReadOnly();

  useEffect(() => {
    if (initialData) {
      setForm({
        numero2024: initialData.numero2024 || '',
        importe: initialData.importe || '',
        detalle: initialData.detalle || '',
      });
    }
  }, [initialData]);

  const fieldLabels = [
    { name: 'numero2024', label: 'N° 2024', required: true },
    { name: 'importe', label: 'Importe', type: 'number', required: true },
    { name: 'detalle', label: 'Detalle', required: true },
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(form);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Seguro' : 'Nuevo Seguro'}
      </Typography>
      <form onSubmit={handleSubmit}>
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
            type="submit"
            variant="contained" 
            color="success"
          >
            {isEditing ? 'Actualizar' : 'Guardar'}
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
    numero2024: PropTypes.string,
    importe: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    detalle: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default SeguroForm; 