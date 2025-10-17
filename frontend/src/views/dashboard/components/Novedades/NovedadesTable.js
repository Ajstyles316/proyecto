import PropTypes from 'prop-types';
import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

// intenta formatear "YYYY-MM-DD"
const fmtDate = (any) => {
  if (!any) return '';
  try {
    // casos: string ISO, string "YYYY-MM-DD", objeto { $date: ... }, etc.
    let d = any;
    if (typeof any === 'object') {
      d = any.$date || any.date || any.iso || any.toString?.();
    }
    const dt = new Date(d);
    if (isNaN(dt)) return String(any);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear());
    return `${dd}/${mm}/${yy}`;
  } catch {
    return String(any);
  }
};

const NovedadesTable = ({ rows }) => {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{
        minWidth: 900,
        '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)', verticalAlign: 'top' },
        '& .MuiTableHead-root .MuiTableCell-root': { borderBottom: '2px solid rgba(224,224,224,1)', fontWeight: 700 }
      }}>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Placa</TableCell>
            <TableCell>Descripción Equipo / Vehículo</TableCell>
            <TableCell>Evento (Despliegue/ Siniestro/ Movimiento/ otro)</TableCell>
            <TableCell>Ubicación / Destino</TableCell>
            <TableCell>Observaciones</TableCell>
            <TableCell>Unidad / Empresa</TableCell>
            <TableCell>Autorizado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(!rows || rows.length === 0) ? (
            <TableRow>
              <TableCell colSpan={9} align="center">Sin registros</TableCell>
            </TableRow>
          ) : rows.map((r) => {
            const fecha = r.fecha || r.fecha_creacion || r.fecha_registro || r.created_at;
            const placa = r.placa ?? '';
            // En tu payload: "descripcion" venía del equipo; "evento" es el detalle del suceso.
            const descEquipo = r.descripcion || r.descripcion_equipo || r.detalle_equipo || '';
            const evento = r.evento || r.detalle || r.descripcion_evento || ''; // fallback si tu backend lo llama distinto
            const ubicacion = r.ubicacion || r.destino || r.ubicacion_destino || '';
            const observ = r.observaciones || '';
            const unidad = r.unidad || '';
            const autorizado = r.autorizado_por || r.autorizado || r.registrado_por || '';

            return (
              <TableRow key={r._id?.$oid || r._id || Math.random()}>
                <TableCell>{fmtDate(fecha)}</TableCell>
                <TableCell>{placa}</TableCell>
                <TableCell>{descEquipo}</TableCell>
                <TableCell>{evento}</TableCell>
                <TableCell>{ubicacion}</TableCell>
                <TableCell>{observ}</TableCell>
                <TableCell>{unidad}</TableCell>
                <TableCell>{autorizado}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

NovedadesTable.propTypes = {
  rows: PropTypes.array.isRequired
};

export default NovedadesTable;
