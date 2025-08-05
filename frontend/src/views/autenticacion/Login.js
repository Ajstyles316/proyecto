import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";
import ResetPasswordModal from "../dashboard/components/ResetPasswordModal";

const Login = () => {
  const [formData, setFormData] = useState({
    Email: "",
    Password: "",
  });

  const [errors, setErrors] = useState({
    Email: "",
    Password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [denied, setDenied] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.between('sm', 'md'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Email.trim()) newErrors.Email = "El correo es obligatorio";
    if (!formData.Password.trim()) newErrors.Password = "La contraseña es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoginLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: formData.Email,
          Password: formData.Password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error && data.error.toLowerCase().includes("denegado")) {
          setDenied(data.error);
          return;
        }
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "/dashboard/";
    } catch (error) {
      alert("No se pudo iniciar sesión");
      console.error("Error al iniciar sesión:", error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem("user");
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        p: { xs: 1, sm: 2 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: { xs: "95%", sm: "400px", md: "450px" },
          p: { xs: 2, sm: 3, md: 4 },
          bgcolor: "background.paper",
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: { xs: 2, sm: 3, md: 4 },
          maxWidth: "100%",
        }}
      >
        {/* Contenedor del título e imagen */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={{ xs: 2, sm: 3 }}>
          <Typography variant={isMobile ? "h6" : "h5"} textAlign="center" sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            fontWeight: 600,
          }}>
            Bienvenido
          </Typography>
          
          {/* Imagen */}
          <Box mt={1} sx={{ 
            width: { xs: "70%", sm: "80%", md: "80%" }, 
            maxWidth: { xs: "200px", sm: "250px", md: "250px" },
            mb: { xs: 1, sm: 2 },
          }}>
            <img 
              src="../../../src/assets/images/logos/logo_login.png"
              alt="Logo Login"
              style={{ width: "100%", height: "auto", display: "block" }}
              onError={(e) => {
                console.error("Error al cargar la imagen:", e.target.src);
                e.target.style.display = "none";
              }}
            />
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {denied && (
              <Typography color="error" textAlign="center" sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}>{denied}</Typography>
            )}
            <TextField
              label="Correo electrónico"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              fullWidth
              error={!!errors.Email}
              helperText={errors.Email}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />

            <TextField
              label="Contraseña"
              name="Password"
              type={showPassword ? "text" : "password"}
              value={formData.Password}
              onChange={handleChange}
              fullWidth
              error={!!errors.Password}
              helperText={errors.Password}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setShowPassword(!showPassword)}
                      size={isMobile ? "small" : "medium"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />

            <Button 
              variant="contained" 
              color="primary" 
              type="submit" 
              fullWidth 
              sx={{ 
                mt: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
              disabled={loginLoading}
              startIcon={loginLoading ? <CircularProgress size={isMobile ? 16 : 20} color="inherit" /> : null}
            >
              {loginLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Stack>
        </form>

        <Box mt={{ xs: 1.5, sm: 2 }} textAlign="center">
          <Typography variant="body2" sx={{ 
            mb: { xs: 0.5, sm: 1 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" style={{ textDecoration: "none", color: "primary.main" }}>
              Regístrate
            </Link>
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}>
            ¿Olvidaste tu contraseña?{" "}
            <Button 
              variant="text" 
              size="small" 
              onClick={() => setShowResetModal(true)}
              sx={{ 
                p: 0, 
                minWidth: 'auto', 
                textTransform: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              Restablecer contraseña
            </Button>
          </Typography>
        </Box>
      </Box>

      <ResetPasswordModal 
        open={showResetModal} 
        onClose={() => setShowResetModal(false)} 
      />
    </Box>
  );
};

export default Login;