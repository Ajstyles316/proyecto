import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  IconButton,
  useMediaQuery,
  TableContainer,
  Paper
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useState } from "react";
import PropTypes from "prop-types";
import { useUser } from 'src/components/UserContext.jsx';
import { getRandomRecomendacionesPorTipo } from './hooks';

// Agregar utilidades para capitalizar y formatear probabilidad
function capitalizeSentence(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function formatProbabilidad(prob) {
  if (prob === undefined || prob === null) return '-';
  const num = Number(prob);
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2)}%`;
}

// Utilidad para color de riesgo
function getRiesgoColor(riesgo) {
  if (!riesgo) return undefined;
  const val = String(riesgo).toLowerCase();
  if (val === 'alto') return '#d32f2f';
  if (val === 'medio') return '#ff9800';
  if (val === 'bajo') return '#388e3c';
  return undefined;
}

// Utilidad para determinar urgencia basada en parámetros específicos
function getUrgencia(item) {
  // Si ya tenemos urgencia calculada en el backend, usarla
  if (item.urgencia) {
    const urgenciaColors = {
      'CRÍTICA': '#d32f2f',
      'ALTA': '#f57c00',
      'MODERADA': '#ff9800',
      'NORMAL': '#4caf50',
      'MÍNIMA': '#8bc34a'
    };
    return { nivel: item.urgencia, color: urgenciaColors[item.urgencia] || '#8bc34a' };
  }
  
  // Si no hay urgencia del backend, calcularla localmente
  const dias = parseInt(item.dias) || 0;
  const recorrido = parseInt(item.recorrido) || 0;
  const horasOp = parseInt(item.horas_op) || 0;
  const diasHastaMantenimiento = parseInt(item.dias_hasta_mantenimiento) || 0;
  
  // Criterios para urgencia CRÍTICA
  if (dias > 120 || recorrido > 15000 || horasOp > 3000 || diasHastaMantenimiento <= 1) {
    return { nivel: 'CRÍTICA', color: '#d32f2f' };
  }
  
  // Criterios para urgencia ALTA
  if (dias > 90 || recorrido > 12000 || horasOp > 2500 || diasHastaMantenimiento <= 3) {
    return { nivel: 'ALTA', color: '#f57c00' };
  }
  
  // Criterios para urgencia MODERADA
  if (dias > 60 || recorrido > 9000 || horasOp > 2000 || diasHastaMantenimiento <= 7) {
    return { nivel: 'MODERADA', color: '#ff9800' };
  }
  
  // Criterios para urgencia NORMAL
  if (dias > 30 || recorrido > 6000 || horasOp > 1500 || diasHastaMantenimiento <= 15) {
    return { nivel: 'NORMAL', color: '#4caf50' };
  }
  
  // Por defecto, urgencia MÍNIMA
  return { nivel: 'MÍNIMA', color: '#8bc34a' };
}

const HistorialPronosticos = ({ data, onRecomendacionClick }) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const { user } = useUser();
  const permisosPronostico = user?.permisos?.['Pronóstico'] || {};
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const canEdit = isAdminOrEncargado || permisosPronostico.editar;
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.between('sm', 'md'));

  const totalPages = rowsPerPage === 'Todos' ? 1 : Math.ceil(data.length / rowsPerPage);
  const paginated = rowsPerPage === 'Todos' ? data : data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  return (
    <>
      <Typography variant="h6" mt={{ xs: 2, sm: 3, md: 4 }} mb={{ xs: 1, sm: 2 }} align="center" sx={{
        fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
      }}>
        Historial de Pronósticos
      </Typography>
      <Box width="100%" maxWidth={1100} sx={{ px: { xs: 1, sm: 2 } }}>
        <Box display="flex" justifyContent="flex-end" mb={2} sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}>
          <TextField
            select
            label="Mostrar"
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(e.target.value === 'Todos' ? 'Todos' : parseInt(e.target.value, 10)); setPage(1); }}
            size="small"
            sx={{ 
              width: { xs: '100%', sm: 180 },
              minWidth: { xs: 'auto', sm: 180 },
            }}
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
            <MenuItem value={'Todos'}>Todos</MenuItem>
          </TextField>
        </Box>
        <TableContainer component={Paper} sx={{ 
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'auto',
          maxHeight: { xs: '400px', sm: '500px', md: '600px' },
        }}>
          <Table stickyHeader size={isMobile ? "small" : "medium"} sx={{
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              borderBottom: '2px solid rgba(224, 224, 224, 1)',
              fontWeight: 600,
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                }}>Placa</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', md: 'table-cell' },
                }}>Fecha Asignación</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', sm: 'table-cell' },
                }}>Horas Operación</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', lg: 'table-cell' },
                }}>Recorrido</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                }}>Tipo de Mantenimiento</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', lg: 'table-cell' },
                }}>Fecha de Mantenimiento Programada</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                }}>Urgencia</TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 },
                }}>Recomendaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((item, idx) => {
                const urgencia = getUrgencia(item);
                return (
                  <TableRow key={item._id || idx} sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                  }}>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      fontWeight: 600,
                    }}>{item.placa}</TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: 'none', md: 'table-cell' },
                    }}>
                      {item.fecha_asig ? (String(item.fecha_asig).includes("T") ? String(item.fecha_asig).split("T")[0] : String(item.fecha_asig).split(" ")[0]) : "-"}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: 'none', sm: 'table-cell' },
                    }}>{item.horas_op}</TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: 'none', lg: 'table-cell' },
                    }}>{item.recorrido}</TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}>
                      {/* Mejorar capitalización de resultado y mostrar riesgo y probabilidad si existen */}
                      <span style={{ display: 'block', fontWeight: 500 }}>{capitalizeSentence(item.resultado) || "-"}</span>
                      {item.riesgo && (
                        <span style={{ display: 'block', fontWeight: 600, color: getRiesgoColor(item.riesgo) }}>
                          Riesgo: {capitalizeSentence(item.riesgo)}
                        </span>
                      )}
                      {item.probabilidad !== undefined && (
                        <span style={{ display: 'block', color: '#1976d2' }}>
                          Probabilidad: {formatProbabilidad(item.probabilidad)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: 'none', lg: 'table-cell' },
                    }}>
                      {/* Mostrar fecha sugerida si existe, sino fecha de mantenimiento, sino calcular una fecha por defecto */}
                      {item.fecha_sugerida 
                        ? item.fecha_sugerida
                        : item.fecha_mantenimiento
                          ? item.fecha_mantenimiento
                          : (() => {
                              try {
                                const base = item.fecha_asig;
                                if (!base) return "No disponible";
                                const d = new Date(base);
                                // Calcular fecha sugerida por defecto según el tipo de mantenimiento
                                if (item.resultado && item.resultado.toLowerCase().includes('correctivo')) {
                                  d.setDate(d.getDate() + 10); // 10 días para correctivo
                                } else if (item.resultado && item.resultado.toLowerCase().includes('preventivo')) {
                                  d.setDate(d.getDate() + 60); // 60 días para preventivo
                                } else {
                                  d.setDate(d.getDate() + 30); // 30 días por defecto
                                }
                                return d.toISOString().split("T")[0];
                              } catch {
                                return "No disponible";
                              }
                            })()}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: urgencia.color,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${urgencia.color}15`,
                        fontSize: isMobile ? '0.6rem' : '0.7rem',
                      }}>
                        {urgencia.nivel}
                      </span>
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={e => canEdit && onRecomendacionClick(e, getRandomRecomendacionesPorTipo(item.resultado, Array.isArray(item.recomendaciones) && item.recomendaciones.length > 0 ? item.recomendaciones : ["No hay recomendaciones generadas."]))}
                        disabled={!canEdit && !isAdminOrEncargado}
                        sx={{ 
                          padding: { xs: '4px', sm: '8px' },
                        }}
                      >
                        <InfoIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && rowsPerPage !== 'Todos' && (
          <Box display="flex" justifyContent="center" mt={2} sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
          }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, p) => setPage(p)}
              showFirstButton
              showLastButton
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </>
  );
};
HistorialPronosticos.propTypes = {
  data: PropTypes.array.isRequired,
  onRecomendacionClick: PropTypes.func.isRequired,
};
export default HistorialPronosticos;