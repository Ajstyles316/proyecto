import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  InputAdornment,
  IconButton,
  MenuItem,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Visibility, VisibilityOff, HelpOutline } from "@mui/icons-material";
import { Link } from "react-router-dom";
// Imagen movida a public para producción
const logo = "/images/logos/logo_login.png";

const EMAIL_REGEX = /^[\w.-]+@(gmail\.com|enc\.cof\.gob\.bo|tec\.cof\.gob\.bo)$/i;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// Custom styled tooltip with dark background
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '0.875rem',
    padding: '8px 12px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  '& .MuiTooltip-popper': {
    zIndex: 9999,
  },
})); 

const Register = () => {
  const [formData, setFormData] = useState({
    Nombre: "",
    Cargo: "",
    Unidad: "",
    Email: "",
    Password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    Nombre: "",
    Cargo: "",
    Unidad: "",
    Email: "",
    Password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [opciones, setOpciones] = useState({ cargos: [], unidades: [] });
  const [loadingOpciones, setLoadingOpciones] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'codigo'
  const [codigo, setCodigo] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    // Obtener opciones de cargos y unidades
    const fetchOpciones = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/opciones/`);
        if (!res.ok) throw new Error("No se pudieron cargar las opciones");
        const data = await res.json();
        setOpciones({
          cargos: data.cargos || [],
          unidades: data.unidades || [],
        });
      } catch (e) {
        setOpciones({ cargos: [], unidades: [] });
      } finally {
        setLoadingOpciones(false);
      }
    };
    fetchOpciones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };


  const validateForm = () => {
    const newErrors = {};
    if (!formData.Nombre.trim()) newErrors.Nombre = "El nombre es obligatorio";
    if (!formData.Cargo.trim()) newErrors.Cargo = "El cargo es obligatorio";
    if (!formData.Unidad.trim()) newErrors.Unidad = "La unidad es obligatoria";
    if (!formData.Email.trim()) newErrors.Email = "El correo es obligatorio";
    else if (!EMAIL_REGEX.test(formData.Email))
      newErrors.Email =
        "Solo se permiten correos @gmail.com, @enc.cof.gob.bo o @tec.cof.gob.bo. Ej: usuario@gmail.com";
    if (!formData.Password.trim()) newErrors.Password = "La contraseña es obligatoria";
    else if (!PASSWORD_REGEX.test(formData.Password))
      newErrors.Password =
        "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial. Ej: Ejemplo1!";
    if (formData.Password !== formData.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 'form') return;
    if (!validateForm()) return;
    setRegisterLoading(true);
    try {
      const payload = {
        Nombre: formData.Nombre,
        Cargo: formData.Cargo,
        Unidad: formData.Unidad,
        Email: formData.Email,
        Password: formData.Password,
        confirmPassword: formData.confirmPassword,
      };
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/registro/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("Error en el registro");
      if (data?.message === 'Usuario ya existente') {
        alert('Este correo ya está registrado. Por favor, inicia sesión.');
        window.location.href = '/login/';
        return;
      }
      // Paso 2: mostrar formulario para código
      console.log('Cambiando a paso de código. Email:', formData.Email);
      setStep('codigo');
    } catch (error) {
      alert("Ocurrió un error al iniciar el registro");
      console.error("Error al registrarse:", error.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerificationError('');
    if (!codigo || codigo.length !== 6) {
      setVerificationError('Ingresa el código de 6 dígitos enviado a tu correo');
      return;
    }
    if (!formData.Email) {
      setVerificationError('Email no encontrado. Por favor, vuelve al formulario anterior.');
      return;
    }
    setVerifyLoading(true);
    try {
      console.log('Verificando código para:', formData.Email, 'Código:', codigo);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/registro/verificar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: formData.Email, codigo }),
      });
      const data = await response.json().catch(() => ({}));
      console.log('Respuesta del servidor:', response.status, data);
      if (!response.ok) {
        setVerificationError(data?.error || 'Código inválido');
        return;
      }
      alert('Registro verificado correctamente');
      // limpiar y redirigir a login
      setFormData({ Nombre: '', Cargo: '', Unidad: '', Email: '', Password: '', confirmPassword: '' });
      setCodigo('');
      setStep('form');
      window.location.href = '/login/';
    } catch (err) {
      console.error('Error en verificación:', err);
      setVerificationError('Error al verificar el código');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/registro/reenviar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: formData.Email }),
      });
    } catch (e) {
      // silencio
    } finally {
      setResendLoading(false);
    }
  }

  // Helper texts
  const helperTexts = {
    Nombre: "Ejemplo: Juan Pérez",
    Cargo: "Selecciona tu cargo",
    Unidad: "Selecciona tu unidad",
    Email: "Ejemplo: usuario@gmail.com, usuario@enc.cof.gob.bo, usuario@tec.cof.gob.bo",
    Password: "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial. Ej: Ejemplo1!",
    confirmPassword: "Repite la contraseña",
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: { xs: "90%", sm: "400px" },
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" mb={2}>
          Registro
        </Typography>

        
        <Box mb={2}>
          <img
            src={logo}
            alt="Logo Registro"
            style={{ width: "100%", maxHeight: "100px", objectFit: "contain" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </Box>

        <form onSubmit={step === 'form' ? handleSubmit : handleVerify}>
          <Stack spacing={2} mb={2}> 
            {/* Nombre */}
            {step === 'form' && (
            <Box display="flex" alignItems="center">
              <TextField
                label="Nombre completo"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                fullWidth
                error={!!errors.Nombre}
                helperText={errors.Nombre}
              />
              <CustomTooltip title={helperTexts.Nombre} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>
            )}

            {/* Cargo */}
            {step === 'form' && (
            <Box display="flex" alignItems="center">
              <TextField
                select
                label="Cargo"
                name="Cargo"
                value={formData.Cargo}
                onChange={handleChange}
                fullWidth
                error={!!errors.Cargo}
                disabled={loadingOpciones}
                helperText={
                  errors.Cargo ||
                  (loadingOpciones
                    ? "Cargando opciones..."
                    : opciones.cargos.length
                    ? null
                    : "No hay cargos disponibles")
                }
                InputProps={{
                  endAdornment: loadingOpciones ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : null,
                }}
              >
                {opciones.cargos.filter(cargo => cargo !== 'Admin' && cargo !== 'admin').map((cargo) => (
                  <MenuItem key={cargo} value={cargo === 'Tecnico' ? 'Técnico' : cargo}>
                    {cargo === 'Tecnico' ? 'Técnico' : cargo}
                  </MenuItem>
                ))}
              </TextField>
              <CustomTooltip title={helperTexts.Cargo} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>
            )}

            {/* Unidad */}
            {step === 'form' && (
            <Box display="flex" alignItems="center">
              <TextField
                select
                label="Unidad"
                name="Unidad"
                value={formData.Unidad}
                onChange={handleChange}
                fullWidth
                error={!!errors.Unidad}
                disabled={loadingOpciones}
                helperText={
                  errors.Unidad ||
                  (loadingOpciones
                    ? "Cargando opciones..."
                    : opciones.unidades.length
                    ? null
                    : "No hay unidades disponibles")
                }
                InputProps={{
                  endAdornment: loadingOpciones ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : null,
                }}
              >
                {opciones.unidades.map((unidad) => (
                  <MenuItem key={unidad} value={unidad}>
                    {unidad}
                  </MenuItem>
                ))}
              </TextField>
              <CustomTooltip title={helperTexts.Unidad} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>
            )}

            {/* Email */}
            <Box display="flex" alignItems="center">
              <TextField
                label="Correo electrónico"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                fullWidth
                error={!!errors.Email}
                helperText={errors.Email}
                disabled={step === 'codigo'}
                InputProps={{
                  style: step === 'codigo' ? { backgroundColor: '#f5f5f5' } : {}
                }}
              />
              <CustomTooltip title={helperTexts.Email} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>

            {/* Password */}
            {step === 'form' && (
            <Box display="flex" alignItems="center">
              <TextField
                label="Contraseña"
                name="Password"
                type={showPassword ? "text" : "password"}
                value={formData.Password}
                onChange={handleChange}
                fullWidth
                error={!!errors.Password}
                helperText={errors.Password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <CustomTooltip title={helperTexts.Password} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>
            )}

            {/* Confirm Password */}
            {step === 'form' && (
            <Box display="flex" alignItems="center">
              <TextField
                label="Confirmar contraseña"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <CustomTooltip title={helperTexts.confirmPassword} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </CustomTooltip>
            </Box>
            )}

            {step === 'form' && (
              <>
              </>
            )}

            {step === 'codigo' && (
              <>
                <Typography variant="body2">Hemos enviado un código de 6 dígitos a tu correo. Escríbelo para finalizar el registro.</Typography>
                <TextField
                  label="Código de verificación"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ maxLength: 6 }}
                  fullWidth
                  error={!!verificationError}
                  helperText={verificationError}
                />
                <Button onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                </Button>
              </>
            )}
          </Stack>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ py: 1.5 }}
            disabled={step === 'form' ? registerLoading : verifyLoading}
            startIcon={(step === 'form' ? registerLoading : verifyLoading) ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {step === 'form' ? (registerLoading ? 'Enviando código...' : 'Registrarse') : (verifyLoading ? 'Verificando...' : 'Verificar código')}
          </Button>
        </form>

        <Box mt={2}>
          <Typography variant="body2">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={{ textDecoration: "none", color: "primary.main" }}>
              Inicia sesión
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;