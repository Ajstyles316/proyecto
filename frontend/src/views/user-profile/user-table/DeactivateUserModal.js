import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const DeactivateUserModal = ({ 
  open, 
  onClose, 
  justificacion, 
  onJustificacionChange, 
  onConfirm, 
  loading 
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Desactivar usuario</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Por favor, indique la razón de la desactivación:
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Justificación"
          type="text"
          fullWidth
          variant="outlined"
          value={justificacion}
          onChange={(e) => onJustificacionChange(e.target.value)}
          multiline
          rows={3}
          placeholder="Ej: El usuario ya no forma parte del equipo..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          variant="contained"
          disabled={!justificacion.trim() || loading}
        >
          Desactivar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeactivateUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  justificacion: PropTypes.string.isRequired,
  onJustificacionChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default DeactivateUserModal;
