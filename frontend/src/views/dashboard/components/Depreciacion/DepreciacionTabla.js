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

const DepreciacionTabla = ({ depreciaciones, handleVerDetalleClick, loading, depreciacionesPorMaquinaria }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    return depreciaciones.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.placa?.toLowerCase().includes(term) ||
        item.detalle?.toLowerCase().includes(term) ||
        item.metodo_depreciacion?.toLowerCase().includes(term) ||
        item.codigo?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, depreciaciones]);

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
            No hay registros de depreciación disponibles.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Placa</TableCell>
                  <TableCell>Detalle</TableCell>
                  <TableCell>Bien de Uso</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="right">Costo del Activo</TableCell>
                  <TableCell align="right">Vida Útil (Años)</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentRows.map((row) => {
                  const dep = depreciacionesPorMaquinaria?.[row.maquinaria_id];
                  const costoRaw = dep?.costo_activo ?? row.costo_activo ?? row.adqui ?? null;
                  const costoMostrar =
                    costoRaw !== undefined && costoRaw !== null && !isNaN(parseFloat(costoRaw))
                      ? `Bs. ${parseFloat(costoRaw).toFixed(2)}`
                      : '—';

                  return (
                    <TableRow key={row.maquinaria_id}>
                      <TableCell>{row.placa || '—'}</TableCell>
                      <TableCell>{row.detalle || '—'}</TableCell>
                      <TableCell>{row.bien_de_uso || '—'}</TableCell>
                      <TableCell>{row.metodo_depreciacion || '—'}</TableCell>
                      <TableCell align="right">{costoMostrar}</TableCell>
                      <TableCell align="right">{row.vida_util || '—'}</TableCell>
                      <TableCell align="center">
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
};

export default DepreciacionTabla;
