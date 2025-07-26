import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RegistrosDesactivadosTable from './RegistrosDesactivadosTable';
import { useUser } from '../../../../components/UserContext';

const RegistrosDesactivadosModal = ({ open, onClose, maquinariaId, isEncargado }) => {
  const [registrosDesactivados, setRegistrosDesactivados] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const { user } = useUser();

  const fetchRegistrosDesactivados = React.useCallback(async () => {
    if (!isEncargado || !user?.Email) {
      setSnackbar({ 
        open: true, 
        message: 'Solo los encargados pueden ver registros desactivados', 
        severity: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      const url = maquinariaId === "all" 
        ? `http://localhost:8000/api/registros-desactivados/`
        : `http://localhost:8000/api/maquinaria/${maquinariaId}/desactivados/`;
      
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver registros desactivados');
        }
        if (response.status === 404) {
          throw new Error('Endpoint no encontrado. Verifica que el servidor esté corriendo.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Verificar si hay datos
      const totalRegistros = Object.values(data).reduce((total, registros) => total + registros.length, 0);
      
      if (totalRegistros === 0) {
        setSnackbar({ 
          open: true, 
          message: 'No se encontraron registros desactivados recientes', 
          severity: 'info' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: `Se encontraron ${totalRegistros} registros desactivados`, 
          severity: 'success' 
        });
      }
      
      setRegistrosDesactivados(data);
    } catch (error) {
      console.error('Error fetching:', error);
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [maquinariaId, isEncargado, user?.Email]);

  const handleReactivar = async (tipo, recordId, maquinariaId) => {
    try {
      let url;
      
      // Mapeo de tipos a endpoints
      const tipoToEndpoint = {
        'Usuario': 'usuarios',
        'Control': 'control',
        'Asignación': 'asignacion',
        'Mantenimiento': 'mantenimiento',
        'Seguro': 'seguros',
        'ITV': 'itv',
        'SOAT': 'soat',
        'Impuesto': 'impuestos',
        'Maquinaria': 'maquinaria',
        'Depreciación': 'depreciaciones'
      };
      
      const endpoint = tipoToEndpoint[tipo];
      if (!endpoint) {
        throw new Error(`Tipo de registro no soportado: ${tipo}`);
      }
      
      // Para usuarios, usar endpoint diferente
      if (tipo === 'Usuario') {
        url = `http://localhost:8000/api/usuarios/${recordId}/`;
      } else {
        // Para otros tipos, usar endpoint con maquinaria_id
        if (!maquinariaId) {
          console.log('No se proporcionó maquinariaId, intentando obtener del registro...');
          throw new Error(`No se puede reactivar este registro de ${tipo} porque no se encontró la información de la maquinaria asociada. Contacte al administrador.`);
        }
        url = `http://localhost:8000/api/maquinaria/${maquinariaId}/${endpoint}/${recordId}/`;
      }
      
      console.log('Reactivating URL:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.Email
        }
      });

      console.log('Reactivation response status:', response.status);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos para reactivar registros');
        }
        throw new Error(`Error al reactivar el registro: ${response.statusText}`);
      }

      setSnackbar({ 
        open: true, 
        message: 'Registro reactivado exitosamente', 
        severity: 'success' 
      });

      // Recargar los datos
      fetchRegistrosDesactivados();
    } catch (error) {
      console.error('Error reactivating:', error);
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  useEffect(() => {
    if (open && isEncargado) {
      fetchRegistrosDesactivados();
    }
  }, [open, fetchRegistrosDesactivados, isEncargado]);

  const handleClose = () => {
    onClose();
    setRegistrosDesactivados({});
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} color="primary.main">
              Registros Desactivados
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <RegistrosDesactivadosTable 
              registrosDesactivados={registrosDesactivados}
              onReactivar={handleReactivar}
              isEncargado={isEncargado}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// PropTypes para el componente
RegistrosDesactivadosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  maquinariaId: PropTypes.string.isRequired,
  isEncargado: PropTypes.bool.isRequired
};

export default RegistrosDesactivadosModal; 