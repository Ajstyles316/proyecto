import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CardMedia } from '@mui/material';
import { formatDateOnly } from './helpers';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';

const HojaVidaMantenimiento = ({ maquinaria, mantenimientos }) => {

  if (!mantenimientos || mantenimientos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay registros de mantenimiento para generar la hoja de vida
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Contenido del Reporte */}
      <Box sx={{ backgroundColor: 'white' }}>
        {/* Header con Logo y Título */}
        <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #1e4db7', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Box sx={{ 
            width: 100, 
            height: 80, 
            mr: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid #1e4db7',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={logoCofa} 
              alt="Logo COFADENA"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e4db7', mb: 0.5 }}>
              MINISTERIO DE DEFENSA
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e4db7', mb: 0.5 }}>
              CORPORACIÓN DE LAS FF.AA. PARA EL DESARROLLO NACIONAL
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e4db7' }}>
              EMPRESA PÚBLICA NACIONAL ESTRATÉGICA
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Título Principal */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
          CÓDIGO: {maquinaria?.codigo || 'N/A'}
        </Typography>
      </Box>

      {/* Datos del Vehículo/Maquinaria */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
          DATOS VEHICULO, MAQUINARIA, EQUIPO
        </Typography>
        
        <Grid container spacing={2}>
          {/* Columna Izquierda - Imagen y Datos Generales */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#f5f5f5', p: 1 }}>
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
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA DELANTERA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_cantidad || '10'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Sistema Eléctrico */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA ELÉCTRICO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VOLTAJE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AMPERAJE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_sistema_electrico || '3'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.voltaje_sistema_electrico || '12'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.amperaje_sistema_electrico || '100'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.vida_util_sistema_electrico || 'AÑOS'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Aceites y Fluidos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
          ACEITES Y FLUIDOS
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {/* Aceite de Motor */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE MOTOR</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cantidad || '45 LT'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero || '15W40'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cambio_km_hr || '5000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero_filtro || 'P559000'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Aceite Hidráulico */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE HIDRAULICO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cantidad || '100'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero || 'ISO VG68'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '4000 H'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'P550388'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Aceite de Transmisión */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE TRANSMISION</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cantidad || '6LTS'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cambio_km_hr || '20.000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero_filtro || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Líquido de Freno */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LIQUIDO DE FRENO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO COMB.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cantidad || '20'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero || '80W90'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cambio_km_hr || '40000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero_filtro_combustible || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Líquido Refrigerante */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LIQUIDO REFRIGERANTE</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD REFRIGERANTE (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_tipo || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {/* Otros Aceites */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS ACEITES</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_tipo || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_frecuencia_cambio || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Trabajos a Destinados Realizar */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
          TRABAJOS A DESTINADOS REALIZAR
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#f5f5f5', p: 1 }}>
          TRASLADO DE MATERIAL
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {/* Sistema de Combustible */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA DE COMBUSTIBLE</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GASOLINA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD FILTROS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CODIGO FILTRO COMBUSTIBLE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_filtros || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.codigo_filtro_combustible || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Otros Filtros */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS FILTROS</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>DESCRIPCION DEL FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cantidad || '1'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_numero || 'AB39-9601-AB'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cambio || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>FILTRO DE AIRE</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Historial de Mantenimiento */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
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
              {mantenimientos.map((mantenimiento, index) => (
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      </Box> {/* Cierre del contenido del reporte */}
    </Box>
  );
};
HojaVidaMantenimiento.propTypes = {
  maquinaria: PropTypes.object,
  mantenimientos: PropTypes.array,
  control: PropTypes.array,
  asignacion: PropTypes.array,
  liberacion: PropTypes.array,
  seguros: PropTypes.array,
  itv: PropTypes.array,
  soat: PropTypes.array,
  impuestos: PropTypes.array,
  depreciaciones: PropTypes.array,
  pronosticos: PropTypes.array
};
export default HojaVidaMantenimiento;
