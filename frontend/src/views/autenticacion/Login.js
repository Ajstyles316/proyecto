import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
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

    try {
      const response = await fetch("http://localhost:8000/login/", {
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
        height: "100vh",
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
        }}
      >
        {/* Contenedor del título e imagen */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Typography variant="h5" textAlign="center">
            Bienvenido
          </Typography>
          
          {/* Imagen */}
          <Box mt={1} sx={{ width: "80%", maxWidth: "250px" }}>
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
          <Stack spacing={2}>
            {denied && (
              <Typography color="error" textAlign="center">{denied}</Typography>
            )}
            <TextField
              label="Correo electrónico"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              fullWidth
              error={!!errors.Email}
              helperText={errors.Email}
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

            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
              Iniciar Sesión
            </Button>
          </Stack>
        </form>

        <Box mt={2} textAlign="center">
          <Typography variant="body2" sx={{ mb: 1 }}>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" style={{ textDecoration: "none", color: "primary.main" }}>
              Regístrate
            </Link>
          </Typography>
          <Typography variant="body2">
            ¿Olvidaste tu contraseña?{" "}
            <Button 
              variant="text" 
              size="small" 
              onClick={() => setShowResetModal(true)}
              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
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