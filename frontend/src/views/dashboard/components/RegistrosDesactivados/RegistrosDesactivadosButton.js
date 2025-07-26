import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Box } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import RegistrosDesactivadosModal from './RegistrosDesactivadosModal';

const RegistrosDesactivadosButton = ({ maquinariaId, isEncargado }) => {
  const [showRegistrosDesactivados, setShowRegistrosDesactivados] = useState(false);

  if (!isEncargado) {
    return null; // No mostrar nada para usuarios no encargados
  }

  return (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setShowRegistrosDesactivados(!showRegistrosDesactivados)}
        startIcon={<RestoreIcon />}
        sx={{ 
          minWidth: 200,
          borderColor: '#1976d2',
          color: '#1976d2',
          '&:hover': {
            borderColor: '#1565c0',
            backgroundColor: 'rgba(25, 118, 210, 0.04)'
          }
        }}
      >
        Ver Registros Desactivados
      </Button>

      <RegistrosDesactivadosModal 
        open={showRegistrosDesactivados}
        onClose={() => setShowRegistrosDesactivados(false)}
        maquinariaId={maquinariaId}
        isEncargado={isEncargado}
      />
    </Box>
  );
};

// PropTypes para el componente
RegistrosDesactivadosButton.propTypes = {
  maquinariaId: PropTypes.string,
  isEncargado: PropTypes.bool.isRequired
};

export default RegistrosDesactivadosButton; 