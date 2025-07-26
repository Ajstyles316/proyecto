import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination
} from '@mui/material';
import { fetchActivos } from './utils/api';

const ActivosDashboardSimple = () => {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

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

  // Calcular datos de paginación
  const totalPages = Math.ceil(activos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentActivos = activos.slice(startIndex, endIndex);

  const getVidaUtilColor = (vidaUtil) => {
    const vida = parseInt(vidaUtil) || 0;
    if (vida <= 5) return 'success';
    if (vida <= 8) return 'primary';
    return 'warning';
  };

  const getVidaUtilText = (vidaUtil) => {
    const vida = parseInt(vidaUtil) || 0;
    if (vida <= 5) return 'Bajo';
    if (vida <= 8) return 'Medio';
    return 'Alta';
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        Activos Recientes
      </Typography>
      
      {activos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay activos disponibles
        </Typography>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Bien de Uso</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Vida Útil</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentActivos.map((activo, index) => (
                  <TableRow key={startIndex + index} hover>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {activo.bien_uso || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {activo.vida_util || '—'} años
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getVidaUtilText(activo.vida_util)}
                        size="small"
                        color={getVidaUtilColor(activo.vida_util)}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Página {currentPage} de {totalPages}
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                size="small"
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '0.75rem',
                    minWidth: 28,
                    height: 28
                  }
                }}
              />
            </Box>
          )}
          
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando {startIndex + 1}-{Math.min(endIndex, activos.length)} de {activos.length} activos
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

// PropTypes para el componente
ActivosDashboardSimple.propTypes = {
  // Este componente no recibe props, pero mantenemos la estructura para consistencia
};

export default ActivosDashboardSimple; 