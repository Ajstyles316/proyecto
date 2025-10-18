import PropTypes from 'prop-types';
import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

// Formatea a "DD/MM/YYYY" evitando desfase por zona horaria
const fmtDate = (any) => {
  if (!any) return '';
  try {
    let s = any;
    if (typeof any === 'object') {
      s = any.$date ?? any.date ?? any.iso ?? any.toString?.() ?? '';
    }
    if (typeof s !== 'string') s = String(s);

    // Caso 1: "YYYY-MM-DD" (fecha pura). No usar new Date() para no desplazar.
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }

    // Caso 2: ISO con Z (UTC). Usar getters UTC para congelar día/mes/año.
    if (s.includes('Z')) {
      const dt = new Date(s);
      if (!isNaN(dt)) {
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(dt.getUTCFullYear());
        return `${dd}/${mm}/${yy}`;
      }
    }

    // Caso 3: epoch en ms
    if (/^\d{13}$/.test(s)) {
      const dt = new Date(Number(s));
      if (!isNaN(dt)) {
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yy = String(dt.getFullYear());
        return `${dd}/${mm}/${yy}`;
      }
    }

    // Fallback: parse local
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yy = String(dt.getFullYear());
      return `${dd}/${mm}/${yy}`;
    }
    return String(any);
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
            const descEquipo = r.descripcion || r.descripcion_equipo || r.detalle_equipo || '';
            const evento = r.evento || r.detalle || r.descripcion_evento || '';
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
