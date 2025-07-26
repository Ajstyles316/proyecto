import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Analytics
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Componente StatCard definido fuera del componente principal
const StatCard = ({ title, value, subtitle, color = 'primary.main', icon }) => (
  <Card sx={{ 
    height: '100%', 
    background: `linear-gradient(135deg, ${color}08, ${color}15)`,
    border: `1px solid ${color}20`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${color}20`
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color, ml: 1 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Componente RegresionCard definido fuera del componente principal
const RegresionCard = ({ tipo, regresion, color }) => (
  <Card sx={{ p: 2, height: '100%', border: `1px solid ${color}30` }}>
    <Typography variant="h6" sx={{ mb: 2, color, fontWeight: 600 }}>
      Regresión {tipo}
    </Typography>
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">Pendiente:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {regresion.pendiente.toFixed(3)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">Intercepto:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {regresion.intercepto.toFixed(1)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">R²:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {(regresion.r2 * 100).toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={regresion.r2 * 100} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: `${color}20`,
          '& .MuiLinearProgress-bar': {
            bgcolor: color
          }
        }} 
      />
    </Stack>
  </Card>
);

const PronosticoDashboard = ({ pronosticos, maquinarias }) => {
  const dashboardData = useMemo(() => {
    if (!Array.isArray(pronosticos) || pronosticos.length === 0) {
      return {
        totalPronosticos: 0,
        mantenimientosPreventivos: [],
        mantenimientosCorrectivos: [],
        tendencias: {
          preventivo: { pendiente: 0, intercepto: 0, r2: 0 },
          correctivo: { pendiente: 0, intercepto: 0, r2: 0 }
        },
        estadisticas: {
          totalPreventivos: 0,
          totalCorrectivos: 0,
          promedioHorasPreventivo: 0,
          promedioHorasCorrectivo: 0,
          proximosMantenimientos: 0
        }
      };
    }

    // Separar mantenimientos preventivos y correctivos
    const preventivos = pronosticos.filter(p => 
      p.resultado?.toLowerCase().includes('preventivo')
    );
    const correctivos = pronosticos.filter(p => 
      p.resultado?.toLowerCase().includes('correctivo')
    );

    // Función para calcular regresión lineal
    const calcularRegresion = (datos) => {
      if (datos.length < 2) return { pendiente: 0, intercepto: 0, r2: 0 };

      const n = datos.length;
      const sumX = datos.reduce((sum, _, i) => sum + i, 0);
      const sumY = datos.reduce((sum, d) => sum + (d.horas_op || 0), 0);
      const sumXY = datos.reduce((sum, d, i) => sum + (i * (d.horas_op || 0)), 0);
      const sumX2 = datos.reduce((sum, _, i) => sum + (i * i), 0);


      const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercepto = (sumY - pendiente * sumX) / n;

      // Calcular R²
      const yPromedio = sumY / n;
      const ssRes = datos.reduce((sum, d, i) => {
        const yPred = pendiente * i + intercepto;
        return sum + Math.pow((d.horas_op || 0) - yPred, 2);
      }, 0);
      const ssTot = datos.reduce((sum, d) => {
        return sum + Math.pow((d.horas_op || 0) - yPromedio, 2);
      }, 0);
      const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

      return { pendiente, intercepto, r2 };
    };

    // Preparar datos para gráficas de tendencia
    const prepararDatosTendencia = (datos, tipo) => {
      return datos.map((d, index) => ({
        index,
        horas: d.horas_op || 0,
        recorrido: d.recorrido || 0,
        tipo,
        fecha: d.fecha_asig ? new Date(d.fecha_asig).toLocaleDateString() : `M${index + 1}`
      }));
    };

    // Calcular regresiones
    const regresionPreventivo = calcularRegresion(preventivos);
    const regresionCorrectivo = calcularRegresion(correctivos);

    // Generar datos de predicción para las líneas de tendencia
    const generarPrediccion = (regresion, n) => {
      return Array.from({ length: n }, (_, i) => ({
        index: i,
        prediccion: regresion.pendiente * i + regresion.intercepto
      }));
    };

    const datosPreventivos = prepararDatosTendencia(preventivos, 'Preventivo');
    const datosCorrectivos = prepararDatosTendencia(correctivos, 'Correctivo');
    const prediccionPreventivo = generarPrediccion(regresionPreventivo, Math.max(10, preventivos.length));
    const prediccionCorrectivo = generarPrediccion(regresionCorrectivo, Math.max(10, correctivos.length));

    // Calcular estadísticas
    const promedioHorasPreventivo = preventivos.length > 0 
      ? preventivos.reduce((sum, p) => sum + (p.horas_op || 0), 0) / preventivos.length 
      : 0;
    const promedioHorasCorrectivo = correctivos.length > 0 
      ? correctivos.reduce((sum, p) => sum + (p.horas_op || 0), 0) / correctivos.length 
      : 0;

    // Contar próximos mantenimientos
    const proximosMantenimientos = pronosticos.filter(p => {
      if (!p.fecha_sugerida) return false;
      const fechaMantenimiento = new Date(p.fecha_sugerida);
      const hoy = new Date();
      const diffTime = fechaMantenimiento - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    return {
      totalPronosticos: pronosticos.length,
      mantenimientosPreventivos: datosPreventivos,
      mantenimientosCorrectivos: datosCorrectivos,
      prediccionPreventivo,
      prediccionCorrectivo,
      tendencias: {
        preventivo: regresionPreventivo,
        correctivo: regresionCorrectivo
      },
      estadisticas: {
        totalPreventivos: preventivos.length,
        totalCorrectivos: correctivos.length,
        promedioHorasPreventivo: promedioHorasPreventivo.toFixed(1),
        promedioHorasCorrectivo: promedioHorasCorrectivo.toFixed(1),
        proximosMantenimientos
      }
    };
  }, [pronosticos]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        Análisis de Regresión - Mantenimientos
      </Typography>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Mantenimientos Preventivos"
            value={dashboardData.estadisticas.totalPreventivos}
            subtitle={`Promedio: ${dashboardData.estadisticas.promedioHorasPreventivo} horas`}
            color="#2e7d32"
            icon={<CheckCircle color="success" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Mantenimientos Correctivos"
            value={dashboardData.estadisticas.totalCorrectivos}
            subtitle={`Promedio: ${dashboardData.estadisticas.promedioHorasCorrectivo} horas`}
            color="#d32f2f"
            icon={<Warning color="error" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Pronósticos"
            value={dashboardData.totalPronosticos}
            subtitle="Análisis realizados"
            color="#1976d2"
            icon={<Analytics color="primary" />}
          />
        </Grid>
      </Grid>

      {/* Análisis de Regresión */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <RegresionCard 
            tipo="Preventivo" 
            regresion={dashboardData.tendencias.preventivo} 
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RegresionCard 
            tipo="Correctivo" 
            regresion={dashboardData.tendencias.correctivo} 
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      {/* Gráficas de Regresión */}
      <Grid container spacing={2}>
        {/* Regresión Preventivo */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32' }}>
              Regresión Lineal - Mantenimiento Preventivo
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.mantenimientosPreventivos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'horas' ? 'Horas Operación' : 'Recorrido']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#2e7d32" 
                  strokeWidth={2}
                  dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
                  name="Horas Operación"
                />
                <Line 
                  type="monotone" 
                  dataKey="recorrido" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                  name="Recorrido"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Regresión Correctivo */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#d32f2f' }}>
              Regresión Lineal - Mantenimiento Correctivo
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.mantenimientosCorrectivos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'horas' ? 'Horas Operación' : 'Recorrido']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#d32f2f" 
                  strokeWidth={2}
                  dot={{ fill: '#d32f2f', strokeWidth: 2, r: 4 }}
                  name="Horas Operación"
                />
                <Line 
                  type="monotone" 
                  dataKey="recorrido" 
                  stroke="#ff9800" 
                  strokeWidth={2}
                  dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                  name="Recorrido"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// PropTypes para el componente principal
PronosticoDashboard.propTypes = {
  pronosticos: PropTypes.arrayOf(
    PropTypes.shape({
      resultado: PropTypes.string,
      horas_op: PropTypes.number,
      recorrido: PropTypes.number,
      fecha_asig: PropTypes.string
    })
  ).isRequired,
  maquinarias: PropTypes.array.isRequired
};

// PropTypes para el componente StatCard
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  color: PropTypes.string,
  icon: PropTypes.element
};

// PropTypes para el componente RegresionCard
RegresionCard.propTypes = {
  tipo: PropTypes.string.isRequired,
  regresion: PropTypes.shape({
    pendiente: PropTypes.number.isRequired,
    intercepto: PropTypes.number.isRequired,
    r2: PropTypes.number.isRequired
  }).isRequired,
  color: PropTypes.string.isRequired
};

export default PronosticoDashboard; 