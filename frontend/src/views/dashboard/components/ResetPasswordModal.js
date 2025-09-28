import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, IconButton,
  Snackbar, Alert, CircularProgress, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';
import PropTypes from 'prop-types';

// Helper: resuelve base URL automáticamente
const apiFetch = (path, options = {}) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  // 1) Si pones VITE_API_URL, se usa (ej: http://localhost:8000/api ó https://api.midominio.com/api)
  const envBase = import.meta.env?.VITE_API_URL?.trim();
  // 2) Si estamos en Vite dev (5173), fallback al backend local 8000
  const isViteDev = typeof window !== 'undefined' && window.location.port === '5173' && window.location.hostname === 'localhost';
  const base = envBase || (isViteDev ? 'http://localhost:8000' : '');
  const url = `${base}${p}`;
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
};

const ResetPasswordModal = ({ open, onClose }) => {
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva pass
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnack = (message, severity = 'info') =>
    setSnackbar({ open: true, message, severity });

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCodigo('');
    setNuevaPassword('');
    setConfirmPassword('');
    setLoading(false);
    setResendCooldown(0);
    onClose();
  };

  // Paso 1: solicitar código
  const solicitarCodigo = async () => {
    if (!email) return showSnack('Ingresa tu email', 'error');
    setLoading(true);
    try {
      const r = await apiFetch('/usuarios/reset/solicitar/', {
        method: 'POST',
        body: JSON.stringify({ Email: email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'No se pudo enviar el código');
      showSnack('Código enviado a tu correo', 'success');
      setStep(2);
      setResendCooldown(30);
      const t = setInterval(() => {
        setResendCooldown(s => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      showSnack(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const reenviarCodigo = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const r = await apiFetch('/usuarios/reset/reenviar/', {
        method: 'POST',
        body: JSON.stringify({ Email: email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'No se pudo reenviar el código');
      showSnack('Código reenviado', 'success');
      setResendCooldown(30);
      const t = setInterval(() => {
        setResendCooldown(s => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      showSnack(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: validar formato y continuar
  const continuarConNuevaPassword = () => {
    if (codigo.length !== 6) return showSnack('Ingresa el código de 6 dígitos', 'error');
    setStep(3);
  };

  // Paso 3: enviar nueva contraseña (verifica el código en backend)
  const enviarNuevaPassword = async () => {
    if (!nuevaPassword || !confirmPassword) return showSnack('Completa todos los campos', 'error');
    if (nuevaPassword !== confirmPassword) return showSnack('Las contraseñas no coinciden', 'error');
    if (nuevaPassword.length < 6) return showSnack('Mínimo 6 caracteres', 'error');

    setLoading(true);
    try {
      const r = await apiFetch('/usuarios/reset/verificar/', {
        method: 'POST',
        body: JSON.stringify({ Email: email, codigo, nueva_password: nuevaPassword }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al actualizar contraseña');
      showSnack('Contraseña actualizada exitosamente', 'success');
      handleClose();
    } catch (e) {
      showSnack(e.message, 'error');
      if (e.message.toLowerCase().includes('código')) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" fontWeight={600} color="primary.main">Restablecer Contraseña</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {step === 1 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingresa tu email para enviarte un código de 6 dígitos.
              </Typography>
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </>
          )}

          {step === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Hemos enviado un código de 6 dígitos a tu correo. Escríbelo para continuar.
              </Typography>
              <TextField
                fullWidth
                label="Código de verificación"
                placeholder="••••••"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              />
              <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                <Button variant="text" onClick={reenviarCodigo} disabled={loading || resendCooldown > 0}>
                  {resendCooldown > 0 ? `Reenviar Código (${resendCooldown}s)` : 'Reenviar Código'}
                </Button>
              </Stack>
            </Box>
          )}

          {step === 3 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crea tu nueva contraseña.
              </Typography>
              <TextField fullWidth label="Nueva contraseña" type="password" margin="normal"
                value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} helperText="Mínimo 6 caracteres" />
              <TextField fullWidth label="Confirmar contraseña" type="password" margin="normal"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          {step === 1 && (
            <Button onClick={solicitarCodigo} variant="contained" disabled={loading || !email}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={continuarConNuevaPassword} variant="contained" disabled={loading || codigo.length !== 6}>
              Continuar
            </Button>
          )}
          {step === 3 && (
            <Button onClick={enviarNuevaPassword} variant="contained" disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ResetPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ResetPasswordModal;
