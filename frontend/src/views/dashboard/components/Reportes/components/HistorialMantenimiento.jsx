import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { formatDateOnly } from '../helpers';

const HistorialMantenimiento = ({ mantenimientos }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
        HISTORIAL DE MANTENIMIENTO
      </Typography>
      
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>N° SALIDA DE MATERIALES</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>COSTO TOTAL Bs.</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>HOR/KM.</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>OPERADOR</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ATENDIDO POR</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ENCARGADO DE ACTIVOS FIJOS</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UNIDAD/ EMPRESA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UBICACIÓN FISICO/ PROYECTO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mantenimientos && mantenimientos.length > 0 ? (
              mantenimientos.map((mantenimiento, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f9f9f9' } }}>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(mantenimiento.fecha_mantenimiento)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.numero_salida_materiales || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, fontSize: '0.75rem', border: '1px solid #ddd' }}>
                    {mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                    {mantenimiento.costo_total ? `${mantenimiento.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.horas_kilometros ? mantenimiento.horas_kilometros.toLocaleString('es-BO') : '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.operador || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.atendido_por || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.encargado_activos_fijos || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.unidad_empresa || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.ubicacion_fisico_proyecto || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

HistorialMantenimiento.propTypes = {
  mantenimientos: PropTypes.array,
};

export default HistorialMantenimiento;
