import {
  Modal, Paper, Typography, Grid, TextField, Box, Button, MenuItem
} from '@mui/material';
import PropTypes from 'prop-types';
import { fieldLabels } from '../utils/fieldLabels';
import { useUser } from '../../../../../components/UserContext';

const NuevoModalMaquinaria = ({
  open,
  onClose,
  newMaquinariaForm,
  setNewMaquinariaForm,
  newMaquinariaErrors,
  setNewMaquinariaErrors,
  handleNewMaquinariaSubmit,
  handleFileChange,
  unidadesUnicas
}) => {
  const { user } = useUser();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        p: 3,
        width: { xs: '90%', sm: '95%' },
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear Nueva Maquinaria</Typography>

        <Grid container spacing={2}>
          {fieldLabels.Maquinaria.filter(field => 
            !['registrado_por', 'validado_por', 'autorizado_por'].includes(field.name)
          ).map((field) => (
            <Grid item xs={12} sm={6} key={field.name}>
              {field.name === 'imagen' ? (
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {field.label}
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ marginTop: '8px' }}
                  />
                  {newMaquinariaForm.imagen && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      Imagen seleccionada
                    </Typography>
                  )}
                </Box>
              ) : field.name === 'unidad' ? (
                <TextField
                  select
                  fullWidth
                  label={field.label}
                  name={field.name}
                  value={newMaquinariaForm[field.name] || ''}
                  onChange={e => setNewMaquinariaForm({
                    ...newMaquinariaForm,
                    [field.name]: e.target.value
                  })}
                  size="small"
                  error={!!newMaquinariaErrors[field.name]}
                  helperText={newMaquinariaErrors[field.name] || ''}
                >
                  <MenuItem value="">Seleccione una unidad</MenuItem>
                  {unidadesUnicas.map((unidad) => (
                    <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={newMaquinariaForm[field.name] || ''}
                  onChange={e => setNewMaquinariaForm({
                    ...newMaquinariaForm,
                    [field.name]: e.target.value
                  })}
                  size="small"
                  error={!!newMaquinariaErrors[field.name]}
                  helperText={newMaquinariaErrors[field.name] || ''}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                />
              )}
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleNewMaquinariaSubmit}>
            Guardar Nueva Maquinaria
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

NuevoModalMaquinaria.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  newMaquinariaForm: PropTypes.object.isRequired,
  setNewMaquinariaForm: PropTypes.func.isRequired,
  newMaquinariaErrors: PropTypes.object.isRequired,
  setNewMaquinariaErrors: PropTypes.func.isRequired,
  handleNewMaquinariaSubmit: PropTypes.func.isRequired,
  handleFileChange: PropTypes.func.isRequired,
  unidadesUnicas: PropTypes.array.isRequired,
};

export default NuevoModalMaquinaria;
