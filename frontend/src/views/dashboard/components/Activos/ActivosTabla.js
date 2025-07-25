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
    if (vida <= 5) return 'Óptima';
    if (vida <= 8) return 'Normal';
    return 'Alta';
  };

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
      {/* Header con controles */}
      <Box sx={{ 
        p: 3, 
        bgcolor: 'primary.50', 
        borderBottom: '1px solid',
        borderColor: 'primary.100'
      }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Buscar activos"
            size="small"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'grey.50'
                }
              }
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
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white'
              }
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
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    fontSize: '0.9rem'
                  }}>
                    Bienes de Uso
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    fontSize: '0.9rem'
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
                    color: 'white',
                    fontSize: '0.9rem'
                  }}>
                    Coeficiente
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    fontSize: '0.9rem'
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
                      '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                      '&:hover': { bgcolor: 'primary.50' },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
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
                        label={sortOrder === 'ascendente' ? 'Ascendente' : 'Descendente'}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {filteredAndSortedActivos.length > 0 && (
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: 'grey.50',
              borderTop: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {((currentPage - 1) * parseInt(pageSize, 10)) + 1} - {Math.min(currentPage * parseInt(pageSize, 10), filteredAndSortedActivos.length)} de {filteredAndSortedActivos.length} activos
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                disabled={pageSize === 'Todos'}
                showFirstButton
                showLastButton
                color="primary"
                size="small"
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