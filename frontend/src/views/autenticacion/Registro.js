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
import ReCAPTCHA from "react-google-recaptcha";

import logo from "../../../src/assets/images/logos/logo_login.png";

const SITE_KEY = "6LeCz1orAAAAAGxMyOuZp9h4JXox2JwBCM4fgunu"; 

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
    captcha: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
    setErrors((prev) => ({ ...prev, captcha: "" }));
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
    if (!captchaToken) newErrors.captcha = "Por favor, completa el CAPTCHA";

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
        captchaToken,
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
      setCaptchaToken(null);
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

        <form onSubmit={handleSubmit}>
          <Stack spacing={2} mb={2}> 
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

            <ReCAPTCHA
              sitekey={SITE_KEY}
              onChange={onCaptchaChange}
              hl="es"
              theme="light"
              size="normal"
              position="center" 
            />
            {errors.captcha && (
              <Typography color="error" variant="body2" mt={1}>
                {errors.captcha}
              </Typography>
            )}
          </Stack>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ py: 1.5 }} 
          >
            Registrarse
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