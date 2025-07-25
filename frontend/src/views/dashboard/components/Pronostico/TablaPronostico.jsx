import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack
} from "@mui/material";
import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useIsReadOnly } from 'src/components/UserContext.jsx';

const TablaPronostico = ({ maquinarias, searchTerm, setSearchTerm, openModal, isReadOnly, pronosticos }) => {
  const [maqCurrentPage, setMaqCurrentPage] = useState(1);
  const [maqRowsPerPage, setMaqRowsPerPage] = useState(10);
  const [filtroMantenimiento, setFiltroMantenimiento] = useState('todos'); // 'todos', 'con', 'sin'

  // Obtener IDs de maquinarias que ya tienen pronósticos
  const maquinariasConPronostico = useMemo(() => {
    if (!Array.isArray(pronosticos)) return new Set();
    return new Set(pronosticos.map(p => p.placa));
  }, [pronosticos]);

  // Filtrar maquinarias según el filtro de mantenimiento
  const maquinariasFiltradas = useMemo(() => {
    let filtradas = maquinarias;

    // Aplicar filtro de mantenimiento
    if (filtroMantenimiento === 'con') {
      filtradas = filtradas.filter(maq => maquinariasConPronostico.has(maq.placa));
    } else if (filtroMantenimiento === 'sin') {
      filtradas = filtradas.filter(maq => !maquinariasConPronostico.has(maq.placa));
    }

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtradas = filtradas.filter((maq) =>
        maq.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maq.placa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtradas;
  }, [maquinarias, filtroMantenimiento, searchTerm, maquinariasConPronostico]);

  const maqTotalPages = Math.ceil(maquinariasFiltradas.length / maqRowsPerPage);
  const paginatedMaquinarias = maquinariasFiltradas.slice(
    (maqCurrentPage - 1) * maqRowsPerPage,
    maqCurrentPage * maqRowsPerPage
  );

  const handleMaqRowsPerPageChange = (e) => {
    setMaqRowsPerPage(parseInt(e.target.value, 10));
    setMaqCurrentPage(1);
  };

  const handleFiltroMantenimientoChange = (e) => {
    setFiltroMantenimiento(e.target.value);
    setMaqCurrentPage(1);
  };

  const getMantenimientoStatus = (placa) => {
    return maquinariasConPronostico.has(placa) ? 'con' : 'sin';
  };

  const getStatusColor = (status) => {
    return status === 'con' ? 'success' : 'warning';
  };

  const getStatusText = (status) => {
    return status === 'con' ? 'Con Mantenimiento' : 'Sin Mantenimiento';
  };

  return (
    <>
      <Typography variant="h5" mb={2} fontWeight={600}>Pronóstico de Mantenimiento</Typography>

      {/* Controles de filtrado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Buscar"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setMaqCurrentPage(1);
            }}
            size="small"
            sx={{ minWidth: 250 }}
            color="black"
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtro de Mantenimiento</InputLabel>
            <Select
              value={filtroMantenimiento}
              label="Filtro de Mantenimiento"
              onChange={handleFiltroMantenimientoChange}
            >
              <MenuItem value="todos">Todas las Maquinarias</MenuItem>
              <MenuItem value="con">Con Mantenimiento</MenuItem>
              <MenuItem value="sin">Sin Mantenimiento</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <TextField
          select
          label="Mostrar"
          value={maqRowsPerPage}
          onChange={handleMaqRowsPerPageChange}
          size="small"
          sx={{ width: 180 }}
          color="black"
        >
          <MenuItem value={5}>5 registros</MenuItem>
          <MenuItem value={10}>10 registros</MenuItem>
          <MenuItem value={20}>20 registros</MenuItem>
          <MenuItem value={50}>50 registros</MenuItem>
          <MenuItem value={100}>100 registros</MenuItem>
        </TextField>
      </Box>

      {/* Información de filtros aplicados */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {maquinariasFiltradas.length} de {maquinarias.length} maquinarias
        </Typography>
        {filtroMantenimiento !== 'todos' && (
          <Chip
            label={`Filtro: ${filtroMantenimiento === 'con' ? 'Con Mantenimiento' : 'Sin Mantenimiento'}`}
            color={filtroMantenimiento === 'con' ? 'success' : 'warning'}
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      <Table sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell><b>N°</b></TableCell>
            <TableCell><b>Placa</b></TableCell>
            <TableCell><b>Detalle</b></TableCell>
            <TableCell><b>Estado</b></TableCell>
            <TableCell><b>Acción</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaquinarias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">No hay maquinarias que coincidan con los filtros</TableCell>
            </TableRow>
          ) : (
            paginatedMaquinarias.map((m, idx) => {
              const status = getMantenimientoStatus(m.placa);
              return (
                <TableRow key={m._id?.$oid || m._id}>
                  <TableCell>{(maqCurrentPage - 1) * maqRowsPerPage + idx + 1}</TableCell>
                  <TableCell>{m.placa || '-'}</TableCell>
                  <TableCell>{m.detalle || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(status)}
                      color={getStatusColor(status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => openModal(m)} 
                      disabled={isReadOnly}
                      size="small"
                    >
                      {status === 'con' ? 'Ver Pronóstico' : 'Generar Pronóstico'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {maqTotalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
          <Pagination
            count={maqTotalPages}
            page={maqCurrentPage}
            onChange={(e, page) => setMaqCurrentPage(page)}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

TablaPronostico.propTypes = {
    maquinarias : PropTypes.array.isRequired,
    searchTerm: PropTypes.string.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
    isReadOnly: PropTypes.bool.isRequired,
    pronosticos: PropTypes.array
};

TablaPronostico.defaultProps = {
    pronosticos: []
};

export default TablaPronostico;

