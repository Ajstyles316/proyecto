import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableRow, Grid } from '@mui/material';

const AceitesFluidos = ({ mantenimientos }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
        ACEITES Y FLUIDOS
      </Typography>
      
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          {/* Aceite de Motor */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE MOTOR</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cantidad || '45 LT'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero || '15W40'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cambio_km_hr || '5000 KM'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero_filtro || 'P559000'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Aceite Hidráulico */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE HIDRÁULICO</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cantidad || '30 LT'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero || 'AW46'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '2000 HR'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'HF6167'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Líquido de Freno */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LÍQUIDO DE FRENO</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cantidad || '20'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero || '80W90'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cambio_km_hr || '40000 KM'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO COMB.</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero_filtro_combustible || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Líquido Refrigerante */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LÍQUIDO REFRIGERANTE</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_tipo || 'Anticongelante'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '20 LT'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '2 años'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          {/* Otros Aceites */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS ACEITES</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_tipo || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_cantidad_lt || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_frecuencia_cambio || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Aceite de Transmisión */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE TRANSMISIÓN</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cantidad || '15 LT'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero || '80W90'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cambio_km_hr || '50000 KM'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero_filtro || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Box>
  );
};

AceitesFluidos.propTypes = {
  mantenimientos: PropTypes.array,
};

export default AceitesFluidos;
