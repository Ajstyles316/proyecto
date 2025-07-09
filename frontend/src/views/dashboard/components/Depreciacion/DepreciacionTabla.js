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
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

const DepreciacionTabla = ({ maquinarias, handleVerDetalleClick, loading }) => {
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

  const totalPages =
    pageSize === 'Todos'
      ? 1
      : Math.ceil(filteredRows.length / parseInt(pageSize, 10));
  const currentRows =
    pageSize === 'Todos'
      ? filteredRows
      : filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Paper elevation={1} sx={{ borderRadius: 3, p: 3, backgroundColor: '#fff' }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Depreciación de Activos
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          sx={{ flexGrow: 1, maxWidth: '300px' }}
        />
        <Select
          value={pageSize}
          onChange={(e) => {
            setPageSize(e.target.value);
            setCurrentPage(1);
          }}
          size="small"
          sx={{ width: '200px' }}
        >
          {[10, 20, 50, 100, 'Todos'].map((size) => (
            <MenuItem key={size} value={size}>
              {size} registros
            </MenuItem>
          ))}
        </Select>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            No hay registros de maquinaria disponibles.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>Placa</TableCell>
                  <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>Detalle</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, p: { xs: 0.5, sm: 1 } }}>Bien de Uso</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, p: { xs: 0.5, sm: 1 } }}>Método</TableCell>
                  <TableCell align="right" sx={{ p: { xs: 0.5, sm: 1 } }}>Costo del Activo</TableCell>
                  <TableCell align="right" sx={{ p: { xs: 0.5, sm: 1 } }}>Vida Útil (Años)</TableCell>
                  <TableCell align="center" sx={{ p: { xs: 0.5, sm: 1 } }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentRows.map((row) => {
                  const key = row.maquinaria_id || row._id?.$oid || row._id || row.id || Math.random();
                  return (
                    <TableRow key={key}>
                      <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>{row.placa || '\u2014'}</TableCell>
                      <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>{row.detalle || '\u2014'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, p: { xs: 0.5, sm: 1 } }}>{row.bien_uso || row.bien_de_uso || '\u2014'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, p: { xs: 0.5, sm: 1 } }}>{row.metodo_depreciacion || '\u2014'}</TableCell>
                      <TableCell align="right" sx={{ p: { xs: 0.5, sm: 1 } }}>{row.costo_activo !== undefined && row.costo_activo !== null && !isNaN(parseFloat(row.costo_activo)) ? `Bs. ${parseFloat(row.costo_activo).toFixed(2)}` : '\u2014'}</TableCell>
                      <TableCell align="right" sx={{ p: { xs: 0.5, sm: 1 } }}>{row.vida_util || '\u2014'}</TableCell>
                      <TableCell align="center" sx={{ p: { xs: 0.5, sm: 1 } }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleVerDetalleClick(row)}
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
