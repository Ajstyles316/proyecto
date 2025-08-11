import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TableSortLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import PropTypes from 'prop-types';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 'Todos'];

// Lógica para determinar bien de uso, vida útil y coeficiente en base al tipo y detalle
function determinarBienUsoYVidaUtil(tipo, detalle) {
  // Puedes ajustar estos valores según tu lógica de negocio/backend
  const reglas = [
    { tipos: ['vehículo', 'vehiculos', 'camión', 'camion', 'auto', 'camioneta'], bien_uso: 'Vehículos automotores', vida_util: 5, coeficiente: 20 },
    { tipos: ['maquinaria', 'excavadora', 'retroexcavadora', 'cargador'], bien_uso: 'Maquinaria pesada', vida_util: 8, coeficiente: 12.5 },
    { tipos: ['equipo', 'herramienta'], bien_uso: 'Equipos de construcción', vida_util: 5, coeficiente: 20 },
    { tipos: ['oficina', 'computadora', 'impresora'], bien_uso: 'Equipos de oficina', vida_util: 4, coeficiente: 25 },
    { tipos: ['mueble', 'enseres'], bien_uso: 'Muebles y enseres', vida_util: 10, coeficiente: 10 },
  ];
  const texto = `${tipo || ''} ${detalle || ''}`.toLowerCase();
  for (const regla of reglas) {
    if (regla.tipos.some(t => texto.includes(t))) {
      return { bien_uso: regla.bien_uso, vida_util: regla.vida_util, coeficiente: regla.coeficiente };
    }
  }
  return { bien_uso: 'Otros bienes', vida_util: 5, coeficiente: 20 };
}

const ActivosTabla = ({ activos, loading }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('ascendente'); // 'ascendente' o 'descendente'
  const [sortField, setSortField] = useState('vida_util');

  const filteredAndSortedActivos = useMemo(() => {
    let data = activos;
    
    // Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter(a =>
        (a.bien_uso || '').toLowerCase().includes(q) ||
        String(a.vida_util || '').toLowerCase().includes(q) ||
        String(a.coeficiente || '').toLowerCase().includes(q)
      );
    }

    // Enriquecer datos
    data = data.map(enriquecerActivo);

    // Ordenar
    data.sort((a, b) => {
      let aValue = a[sortField] || 0;
      let bValue = b[sortField] || 0;
      
      // Convertir a números si es posible
      if (typeof aValue === 'string') aValue = parseFloat(aValue) || 0;
      if (typeof bValue === 'string') bValue = parseFloat(bValue) || 0;
      
      if (sortOrder === 'ascendente') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return data;
  }, [activos, searchQuery, sortOrder, sortField]);

  const totalPages = pageSize === 'Todos' ? 1 : Math.ceil(filteredAndSortedActivos.length / parseInt(pageSize, 10));

  const getDisplayedData = () => {
    if (!Array.isArray(filteredAndSortedActivos)) return [];
    if (pageSize === 'Todos') return filteredAndSortedActivos;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    return filteredAndSortedActivos.slice(start, start + parseInt(pageSize, 10));
  };

  // Enriquecer cada activo antes de mostrarlo
  function enriquecerActivo(row) {
    if (row.bien_uso && row.vida_util && row.coeficiente) return row;
    const enriquecido = determinarBienUsoYVidaUtil(row.tipo, row.detalle);
    return {
      ...row,
      bien_uso: row.bien_uso || enriquecido.bien_uso,
      vida_util: row.vida_util || enriquecido.vida_util,
      coeficiente: row.coeficiente || enriquecido.coeficiente,
    };
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ascendente' ? 'descendente' : 'ascendente');
    } else {
      setSortField(field);
      setSortOrder('ascendente');
    }
  };

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

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3, background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' }}>
      {/* Header con controles mejorado */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg)',
        color: 'white',
        borderBottom: '1px solid',
        borderColor: 'primary.100'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'black' }}>
          Gestión de Activos
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Buscar activos"
            size="small"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'black' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 250,
              
            }}
          />
          <TextField
            select
            label="Filas por página"
            size="small"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value); setCurrentPage(1); }}
            sx={{ 
              minWidth: 150,
            }}
          >
            {PAGE_SIZE_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ordenar por:
            </Typography>
            <Tooltip title="Cambiar orden de vida útil">
              <IconButton 
                size="small" 
                onClick={() => handleSort('vida_util')}
                sx={{ 
                  bgcolor: sortField === 'vida_util' ? 'primary.main' : 'transparent',
                  color: sortField === 'vida_util' ? 'white' : 'primary.main',
                  '&:hover': {
                    bgcolor: sortField === 'vida_util' ? 'primary.dark' : 'primary.50'
                  }
                }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredAndSortedActivos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            No hay activos disponibles
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader sx={{
              '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(224, 224, 224, 1)',
              },
              '& .MuiTableRow-root:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'scale(1.01)',
                transition: 'all 0.2s ease'
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                borderBottom: '2px solid rgba(224, 224, 224, 1)',
                fontWeight: 600,
              }
            }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    color: 'white'
                  }}>
                    Bienes de Uso
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    color: 'white'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Años de Vida Útil
                      <TableSortLabel
                        active={sortField === 'vida_util'}
                        direction={sortOrder}
                        onClick={() => handleSort('vida_util')}
                        sx={{ 
                          color: 'white',
                          '&.MuiTableSortLabel-active': {
                            color: 'white'
                          },
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important'
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'white'
                  }}>
                    Coeficiente
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    color: 'white'
                  }}>
                    Estado
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getDisplayedData().map((row, idx) => (
                  <TableRow 
                    key={idx}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'rgba(25, 118, 210, 0.02)' },
                      '&:hover': { 
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        transform: 'scale(1.01)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                      {row.bien_uso || '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.vida_util || '—'}
                        </Typography>
                        <Chip
                          label={getVidaUtilText(row.vida_util)}
                          size="small"
                          color={getVidaUtilColor(row.vida_util)}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {row.coeficiente !== '' && row.coeficiente !== undefined && row.coeficiente !== null
                        ? (() => {
                            let val = Number(row.coeficiente);
                            if (val < 1) val = val * 100;
                            return Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`;
                          })()
                        : '—'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getVidaUtilText(row.vida_util)}
                        size="small"
                        color={getVidaUtilColor(row.vida_util)}
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 80
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación mejorada */}
          {filteredAndSortedActivos.length > 0 && (
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderTop: '2px solid',
              borderColor: '#1976d2'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Mostrando {((currentPage - 1) * parseInt(pageSize, 10)) + 1} - {Math.min(currentPage * parseInt(pageSize, 10), filteredAndSortedActivos.length)} de {filteredAndSortedActivos.length} activos
                </Typography>
                <Chip 
                  label={`Página ${currentPage} de ${totalPages}`} 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                disabled={pageSize === 'Todos'}
                showFirstButton
                showLastButton
                color="primary"
                size="medium"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 600,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white'
                    }
                  }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

ActivosTabla.propTypes = {
  activos: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

ActivosTabla.defaultProps = {
  loading: false,
};

export default ActivosTabla; 