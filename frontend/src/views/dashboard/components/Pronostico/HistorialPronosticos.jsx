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
import EventIcon from "@mui/icons-material/Event";
import Popover from "@mui/material/Popover";
import { useState } from "react";
import PropTypes from "prop-types";
const HistorialPronosticos = ({ data, onRecomendacionClick }) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [anchorFechas, setAnchorFechas] = useState(null);
  const [fechasPopover, setFechasPopover] = useState([]);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginated = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handleOpenFechasPopover = (event, fechas) => {
    setAnchorFechas(event.currentTarget);
    setFechasPopover(fechas);
  };

  const handleCloseFechasPopover = () => {
    setAnchorFechas(null);
    setFechasPopover([]);
  };

  const openFechasPopover = Boolean(anchorFechas);

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
              <TableCell align="center">Horas Operación</TableCell>
              <TableCell align="center">Recorrido</TableCell>
              <TableCell align="center">Tipo de Mantenimiento</TableCell>
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
                <TableCell align="center">{item.resultado || "-"}</TableCell>
                <TableCell align="center">
                  <span>
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
                    <IconButton
                      size="small"
                      color="primary"
                      style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      onClick={e => handleOpenFechasPopover(e, Array.isArray(item.fechas_futuras) ? item.fechas_futuras : [])}
                      disabled={!item.fechas_futuras || item.fechas_futuras.length === 0}
                    >
                      <EventIcon />
                    </IconButton>
                  </span>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => onRecomendacionClick(e, Array.isArray(item.recomendaciones) && item.recomendaciones.length > 0 ? item.recomendaciones : ["No hay recomendaciones generadas."])}
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
      <Popover
        open={openFechasPopover}
        anchorEl={anchorFechas}
        onClose={handleCloseFechasPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={2} maxWidth={300}>
          <Typography variant="subtitle1" color="primary" mb={1}>Fechas Futuras</Typography>
          {fechasPopover.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {fechasPopover.map((fecha, idx) => (
                <li key={idx}>{fecha}</li>
              ))}
            </ul>
          ) : (
            <Typography color="text.secondary">No hay fechas futuras generadas.</Typography>
          )}
        </Box>
      </Popover>
    </>
  );
};
HistorialPronosticos.propTypes = {
  data: PropTypes.array.isRequired,
  onRecomendacionClick: PropTypes.func.isRequired,
};
export default HistorialPronosticos;