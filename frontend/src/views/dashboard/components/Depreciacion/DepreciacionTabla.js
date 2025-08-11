import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Pagination,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { TableChart, Search, Visibility } from '@mui/icons-material';

const DepreciacionTabla = ({ maquinarias, handleVerDetalleClick, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    return (maquinarias || []).filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        (item.placa || '').toLowerCase().includes(term) ||
        (item.detalle || '').toLowerCase().includes(term) ||
        (item.metodo_depreciacion || '').toLowerCase().includes(term) ||
        (item.codigo || '').toLowerCase().includes(term)
      );
    });
  }, [searchTerm, maquinarias]);

  const totalPages = pageSize === 'Todos' ? 1 : Math.ceil(filteredRows.length / parseInt(pageSize, 10));
  // Lógica para determinar bien de uso, vida útil y coeficiente en base al tipo y detalle
  function determinarBienUsoYVidaUtil(tipo, detalle) {
    const reglas = [
      { tipos: ['vehículo', 'vehiculos', 'camión', 'camion', 'auto', 'camioneta'], bien_uso: 'Vehículos automotores', vida_util: 5 },
      { tipos: ['maquinaria', 'excavadora', 'retroexcavadora', 'cargador'], bien_uso: 'Maquinaria pesada', vida_util: 8 },
      { tipos: ['equipo', 'herramienta'], bien_uso: 'Equipos de construcción', vida_util: 5 },
      { tipos: ['oficina', 'computadora', 'impresora'], bien_uso: 'Equipos de oficina', vida_util: 4 },
      { tipos: ['mueble', 'enseres'], bien_uso: 'Muebles y enseres', vida_util: 10 },
    ];
    const texto = `${tipo || ''} ${detalle || ''}`.toLowerCase();
    for (const regla of reglas) {
      if (regla.tipos.some(t => texto.includes(t))) {
        return { bien_de_uso: regla.bien_uso, vida_util: regla.vida_util };
      }
    }
    return { bien_de_uso: 'Otros bienes', vida_util: 5 };
  }
  // Enriquecer cada maquinaria antes de mostrarla
  function enriquecerMaquinaria(row) {
    if (row.bien_de_uso && row.vida_util && row.costo_activo !== undefined && row.costo_activo !== null) return row;
    const enriquecido = determinarBienUsoYVidaUtil(row.tipo, row.detalle);
    return {
      ...row,
      bien_de_uso: row.bien_de_uso || enriquecido.bien_de_uso,
      vida_util: row.vida_util || enriquecido.vida_util,
      costo_activo: row.costo_activo !== undefined && row.costo_activo !== null ? row.costo_activo : 0,
    };
  }
  
  const currentRows = useMemo(() => {
    const enrichedRows = filteredRows.map(enriquecerMaquinaria);
    if (pageSize === 'Todos') return enrichedRows;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return enrichedRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

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
            Depreciación de Activos
          </Typography>
        </Box>
        <Chip
          label={`${filteredRows.length} registro${filteredRows.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'inherit',
            fontWeight: 600
          }}
        />
      </Box>

      {/* Controles de búsqueda y paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1, maxWidth: '300px' }}>
          <Search sx={{ color: 'text.secondary' }} />
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>
        <Select
          value={pageSize}
          onChange={(e) => {
            setPageSize(e.target.value);
            setCurrentPage(1);
          }}
          size="small"
          sx={{ 
            width: '200px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          {[10, 20, 50, 100, 'Todos'].map((size) => (
            <MenuItem key={size} value={size}>
              {size} registros
            </MenuItem>
          ))}
        </Select>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <CircularProgress size={60} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Cargando datos...
          </Typography>
        </Box>
      ) : filteredRows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron registros
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay registros de maquinaria disponibles'}
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
            <Table size={isMobile ? "small" : "medium"} sx={{
              '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(224, 224, 224, 1)',
              },
              '& .MuiTableRow-root:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'scale(1.01)',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                borderBottom: '2px solid rgba(224, 224, 224, 1)',
                fontWeight: 600,
              }
            }}>
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
                    display: { xs: 'none', sm: 'table-cell' },
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Bien de Uso
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
                    Método
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    p: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Vida Útil (Años)
                  </TableCell>
                  <TableCell align="center" sx={{ 
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
                {currentRows.map((row) => {
                  const key = row.maquinaria_id || row._id?.$oid || row._id || row.id || Math.random();
                  return (
                    <TableRow 
                      key={key}
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
                        {row.placa || '\u2014'}
                      </TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 1.5 } }}>
                        {row.detalle || '\u2014'}
                      </TableCell>
                      <TableCell sx={{ 
                        display: { xs: 'none', sm: 'table-cell' },
                        p: { xs: 1, sm: 1.5 }
                      }}>
                        <Chip
                          label={row.bien_de_uso || '—'}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        display: { xs: 'none', sm: 'table-cell' },
                        p: { xs: 1, sm: 1.5 }
                      }}>
                        <Chip
                          label={row.metodo_depreciacion === 'linea_recta' ? 'Línea Recta' : (row.metodo_depreciacion || '\u2014')}
                          size="small"
                          color="primary"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {row.vida_util || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleVerDetalleClick(row)}
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
                          Ver Detalle
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
                disabled={pageSize === 'Todos'}
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

DepreciacionTabla.propTypes = {
  depreciaciones: PropTypes.array.isRequired,
  handleVerDetalleClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  depreciacionesPorMaquinaria: PropTypes.object,
  activos: PropTypes.array,
  maquinarias:PropTypes.array
};

export default DepreciacionTabla;