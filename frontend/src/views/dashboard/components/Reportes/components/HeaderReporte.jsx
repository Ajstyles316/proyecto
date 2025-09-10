import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';

const HeaderReporte = ({ maquinaria }) => {
  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1e4db7' }}>
        HISTORIAL DE MAQUINARIA
      </Typography>
      <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
        CODIGO: {maquinaria?.codigo || 'N/A'}
      </Typography>
    </Box>
  );
};

HeaderReporte.propTypes = {
  maquinaria: PropTypes.object,
};

export default HeaderReporte;
