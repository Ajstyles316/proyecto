import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

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

const ActivosDashboard = ({ activos }) => {
  const [sortOrder, setSortOrder] = useState('descendente');

  // Análisis de datos
  const dashboardData = useMemo(() => {
    if (!Array.isArray(activos) || activos.length === 0) {
      return {
        totalActivos: 0,
        vidaUtilData: [],
        resumen: {
          promedioVidaUtil: 0,
          activosEnRiesgo: 0,
          totalBienes: 0
        }
      };
    }

    // Análisis por vida útil
    const vidaUtilCount = {};
    let totalVidaUtil = 0;
    let activosEnRiesgo = 0;

    // Análisis por bien de uso
    const bienesUsoCount = {};

    activos.forEach(activo => {
      const vidaUtil = activo.vida_util || 0;
      const bienUso = activo.bien_uso || 'Sin clasificar';

      // Contar vida útil
      vidaUtilCount[vidaUtil] = (vidaUtilCount[vidaUtil] || 0) + 1;
      totalVidaUtil += vidaUtil;

      // Contar bienes de uso
      bienesUsoCount[bienUso] = (bienesUsoCount[bienUso] || 0) + 1;

      // Contar activos en riesgo (vida útil > 8 años)
      if (vidaUtil > 8) {
        activosEnRiesgo++;
      }
    });

    // Preparar datos para gráficas
    const vidaUtilData = Object.entries(vidaUtilCount)
      .map(([anios, cantidad]) => ({ 
        anios: parseInt(anios), 
        cantidad,
        porcentaje: (cantidad / activos.length) * 100
      }))
      .sort((a, b) => sortOrder === 'ascendente' ? a.anios - b.anios : b.anios - a.anios);

    const promedioVidaUtil = totalVidaUtil / activos.length;

    return {
      totalActivos: activos.length,
      vidaUtilData,
      resumen: {
        promedioVidaUtil: promedioVidaUtil.toFixed(1),
        activosEnRiesgo,
        totalBienes: Object.keys(bienesUsoCount).length
      }
    };
  }, [activos, sortOrder]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Tarjetas de estadísticas mejoradas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Activos"
            value={dashboardData.totalActivos}
            subtitle="Activos registrados en el sistema"
            color="#1976d2"
            icon={<Info color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vida Útil Promedio"
            value={`${dashboardData.resumen.promedioVidaUtil} años`}
            subtitle="Promedio general de vida útil"
            color="#2e7d32"
            icon={<TrendingUp color="success" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En Riesgo"
            value={dashboardData.resumen.activosEnRiesgo}
            subtitle="Vida útil > 8 años"
            color="#ed6c02"
            icon={<Warning color="warning" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categorías"
            value={dashboardData.resumen.totalBienes}
            subtitle="Tipos de bienes diferentes"
            color="#9c27b0"
            icon={<CheckCircle color="secondary" />}
          />
        </Grid>
      </Grid>

      {/* Gráfica de Vida Útil mejorada */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Distribución por Vida Útil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Análisis de la distribución de activos según su vida útil
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Orden</InputLabel>
            <Select
              value={sortOrder}
              label="Orden"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="ascendente">Ascendente</MenuItem>
              <MenuItem value="descendente">Descendente</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.vidaUtilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="anios" 
                tick={{ fontSize: 12, fontWeight: 600 }}
                label={{ value: 'Años de Vida Útil', position: 'insideBottom', offset: -5, style: { fontWeight: 600 } }}
              />
              <YAxis 
                tick={{ fontSize: 12, fontWeight: 600 }}
                label={{ value: 'Cantidad de Activos', angle: -90, position: 'insideLeft', style: { fontWeight: 600 } }}
              />
              <Tooltip 
                formatter={(value, name) => [value, 'Activos']}
                labelFormatter={(label) => `${label} años`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '2px solid #1976d2',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  fontWeight: 600
                }}
              />
              <Bar 
                dataKey="cantidad" 
                fill="url(#colorGradient)"
                radius={[6, 6, 0, 0]}
                name="Activos"
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976d2" />
                  <stop offset="100%" stopColor="#42a5f5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Resumen de categorías */}
      {dashboardData.resumen.totalBienes > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
            Resumen de Categorías
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`${dashboardData.totalActivos} Activos Totales`} 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`${dashboardData.resumen.activosEnRiesgo} En Riesgo`} 
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`${dashboardData.resumen.totalBienes} Categorías`} 
              color="secondary" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`${dashboardData.resumen.promedioVidaUtil} años promedio`} 
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// PropTypes para el componente principal
ActivosDashboard.propTypes = {
  activos: PropTypes.arrayOf(
    PropTypes.shape({
      vida_util: PropTypes.number,
      bien_uso: PropTypes.string,
      _id: PropTypes.string
    })
  ).isRequired
};

// PropTypes para el componente StatCard
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  color: PropTypes.string,
  icon: PropTypes.element
};

export default ActivosDashboard; 