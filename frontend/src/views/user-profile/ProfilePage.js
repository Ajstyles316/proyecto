import { useState, useEffect } from 'react';
import { TextField, Button, Box, Alert, Stack, Grid, Avatar, IconButton, MenuItem, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useUser } from '../../components/UserContext';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import DefaultAvatar from 'src/assets/images/profile/image.png';
import { HelpOutline } from '@mui/icons-material';

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

const ProfilePage = () => {
  const { user, setUser } = useUser();
  const [form, setForm] = useState({
    Nombre: user?.Nombre || '',
    Unidad: user?.Unidad || '',
    CI: user?.CI || '',
    Email: user?.Email || '',
    Password: '',
    confirmPassword: '',
    imagen: user?.imagen || '',
  });
  const [preview, setPreview] = useState(user?.imagen || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [opciones, setOpciones] = useState({ unidades: [] });
  const [loadingOpciones, setLoadingOpciones] = useState(true);

  useEffect(() => {
    // Obtener opciones de unidades
    const fetchOpciones = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/usuarios/opciones/");
        if (!res.ok) throw new Error("No se pudieron cargar las opciones");
        const data = await res.json();
        setOpciones({
          unidades: data.unidades || [],
        });
      } catch (e) {
        setOpciones({ unidades: [] });
      } finally {
        setLoadingOpciones(false);
      }
    };
    fetchOpciones();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, imagen: reader.result }));
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setForm(f => ({ ...f, imagen: '' }));
    setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!EMAIL_REGEX.test(form.Email)) {
      setError('Correo inválido. Solo se permiten @gmail.com, @enc.cof.gob.bo o @tec.cof.gob.bo');
      setLoading(false);
      return;
    }
    if (form.Password) {
      if (!PASSWORD_REGEX.test(form.Password)) {
        setError('La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.');
        setLoading(false);
        return;
      }
      if (form.Password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        Nombre: form.Nombre,
        Unidad: form.Unidad,
        CI: form.CI,
        Email: form.Email,
        imagen: form.imagen,
      };
      if (form.Password) payload.Password = form.Password;

      const res = await fetch('http://localhost:8000/api/usuarios/me/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.Email,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      setUser(data);
      setSuccess('Datos actualizados correctamente');
      setForm(f => ({ ...f, Password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const helperTexts = {
    Nombre: "Ejemplo: Juan Pérez",
    Unidad: "Selecciona tu unidad",
    CI: "Ingrese su carnet de identidad, número y ciudad expedido",
    Email: "Ejemplo: usuario@gmail.com, usuario@enc.cof.gob.bo, usuario@tec.cof.gob.bo",
    Password: "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial. Ej: Ejemplo1!",
    confirmPassword: "Repite la contraseña",
  };

  const errorHelper = (msg) => msg ? <span style={{ color: 'black' }}>{msg}</span> : '';

  return (
    <PageContainer title="Perfil de Usuario" description="Gestiona tus datos personales y de cuenta">
      <DashboardCard title="Perfil y Cuenta de Usuario">
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar
              src={preview || DefaultAvatar}
              alt="Foto de perfil"
              sx={{ width: 96, height: 96, mb: 1 }}
            />
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={1}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-photo-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="profile-photo-upload">
                <IconButton color="primary" aria-label="subir foto" component="span">
                  <PhotoCamera />
                </IconButton>
              </label>
              {preview && (
                <IconButton onClick={handleRemovePhoto} color="error" size="small" aria-label="Eliminar foto">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Nombre completo"
                    name="Nombre"
                    value={form.Nombre}
                    onChange={handleChange}
                    fullWidth
                    required
                    helperText={errorHelper(error && error.toLowerCase().includes('nombre') ? error : '')}
                  />
                  <CustomTooltip title={helperTexts.Nombre} placement="right">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </Box>

                <Box display="flex" alignItems="center">
                  <TextField
                    label="Carnet de Identidad"
                    name="CI"
                    value={form.CI}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                  <CustomTooltip title={helperTexts.CI} placement="right">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </Box>

                <Box display="flex" alignItems="center">
                  <TextField
                    select
                    label="Unidad"
                    name="Unidad"
                    value={form.Unidad}
                    onChange={handleChange}
                    fullWidth
                    required
                    helperText={errorHelper(error && error.toLowerCase().includes('unidad') ? error : '')}
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
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Correo electrónico"
                    name="Email"
                    value={form.Email}
                    onChange={handleChange}
                    fullWidth
                    required
                    type="email"
                    helperText={errorHelper(error && error.toLowerCase().includes('correo') ? error : '')}
                  />
                  <CustomTooltip title={helperTexts.Email} placement="right">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Nueva contraseña"
                    name="Password"
                    value={form.Password}
                    onChange={handleChange}
                    fullWidth
                    type="password"
                  />
                  <CustomTooltip title={helperTexts.Password} placement="right">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Confirmar nueva contraseña"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    fullWidth
                    type="password"
                  />
                  <CustomTooltip title={helperTexts.confirmPassword} placement="right">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          <Box mt={3} display="flex" justifyContent="center">
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ px: 5 }}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Box>
          <Box mt={2}>
            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error" sx={{ color: 'black', background: 'none' }}>{error}</Alert>}
          </Box>
        </Box>
      </DashboardCard>
    </PageContainer>
  );
};

export default ProfilePage;
