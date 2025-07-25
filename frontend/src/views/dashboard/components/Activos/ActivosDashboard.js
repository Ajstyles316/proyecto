import React, { useState, useMemo } from 'react';
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

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1'];

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

  return (
    <Box sx={{ p: 2 }}>
      {/* Tarjetas de estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total de Activos"
            value={dashboardData.totalActivos}
            subtitle="Activos registrados"
            color="#1976d2"
            icon={<Info color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Vida Útil Promedio"
            value={`${dashboardData.resumen.promedioVidaUtil} años`}
            subtitle="Promedio general"
            color="#2e7d32"
            icon={<TrendingUp color="success" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="En Riesgo"
            value={dashboardData.resumen.activosEnRiesgo}
            subtitle="Vida útil > 8 años"
            color="#ed6c02"
            icon={<Warning color="warning" />}
          />
        </Grid>
      </Grid>

      {/* Gráfica de Vida Útil */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Distribución por Vida Útil
          </Typography>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="anios" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Años de Vida Útil', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Cantidad de Activos', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, 'Activos']}
                labelFormatter={(label) => `${label} años`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar 
                dataKey="cantidad" 
                fill="#1976d2" 
                radius={[4, 4, 0, 0]}
                name="Activos"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default ActivosDashboard; 