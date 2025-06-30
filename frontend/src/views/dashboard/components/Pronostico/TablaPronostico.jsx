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
} from "@mui/material";
import { useState } from "react";
import PropTypes from "prop-types";

const TablaPronostico = ({ maquinarias, searchTerm, setSearchTerm, openModal }) => {
  const [maqCurrentPage, setMaqCurrentPage] = useState(1);
  const [maqRowsPerPage, setMaqRowsPerPage] = useState(10);

  const filteredMaquinarias = maquinarias.filter((maq) =>
    maq.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maqTotalPages = Math.ceil(filteredMaquinarias.length / maqRowsPerPage);
  const paginatedMaquinarias = filteredMaquinarias.slice(
    (maqCurrentPage - 1) * maqRowsPerPage,
    maqCurrentPage * maqRowsPerPage
  );

  const handleMaqRowsPerPageChange = (e) => {
    setMaqRowsPerPage(parseInt(e.target.value, 10));
    setMaqCurrentPage(1);
  };

  return (
    <>
      <Typography variant="h5" mb={2} fontWeight={600}>Pronóstico de Mantenimiento</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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

      <Table sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell><b>N°</b></TableCell>
            <TableCell><b>Placa</b></TableCell>
            <TableCell><b>Detalle</b></TableCell>
            <TableCell><b>Acción</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaquinarias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">No hay maquinarias registradas</TableCell>
            </TableRow>
          ) : (
            paginatedMaquinarias.map((m, idx) => (
              <TableRow key={m._id?.$oid || m._id}>
                <TableCell>{(maqCurrentPage - 1) * maqRowsPerPage + idx + 1}</TableCell>
                <TableCell>{m.placa || '-'}</TableCell>
                <TableCell>{m.detalle || '-'}</TableCell>
                <TableCell>
                  <Button variant="contained" color="primary" onClick={() => openModal(m)}>
                    Generar Pronóstico
                  </Button>
                </TableCell>
              </TableRow>
            ))
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
};
export default TablaPronostico;
