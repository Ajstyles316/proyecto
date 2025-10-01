import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreateUserForm from './CreateUserForm';

const CreateUserModal = ({ 
  open, 
  onClose, 
  form, 
  errors, 
  loading, 
  optionsLoading, 
  options, 
  showGeneratedPassword,
  onFormChange, 
  onGeneratePassword, 
  onTogglePasswordVisibility, 
  onSubmit 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700} component="span">Crear Nuevo Usuario</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {optionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress color="primary" />
            <Typography variant="body1" sx={{ ml: 2 }}>Cargando opciones...</Typography>
          </Box>
        ) : (
          <CreateUserForm
            form={form}
            errors={errors}
            options={options}
            showGeneratedPassword={showGeneratedPassword}
            onFormChange={onFormChange}
            onGeneratePassword={onGeneratePassword}
            onTogglePasswordVisibility={onTogglePasswordVisibility}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          color="success"
          disabled={loading || optionsLoading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CreateUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  optionsLoading: PropTypes.bool.isRequired,
  options: PropTypes.object.isRequired,
  showGeneratedPassword: PropTypes.bool.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onGeneratePassword: PropTypes.func.isRequired,
  onTogglePasswordVisibility: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CreateUserModal;
