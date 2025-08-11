import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';

const ResetPasswordModal = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Enviar código de 6 dígitos al correo
  const handleSendCodigo = async () => {
    if (!email) {
      setSnackbar({
        open: true,
        message: 'El correo es requerido',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/usuarios/send_codigo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Código enviado al correo electrónico',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Error al enviar el código',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error de conexión. Verifica que el servidor esté corriendo.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar código y restablecer la contraseña
  const handleResetPassword = async () => {
    if (!codigo || !nuevaPassword || !confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Todos los campos son requeridos',
        severity: 'error',
      });
      return;
    }

    if (nuevaPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Las contraseñas no coinciden',
        severity: 'error',
      });
      return;
    }

    if (nuevaPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'La contraseña debe tener al menos 6 caracteres',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/usuarios/reset_password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          nueva_password: nuevaPassword,
          codigo: codigo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Contraseña actualizada exitosamente',
          severity: 'success',
        });
        setEmail('');
        setCodigo('');
        setNuevaPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Error al actualizar contraseña',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error de conexión. Verifica que el servidor esté corriendo.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCodigo('');
    setNuevaPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" fontWeight={600} color="primary.main">
              Restablecer Contraseña
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tu correo y el código enviado, luego ingresa la nueva contraseña.
          </Typography>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
          />

          <TextField
            fullWidth
            label="Código de 6 dígitos"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Nueva Contraseña"
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            margin="normal"
            required
            helperText="Mínimo 6 caracteres"
          />

          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ResetPasswordModal;
