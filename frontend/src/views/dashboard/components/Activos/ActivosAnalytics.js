import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Stack
} from '@mui/material';

const ActivosAnalytics = ({ activos }) => {
  const analytics = useMemo(() => {
    if (!Array.isArray(activos) || activos.length === 0) {
      return {
        totalActivos: 0,
        promedioVidaUtil: 0,
        activosEnRiesgo: 0,
        distribucionVidaUtil: [],
        resumen: {
          vidaUtilOptima: 0,
          vidaUtilAlta: 0
        }
      };
    }

    // Análisis básico
    let totalVidaUtil = 0;
    let activosEnRiesgo = 0;
    let vidaUtilOptima = 0;
    let vidaUtilAlta = 0;
    
    const vidaUtilCount = {};

    activos.forEach(activo => {
      const vidaUtil = activo.vida_util || 0;

      // Acumular vida útil
      totalVidaUtil += vidaUtil;
      vidaUtilCount[vidaUtil] = (vidaUtilCount[vidaUtil] || 0) + 1;

      // Clasificar por vida útil
      if (vidaUtil <= 5) {
        vidaUtilOptima++;
      } else if (vidaUtil > 8) {
        vidaUtilAlta++;
        activosEnRiesgo++;
      }
    });

    const promedioVidaUtil = totalVidaUtil / activos.length;

    // Distribución de vida útil
    const distribucionVidaUtil = Object.entries(vidaUtilCount)
      .map(([anios, cantidad]) => ({
        anios: parseInt(anios),
        cantidad,
        porcentaje: (cantidad / activos.length) * 100
      }))
      .sort((a, b) => a.anios - b.anios);

    return {
      totalActivos: activos.length,
      promedioVidaUtil: promedioVidaUtil.toFixed(1),
      activosEnRiesgo,
      distribucionVidaUtil,
      resumen: {
        vidaUtilOptima,
        vidaUtilAlta
      }
    };
  }, [activos]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        Análisis de Vida Útil
      </Typography>

      {/* Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {analytics.totalActivos}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Total Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {analytics.promedioVidaUtil}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Años Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {analytics.activosEnRiesgo}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                En Riesgo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Distribución de Vida Útil */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
          Distribución por Vida Útil
        </Typography>
        <Box sx={{ height: 400, overflowY: 'auto' }}>
          <Stack spacing={2}>
            {analytics.distribucionVidaUtil.map((item) => (
              <Box key={item.anios}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.anios} años
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.cantidad} activos ({item.porcentaje.toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.porcentaje} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.anios > 8 ? 'warning.main' : 
                              item.anios <= 5 ? 'success.main' : 'primary.main'
                    }
                  }} 
                />
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ActivosAnalytics; 