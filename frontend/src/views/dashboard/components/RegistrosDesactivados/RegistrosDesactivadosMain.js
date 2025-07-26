import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Snackbar, Alert, Paper, Typography } from '@mui/material';
import RegistrosDesactivadosTable from './RegistrosDesactivadosTable';
import { useUser } from '../../../../components/UserContext';

const RegistrosDesactivadosMain = ({ maquinariaId }) => {
  const [registrosDesactivados, setRegistrosDesactivados] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useUser();

  // Verificar si el usuario es encargado
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';

  const fetchRegistrosDesactivados = useCallback(async () => {
    if (!isEncargado) {
      setSnackbar({ 
        open: true, 
        message: 'Solo los encargados pueden ver registros desactivados', 
        severity: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      // Si maquinariaId es "all", obtener registros de todas las maquinarias
      const url = maquinariaId === "all" 
        ? `http://localhost:8000/api/registros-desactivados/`
        : `http://localhost:8000/api/maquinaria/${maquinariaId}/desactivados/`;
      
      const response = await fetch(url, {
        headers: {
          'X-User-Email': user.Email
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver registros desactivados');
        }
        throw new Error('Error al obtener registros desactivados');
      }
      
      const data = await response.json();
      setRegistrosDesactivados(data);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [isEncargado, maquinariaId, user.Email]);

  const handleReactivar = async (tipo, recordId, maquinariaId) => {
    if (!isEncargado) {
      setSnackbar({ 
        open: true, 
        message: 'Solo los encargados pueden reactivar registros', 
        severity: 'error' 
      });
      return;
    }

    try {
      // Determinar la URL correcta según el tipo
      let url;
      switch (tipo) {
        case 'Control':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/control/${recordId}/`;
          break;
        case 'Asignación':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/asignacion/${recordId}/`;
          break;
        case 'Mantenimiento':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/mantenimiento/${recordId}/`;
          break;
        case 'Seguro':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/seguros/${recordId}/`;
          break;
        case 'ITV':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/itv/${recordId}/`;
          break;
        case 'SOAT':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/soat/${recordId}/`;
          break;
        case 'Impuesto':
          url = `http://localhost:8000/api/maquinaria/${maquinariaId}/impuestos/${recordId}/`;
          break;
        default:
          throw new Error('Tipo de registro no válido');
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'X-User-Email': user.Email
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos para reactivar registros');
        }
        throw new Error('Error al reactivar el registro');
      }

      setSnackbar({ 
        open: true, 
        message: `${tipo} reactivado exitosamente!`, 
        severity: 'success' 
      });

      // Recargar los registros desactivados
      await fetchRegistrosDesactivados();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  // Siempre cargar los registros desactivados cuando se muestra el componente
  React.useEffect(() => {
    if (isEncargado) {
      fetchRegistrosDesactivados();
      setShowTable(true);
    }
  }, [isEncargado, fetchRegistrosDesactivados]);

  return (
    <Box>
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

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Registros Desactivados
        </Typography>
      </Box>

      {showTable && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <RegistrosDesactivadosTable
            registrosDesactivados={registrosDesactivados}
            onReactivar={handleReactivar}
            loading={loading}
            isEncargado={isEncargado}
          />
        </Paper>
      )}
    </Box>
  );
};

// PropTypes para el componente
RegistrosDesactivadosMain.propTypes = {
  maquinariaId: PropTypes.string.isRequired
};

export default RegistrosDesactivadosMain; 