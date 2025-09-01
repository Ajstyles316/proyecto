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
  const [metodoFilter, setMetodoFilter] = useState('');
  const [bienUsoFilter, setBienUsoFilter] = useState('');

  // Lógica para determinar bien de uso, vida útil y coeficiente en base al tipo y detalle
  const determinarBienUsoYVidaUtil = (tipo, detalle) => {
    const reglas = [
      { tipos: ['vehículo', 'vehiculos', 'camión', 'camion', 'auto', 'camioneta'], bien_de_uso: 'Vehículos automotores', vida_util: 5 },
      { tipos: ['maquinaria', 'excavadora', 'retroexcavadora', 'cargador'], bien_de_uso: 'Maquinaria pesada', vida_util: 8 },
      { tipos: ['equipo', 'herramienta'], bien_de_uso: 'Equipos de construcción', vida_util: 5 },
      { tipos: ['oficina', 'computadora', 'impresora'], bien_de_uso: 'Equipos de oficina', vida_util: 4 },
      { tipos: ['mueble', 'enseres'], bien_de_uso: 'Muebles y enseres', vida_util: 10 },
    ];
    
    const texto = `${tipo || ''} ${detalle || ''}`.toLowerCase();
    for (const regla of reglas) {
      if (regla.tipos.some(t => texto.includes(t))) {
        return { bien_de_uso: regla.bien_de_uso, vida_util: regla.vida_util };
      }
    }
    return { bien_de_uso: 'Otros bienes', vida_util: 5 };
  };

  // Obtener bien_de_uso de un item (usado en filtros)
  const getBienDeUso = (item) => {
    // Si ya tiene bien_de_uso, usarlo
    if (item.bien_de_uso && item.bien_de_uso.trim() !== '') {
      return item.bien_de_uso;
    }
    
    // Si no, calcularlo
    const { bien_de_uso } = determinarBienUsoYVidaUtil(item.tipo, item.detalle);
    return bien_de_uso;
  };

  // Calcular opciones únicas para los filtros (corregido)
  const metodoOptions = useMemo(() => {
    const options = new Set();
    (maquinarias || []).forEach(item => {
      if (item.metodo_depreciacion && item.metodo_depreciacion.trim() !== '') {
        options.add(item.metodo_depreciacion);
      }
    });
    return Array.from(options).sort();
  }, [maquinarias]);

  const bienUsoOptions = useMemo(() => {
    const options = new Set();
    (maquinarias || []).forEach(item => {
      const bienDeUso = getBienDeUso(item);
      if (bienDeUso && bienDeUso.trim() !== '') {
        options.add(bienDeUso);
      }
    });
    return Array.from(options).sort();
  }, [maquinarias, getBienDeUso]);

  const filteredRows = useMemo(() => {
    return (maquinarias || []).filter((item) => {
      const term = searchTerm.toLowerCase();
      
      // Obtener bien de uso para el filtro
      const bienDeUso = getBienDeUso(item);
      
      // Verificar filtros
      const metodoMatch = metodoFilter ? 
        (item.metodo_depreciacion || '').toLowerCase() === metodoFilter.toLowerCase() : 
        true;
      
      const bienUsoMatch = bienUsoFilter ? 
        bienDeUso.toLowerCase() === bienUsoFilter.toLowerCase() : 
        true;
      
      return (
        metodoMatch &&
        bienUsoMatch &&
        (
          (item.placa || '').toLowerCase().includes(term) ||
          (item.detalle || '').toLowerCase().includes(term) ||
          (item.metodo_depreciacion || '').toLowerCase().includes(term) ||
          (item.codigo || '').toLowerCase().includes(term)
        )
      );
    });
  }, [searchTerm, maquinarias, metodoFilter, bienUsoFilter, getBienDeUso]);

  const totalPages = pageSize === 'Todos' ? 1 : Math.ceil(filteredRows.length / parseInt(pageSize, 10));
  
  // Enriquecer cada maquinaria antes de mostrarla
  const enriquecerMaquinaria = (row) => {
    if (row.bien_de_uso && row.vida_util && row.costo_activo !== undefined && row.costo_activo !== null) return row;
    
    const enriquecido = determinarBienUsoYVidaUtil(row.tipo, row.detalle);
    return {
      ...row,
      bien_de_uso: row.bien_de_uso || enriquecido.bien_de_uso,
      vida_util: row.vida_util || enriquecido.vida_util,
      costo_activo: row.costo_activo !== undefined && row.costo_activo !== null ? row.costo_activo : 0,
    };
  };
  
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

      {/* Controles de búsqueda y filtros */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '300px' } }}>
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
        
        <Box display="flex" gap={1} sx={{ flexWrap: 'wrap', minWidth: { xs: '100%', sm: 'auto' } }}>
          {/* Filtro de Método de Depreciación */}
          <Select
            value={metodoFilter}
            onChange={(e) => {
              setMetodoFilter(e.target.value);
              setCurrentPage(1);
            }}
            displayEmpty
            size="small"
            sx={{ 
              minWidth: '150px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            renderValue={(selected) => {
              if (!selected) {
                return <span style={{ color: 'text.secondary' }}>Método de depreciación</span>;
              }
              return selected === 'linea_recta' ? 'Línea Recta' : selected;
            }}
          >
            <MenuItem value="">
              <em>Todos los métodos</em>
            </MenuItem>
            {metodoOptions.map((metodo) => (
              <MenuItem key={metodo} value={metodo}>
                {metodo === 'linea_recta' ? 'Línea Recta' : metodo}
              </MenuItem>
            ))}
          </Select>

          {/* Filtro de Bien de Uso - CORREGIDO */}
          <Select
            value={bienUsoFilter}
            onChange={(e) => {
              setBienUsoFilter(e.target.value);
              setCurrentPage(1);
            }}
            displayEmpty
            size="small"
            sx={{ 
              minWidth: '180px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            renderValue={(selected) => {
              if (!selected) {
                return <span style={{ color: 'text.secondary' }}>Bien de uso</span>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>Todos los bienes</em>
            </MenuItem>
            {bienUsoOptions.map((bien) => (
              <MenuItem key={bien} value={bien}>
                {bien}
              </MenuItem>
            ))}
          </Select>

          {/* Selector de registros por página */}
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value);
              setCurrentPage(1);
            }}
            size="small"
            sx={{ 
              width: '150px',
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
            {searchTerm || metodoFilter || bienUsoFilter ? 
              'Intenta con otros términos de búsqueda o filtros' : 
              'No hay registros de maquinaria disponibles'}
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
  maquinarias: PropTypes.array.isRequired,
  handleVerDetalleClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default DepreciacionTabla;