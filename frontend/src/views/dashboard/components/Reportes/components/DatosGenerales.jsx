import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableRow, Grid, CardMedia } from '@mui/material';

const DatosGenerales = ({ maquinaria, mantenimientos }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
        DATOS VEHICULO, MAQUINARIA, EQUIPO
      </Typography>
      
      <Grid container spacing={1}>
        {/* Columna Izquierda - Imagen y Datos Generales */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={1}>
            {/* Imagen */}
            <Grid item xs={12} md={6}>
              {maquinaria?.imagen && (
                <CardMedia
                  component="img"
                  image={maquinaria.imagen}
                  alt={`Imagen de ${maquinaria?.detalle || 'maquinaria'}`}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '2px solid #e0e0e0'
                  }}
                />
              )}
            </Grid>
            
            {/* Datos Generales */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#eeeef0ff', color: 'black', p: 1 }}>
                DATOS GENERALES
              </Typography>
              <Table size="small" sx={{ border: '1px solid #ddd' }}>
                <TableBody>
                  {maquinaria?.detalle && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Equipo:</TableCell>
                      <TableCell>{maquinaria.detalle}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.placa && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Placa:</TableCell>
                      <TableCell>{maquinaria.placa}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.marca && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Marca:</TableCell>
                      <TableCell>{maquinaria.marca}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.modelo && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Modelo:</TableCell>
                      <TableCell>{maquinaria.modelo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.nro_chasis && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Chasis:</TableCell>
                      <TableCell>{maquinaria.nro_chasis}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.tipo && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tipo:</TableCell>
                      <TableCell>{maquinaria.tipo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.color && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Color:</TableCell>
                      <TableCell>{maquinaria.color}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.tipo_vehiculo && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tracción:</TableCell>
                      <TableCell>{maquinaria.tipo_vehiculo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.nro_motor && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>No. del Motor:</TableCell>
                      <TableCell>{maquinaria.nro_motor}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Estado:</TableCell>
                    <TableCell>OPERABLE</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </Grid>

        {/* Columna Derecha - Datos Técnicos */}
        <Grid item xs={12} md={6}>
          {/* Tipo de Desplazamiento */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>TIPO DE DESPLAZAMIENTO</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_cantidad || '10'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA DELANTERA</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Sistema Eléctrico */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA ELÉCTRICO</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_sistema_electrico || '1'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VOLTAJE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.voltaje_sistema_electrico || '12V'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AMPERAJE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.amperaje_sistema_electrico || '100A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.vida_util_sistema_electrico || '5 años'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Box>
  );
};

DatosGenerales.propTypes = {
  maquinaria: PropTypes.object,
  mantenimientos: PropTypes.array,
};

export default DatosGenerales;
