import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, Button, Grid, MenuItem } from '@mui/material';

const NovedadesForm = ({ onSubmit, onCancel, initialData, isEditing, isReadOnly, submitLoading, maquinariaOptions }) => {
  const [form, setForm] = React.useState(initialData || {});
  React.useEffect(() => { setForm(initialData || {}); }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  // opciones ya FILTRADAS por unidad desde el padre
  const detallesUnicos = React.useMemo(
    () => Array.from(new Set(maquinariaOptions.map(m => m.detalle))).filter(Boolean),
    [maquinariaOptions]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {/* Placa (de la unidad activa) */}
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Placa"
            name="placa"
            value={form.placa ?? ''}
            onChange={(e) => {
              const placa = e.target.value;
              const found = maquinariaOptions.find(m => m.placa === placa);
              setForm(prev => ({
                ...prev,
                placa,
                descripcion: found?.detalle || prev.descripcion,
                unidad: found?.unidad || prev.unidad || initialData?.unidad
              }));
            }}
            size="small"
            fullWidth
            required
            SelectProps={{ displayEmpty: true }}
          >
            {maquinariaOptions.map(m => (
              <MenuItem key={m.placa} value={m.placa}>
                {m.placa} — {m.detalle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Descripción (de la unidad activa) */}
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Descripción"
            name="descripcion"
            value={form.descripcion ?? ''}
            onChange={(e) => {
              const detalle = e.target.value;
              const found = maquinariaOptions.find(m => m.detalle === detalle);
              setForm(prev => ({
                ...prev,
                descripcion: detalle,
                placa: found?.placa || prev.placa,
                unidad: found?.unidad || prev.unidad || initialData?.unidad
              }));
            }}
            size="small"
            fullWidth
            required
            SelectProps={{ displayEmpty: true }}
          >
            {detallesUnicos.map(det => (
              <MenuItem key={det} value={det}>{det}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Evento */}
        <Grid item xs={12}>
          <TextField
            label="Evento *"
            name="detalle"
            value={form.detalle ?? ''}
            onChange={handleChange}
            size="small"
            fullWidth
            multiline
            minRows={2}
            required
            disabled={isReadOnly}
          />
        </Grid>

        {/* Ubicación / Destino */}
        <Grid item xs={12}>
          <TextField
            label="Ubicación / Destino"
            name="ubicacion"
            value={form.ubicacion ?? ''}
            onChange={handleChange}
            size="small"
            fullWidth
            multiline
            minRows={2}
            disabled={isReadOnly}
          />
        </Grid>

        {/* Observaciones */}
        <Grid item xs={12}>
          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones ?? ''}
            onChange={handleChange}
            size="small"
            fullWidth
            multiline
            minRows={2}
            disabled={isReadOnly}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button type="submit" variant="contained" disabled={submitLoading || isReadOnly}>
          {submitLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
        </Button>
        <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
      </Box>
    </Box>
  );
};

NovedadesForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  submitLoading: PropTypes.bool,
  maquinariaOptions: PropTypes.array, // ya filtradas por unidad activa
};

export default NovedadesForm;
