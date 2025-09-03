import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Divider
} from '@mui/material';
import ActivosTabla from './ActivosTabla';
import ActivosDashboard from './ActivosDashboard';
import { fetchActivos } from './utils/api';
import { useCanView, useIsPermissionDenied } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';

const ActivosMain = () => {
  const canView = useCanView('Activos');
  const isPermissionDenied = useIsPermissionDenied('Activos');
  
  // Si el permiso está denegado, mostrar mensaje de acceso denegado
  if (isPermissionDenied) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder al módulo de Activos.
        </Typography>
      </Paper>
    );
  }
  
  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }
  
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarActivos = async () => {
      setLoading(true);
      try {
        const data = await fetchActivos();
        setActivos(Array.isArray(data) ? data : []);
      } catch (error) {
        setActivos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarActivos();
  }, []);

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
      {/* Header con título */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Gestión de Activos
        </Typography>
      </Box>

      {/* Dashboard */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ActivosDashboard activos={activos} />
      )}

      {/* Divider */}
      <Divider sx={{ my: 4 }} />

      {/* Tabla de Activos */}
      <Box>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
          Tabla de Activos
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ActivosTabla activos={activos} />
        )}
      </Box>
    </Paper>
  );
};

export default ActivosMain; 