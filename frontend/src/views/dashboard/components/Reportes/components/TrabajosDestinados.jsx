import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableRow, Grid } from '@mui/material';

const TrabajosDestinados = ({ mantenimientos }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
        TRABAJOS DESTINADOS A REALIZAR
      </Typography>
      
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, bgcolor: '#eeeef0ff', color: 'black', p: 1 }}>
        {mantenimientos[0]?.trabajos_destinados_realizar || 'TRASLADO DE MATERIAL'}
      </Typography>
      
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          {/* Sistema de Combustible */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA DE COMBUSTIBLE</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GASOLINA</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina_cantidad_lt || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD FILTROS</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_filtros || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CODIGO FILTRO COMBUSTIBLE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.codigo_filtro_combustible || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {/* Otros Filtros */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS FILTROS</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cantidad || '1'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_numero || 'AB39-9601-AB'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cambio || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>DESCRIPCION DEL FILTRO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>FILTRO DE AIRE</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Box>
  );
};

TrabajosDestinados.propTypes = {
  mantenimientos: PropTypes.array,
};

export default TrabajosDestinados;