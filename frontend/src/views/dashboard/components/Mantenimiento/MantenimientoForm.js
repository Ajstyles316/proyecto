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
import { useUser } from '../../../../components/UserContext';

const MantenimientoForm = ({ onSubmit, initialData, isEditing, isReadOnly }) => {
  const [form, setForm] = useState(initialData || {});
  const [errors, setErrors] = useState({});
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  const fieldLabels = [
    { name: 'tipo', label: 'Tipo', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
    { name: 'gestion', label: 'Gestión', required: true },
    { name: 'ubicacion', label: 'Ubicación', required: true },
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

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(form);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isEditing ? 'Editar Mantenimiento' : 'Nuevo Registro'}
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

MantenimientoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
};

export default MantenimientoForm; 