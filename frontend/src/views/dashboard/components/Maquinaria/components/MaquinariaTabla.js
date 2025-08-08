import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PropTypes from 'prop-types';
import { TableChart, Visibility } from '@mui/icons-material';

const MaquinariaTabla = ({
  maquinarias,
  pageSize,
  currentPage,
  setCurrentPage,
  loading,
  handleDetailsClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const totalPages = pageSize === "Todos" ? 1 : Math.ceil(maquinarias.length / parseInt(pageSize, 10));
  const getDisplayedData = () => {
    if (!Array.isArray(maquinarias)) return [];
    if (pageSize === "Todos") return maquinarias;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    return maquinarias.slice(start, start + parseInt(pageSize, 10));
  };

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, p: 3, backgroundColor: '#fff', boxShadow: 3 }}>
      {/* Header mejorado */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        mb={3}
        p={2}
        bgcolor="primary.main"
        color="primary.contrastText"
        borderRadius={2}
        boxShadow={2}
      >
        <Box display="flex" alignItems="center">
          <TableChart sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Maquinaria
          </Typography>
        </Box>
        <Chip
          label={`${maquinarias.length} registro${maquinarias.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'inherit',
            fontWeight: 600
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <CircularProgress size={60} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Cargando datos...
          </Typography>
        </Box>
      ) : maquinarias.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <TableChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay registros disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los datos aparecerán aquí cuando estén disponibles
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer 
            sx={{ 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              maxHeight: { xs: '400px', sm: '500px', md: '600px' }
            }}
          >
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Gestión
                  </TableCell>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Placa
                  </TableCell>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Detalle
                  </TableCell>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Unidad
                  </TableCell>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Código
                  </TableCell>
                  <TableCell sx={{ 
                    display: { xs: 'none', sm: 'table-cell' },
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Marca
                  </TableCell>
                  <TableCell sx={{ 
                    display: { xs: 'none', sm: 'table-cell' },
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Modelo
                  </TableCell>
                  <TableCell sx={{ 
                    display: { xs: 'none', sm: 'table-cell' },
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Color
                  </TableCell>
                  <TableCell sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getDisplayedData().map((m) => {
                  const id = m._id?.$oid || m._id || m.id;
                  const cleanId = id?.toString().replace(/[^a-zA-Z0-9]/g, '');
                  return (
                    <TableRow 
                      key={cleanId}
                      sx={{
                        '&:nth-of-type(odd)': {
                          bgcolor: theme.palette.action.hover
                        },
                        '&:hover': {
                          bgcolor: theme.palette.action.selected,
                          transition: 'background-color 0.2s ease',
                          transform: 'scale(1.01)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <TableCell sx={{ 
                        p: { xs: 1, sm: 1.5 },
                        fontWeight: 600,
                        color: theme.palette.primary.main
                      }}>
                        {m.gestion}
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Chip
                          label={m.placa || '—'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        {m.detalle}
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Chip
                          label={m.unidad || '—'}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        {m.codigo || '—'}
                      </TableCell>
                      <TableCell sx={{ 
                        display: { xs: 'none', sm: 'table-cell' },
                        p: { xs: 1, sm: 1.5 }
                      }}>
                        {m.marca || '—'}
                      </TableCell>
                      <TableCell sx={{ 
                        display: { xs: 'none', sm: 'table-cell' },
                        p: { xs: 1, sm: 1.5 }
                      }}>
                        {m.modelo || '—'}
                      </TableCell>
                      <TableCell sx={{ 
                        display: { xs: 'none', sm: 'table-cell' },
                        p: { xs: 1, sm: 1.5 }
                      }}>
                        {m.color || '—'}
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleDetailsClick(cleanId)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: 2
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Historial
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación mejorada */}
          {totalPages > 1 && pageSize !== 'Todos' && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                disabled={pageSize === "Todos"}
                showFirstButton
                showLastButton
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

MaquinariaTabla.propTypes = {
  maquinarias: PropTypes.array.isRequired,
  pageSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setPageSize: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  handleDetailsClick: PropTypes.func.isRequired,
  setNewMaquinariaModalOpen: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  unidadFilter: PropTypes.string.isRequired,
  setUnidadFilter: PropTypes.func.isRequired,
};

export default MaquinariaTabla;
