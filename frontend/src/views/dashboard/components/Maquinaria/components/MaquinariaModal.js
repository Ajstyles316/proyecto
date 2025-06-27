import { Modal, Paper, Typography, Grid, TextField, Box, Button } from '@mui/material';
import { fieldLabels } from '../utils/fieldLabels';
import PropTypes from 'prop-types';
const MaquinariaModal = ({
  modalOpen,
  setModalOpen,
  activeSection,
  modalForm,
  setModalForm,
  modalErrors,
  setModalErrors,
  setSnackbar
}) => {
  const handleGuardar = () => {
    const errors = {};
    (fieldLabels[activeSection] || []).forEach(field => {
      if (!modalForm[field.name] || !modalForm[field.name].toString().trim()) {
        errors[field.name] = 'Este campo es obligatorio';
      }
    });
    setModalErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSnackbar({ open: true, message: 'Nuevo registro creado (simulado)', severity: 'success' });
    setModalForm({});
    setModalErrors({});
    setModalOpen(false);
  };

  return (
    <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
      <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 3, minWidth: 320, width: { xs: '90%', sm: 500 }, maxHeight: '90vh', overflow: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear nuevo registro en {activeSection}</Typography>
        <Grid container spacing={2}>
          {(fieldLabels[activeSection] || []).map((field) => (
            <Grid item xs={12} key={field.name}>
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={modalForm[field.name] || ''}
                onChange={e => setModalForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                size="small"
                error={!!modalErrors[field.name]}
                helperText={modalErrors[field.name] || ''}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar}>Guardar</Button>
        </Box>
      </Paper>
    </Modal>
  );
};
MaquinariaModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  setModalOpen: PropTypes.func.isRequired,
  activeSection: PropTypes.object.isRequired,
  setModalForm: PropTypes.func.isRequired,
  modalForm: PropTypes.object.isRequired,
  modalErrors: PropTypes.func.isRequired,
  setModalErrors: PropTypes.func.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

export default MaquinariaModal;
