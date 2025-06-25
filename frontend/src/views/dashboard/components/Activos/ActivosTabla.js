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
    if (pageSize === 'Todos') return filteredActivos;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    return filteredActivos.slice(start, start + parseInt(pageSize, 10));
  };

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
                    <TableCell>{row.coeficiente !== '' ? `${row.coeficiente}%` : '—'}</TableCell>
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