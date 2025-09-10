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
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%', height: '60px', verticalAlign: 'middle' }}>Equipo:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.detalle}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.placa && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Placa:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.placa}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.marca && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Marca:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.marca}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.modelo && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Modelo:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.modelo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.nro_chasis && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Chasis:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.nro_chasis}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.tipo && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Tipo:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.tipo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.color && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Color:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.color}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.tipo_vehiculo && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Tracción:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.tipo_vehiculo}</TableCell>
                    </TableRow>
                  )}
                  {maquinaria?.nro_motor && (
                    <TableRow sx={{ height: '60px' }}>
                      <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>No. del Motor:</TableCell>
                      <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>{maquinaria.nro_motor}</TableCell>
                    </TableRow>
                  )}
                  <TableRow sx={{ height: '60px' }}>
                    <TableCell sx={{ fontWeight: 'bold', height: '60px', verticalAlign: 'middle' }}>Estado:</TableCell>
                    <TableCell sx={{ height: '60px', verticalAlign: 'middle' }}>OPERABLE</TableCell>
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
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.tipo_desplazamiento_cantidad || '10'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>NUMERO DE LLANTA</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>NUMERO DE LLANTA DELANTERA</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>VIDA UTIL</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Sistema Eléctrico */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA ELÉCTRICO</Typography>
          <Table size="small" sx={{ border: '1px solid #ddd', mb: 1 }}>
            <TableBody>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>CANTIDAD</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.cantidad_sistema_electrico || '1'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>VOLTAJE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.voltaje_sistema_electrico || '12V'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>AMPERAJE</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.amperaje_sistema_electrico || '100A'}</TableCell>
              </TableRow>
              <TableRow sx={{ height: '60px' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>VIDA UTIL</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', height: '60px', verticalAlign: 'middle' }}>{mantenimientos[0]?.vida_util_sistema_electrico || '5 años'}</TableCell>
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