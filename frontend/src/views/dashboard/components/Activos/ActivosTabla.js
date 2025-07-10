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
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  const filteredActivos = useMemo(() => {
    let data = activos;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter(a =>
        (a.bien_uso || '').toLowerCase().includes(q) ||
        String(a.vida_util || '').toLowerCase().includes(q) ||
        String(a.coeficiente || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [activos, searchQuery]);

  const totalPages = pageSize === 'Todos' ? 1 : Math.ceil(filteredActivos.length / parseInt(pageSize, 10));

  const getDisplayedData = () => {
    if (!Array.isArray(filteredActivos)) return [];
    if (pageSize === 'Todos') return filteredActivos.map(enriquecerActivo);
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    return filteredActivos.slice(start, start + parseInt(pageSize, 10)).map(enriquecerActivo);
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

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Buscar"
          size="small"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Filas por página"
          size="small"
          value={pageSize}
          onChange={e => { setPageSize(e.target.value); setCurrentPage(1); }}
          sx={{ minWidth: 150 }}
        >
          {PAGE_SIZE_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredActivos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary">
            No hay activos disponibles
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Bienes de Uso</TableCell>
                  <TableCell>Años de vida útil</TableCell>
                  <TableCell>Coeficiente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getDisplayedData().map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.bien_uso || '—'}</TableCell>
                    <TableCell>{row.vida_util || '—'}</TableCell>
                    <TableCell>{
  row.coeficiente !== '' && row.coeficiente !== undefined && row.coeficiente !== null
    ? (() => {
        let val = Number(row.coeficiente);
        if (val < 1) val = val * 100;
        return Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`;
      })()
    : '—'
}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredActivos.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                disabled={pageSize === 'Todos'}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </>
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