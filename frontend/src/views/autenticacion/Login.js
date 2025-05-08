import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";

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

      if (!response.ok) throw new Error("Credenciales inválidas");

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "/dashboard/";
    } catch (error) {
      alert("No se pudo iniciar sesión");
      console.error("Error al iniciar sesión:", error.message);
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
          Iniciar Sesión
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
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
          <Typography>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" style={{ textDecoration: "none", color: "primary.main" }}>
              Regístrate
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;