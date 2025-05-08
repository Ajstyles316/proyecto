import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";

// ✅ Importa la imagen desde la carpeta assets
import logo from "../../../src/assets/images/logos/logo_login.png";  // Asegúrate de que esta ruta sea correcta

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
    if (!formData.Password.trim()) newErrors.Password = "La contraseña es obligatoria";
    if (formData.Password !== formData.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        Nombre: formData.Nombre,
        Cargo: formData.Cargo,
        Unidad: formData.Unidad,
        Email: formData.Email,
        Password: formData.Password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await fetch("http://localhost:8000/registro/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error en el registro");

      alert("Registro exitoso");
      setFormData({
        Nombre: "",
        Cargo: "",
        Unidad: "",
        Email: "",
        Password: "",
        confirmPassword: "",
      });
      window.location.href = "/login/";
    } catch (error) {
      alert("Ocurrió un error al registrarse");
      console.error("Error al registrarse:", error.message);
    }
  };

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
        <Typography variant="h5" textAlign="center" mb={2}>
          Registro
        </Typography>

        {/* ✅ Imagen después del título */}
        <Box textAlign="center" mb={2}>
          <img
            src={logo}  // ← Si usas import
            alt="Logo Registro"
            style={{ width: "100%", maxWidth: "250px", height: "auto" }}
            onError={(e) => {
              console.error("Error al cargar imagen:", e.target.src);
              e.target.style.display = "none";  // ← Oculta si hay error
            }}
          />
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nombre completo"
              name="Nombre"
              value={formData.Nombre}
              onChange={handleChange}
              fullWidth
              error={!!errors.Nombre}
              helperText={errors.Nombre}
            />

            <TextField
              label="Cargo"
              name="Cargo"
              value={formData.Cargo}
              onChange={handleChange}
              fullWidth
              error={!!errors.Cargo}
              helperText={errors.Cargo}
            />

            <TextField
              label="Unidad"
              name="Unidad"
              value={formData.Unidad}
              onChange={handleChange}
              fullWidth
              error={!!errors.Unidad}
              helperText={errors.Unidad}
            />

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

            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
              Registrarse
            </Button>
          </Stack>
        </form>

        <Box mt={2} textAlign="center">
          <Typography>
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