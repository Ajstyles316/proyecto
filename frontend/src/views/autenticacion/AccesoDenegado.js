import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import bloqueoImg from 'src/assets/images/backgrounds/login-bg.svg'; // Usa tu imagen de bloqueo preferida

const AccesoDenegado = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
      sx={{
        background: '#fff',
        borderRadius: 2,
        boxShadow: 3,
        p: 4,
        maxWidth: 500,
        margin: '40px auto'
      }}
    >
      <img
        src={bloqueoImg}
        alt="Acceso Denegado"
        style={{ maxWidth: 220, marginBottom: 24 }}
      />
      <Typography variant="h4" mb={1} color="text.primary">
        ¡Acceso Denegado!
      </Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        No tienes permisos para acceder a esta página.<br />
        Si crees que es un error, contacta al administrador.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
        Volver al login
      </Button>
    </Box>
  );
};

export default AccesoDenegado; 