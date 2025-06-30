import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  IconButton
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useState } from "react";
import PropTypes from "prop-types";
const HistorialPronosticos = ({ data, onRecomendacionClick }) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginated = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  return (
    <>
      <Typography variant="h6" mt={4} mb={2} align="center">
        Historial de Pronósticos
      </Typography>
      <Box width="100%" maxWidth={1100}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <TextField
            select
            label="Mostrar"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            size="small"
            sx={{ width: 180 }}
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
          </TextField>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Placa</TableCell>
              <TableCell align="center">Fecha Asignación</TableCell>
              <TableCell align="center">Horas Op.</TableCell>
              <TableCell align="center">Recorrido</TableCell>
              <TableCell align="center">Riesgo</TableCell>
              <TableCell align="center">Resultado</TableCell>
              <TableCell align="center">Fecha de Mantenimiento Programada</TableCell>
              <TableCell align="center">Recomendaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((item, idx) => (
              <TableRow key={item._id || idx}>
                <TableCell align="center">{item.placa}</TableCell>
                <TableCell align="center">
                  {item.fecha_asig ? String(item.fecha_asig).split("T")[0] : "-"}
                </TableCell>
                <TableCell align="center">{item.horas_op}</TableCell>
                <TableCell align="center">{item.recorrido}</TableCell>
                <TableCell align="center">{item.riesgo || "-"}</TableCell>
                <TableCell align="center">{item.resultado || "-"}</TableCell>
                <TableCell align="center">
                  {item.fecha_sugerida
                    ? item.fecha_sugerida
                    : (() => {
                        try {
                          const base = item.fecha_asig;
                          if (!base) return "No disponible";
                          const d = new Date(base);
                          d.setDate(d.getDate() + 180);
                          return d.toISOString().split("T")[0];
                        } catch {
                          return "No disponible";
                        }
                      })()}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => onRecomendacionClick(e, item.resultado)}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, p) => setPage(p)}
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>
    </>
  );
};
HistorialPronosticos.propTypes = {
  data: PropTypes.array.isRequired,
  onRecomendacionClick: PropTypes.func.isRequired,
};
export default HistorialPronosticos;