import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  Warning,
  CheckCircle,
  FileDownload,
  Search
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ReportesDashboard = ({ 
  maquinaria, 
  depreciaciones, 
  pronosticos, 
  control, 
  asignacion, 
  mantenimiento, 
  soat, 
  seguros, 
  itv, 
  impuestos,
  searched 
}) => {
  const dashboardData = useMemo(() => {
    if (!maquinaria) {
      return {
        totalRegistros: 0,
        totalSecciones: 0,
        seccionesConDatos: 0,
        seccionesSinDatos: 0,
        distribucionSecciones: [],
        resumen: {
          control: 0,
          asignacion: 0,
          mantenimiento: 0,
          soat: 0,
          seguros: 0,
          itv: 0,
          impuestos: 0,
          depreciaciones: 0,
          pronosticos: 0
        },
        estadoMaquinaria: 'sin_datos'
      };
    }

    // Análisis de datos
    const secciones = [
      { key: 'control', label: 'Control', data: control },
      { key: 'asignacion', label: 'Asignación', data: asignacion },
      { key: 'mantenimiento', label: 'Mantenimiento', data: mantenimiento },
      { key: 'soat', label: 'SOAT', data: soat },
      { key: 'seguros', label: 'Seguros', data: seguros },
      { key: 'itv', label: 'ITV', data: itv },
      { key: 'impuestos', label: 'Impuestos', data: impuestos },
      { key: 'depreciaciones', label: 'Depreciaciones', data: depreciaciones },
      { key: 'pronosticos', label: 'Pronósticos', data: pronosticos }
    ];

    const totalRegistros = secciones.reduce((total, seccion) => {
      return total + (Array.isArray(seccion.data) ? seccion.data.length : 0);
    }, 0);

    const seccionesConDatos = secciones.filter(s => Array.isArray(s.data) && s.data.length > 0).length;
    const seccionesSinDatos = secciones.length - seccionesConDatos;

    // Distribución por secciones
    const distribucionSecciones = secciones.map(seccion => ({
      name: seccion.label,
      value: Array.isArray(seccion.data) ? seccion.data.length : 0,
      color: Array.isArray(seccion.data) && seccion.data.length > 0 ? '#2e7d32' : '#d32f2f'
    }));

    // Resumen por sección
    const resumen = {
      control: Array.isArray(control) ? control.length : 0,
      asignacion: Array.isArray(asignacion) ? asignacion.length : 0,
      mantenimiento: Array.isArray(mantenimiento) ? mantenimiento.length : 0,
      soat: Array.isArray(soat) ? soat.length : 0,
      seguros: Array.isArray(seguros) ? seguros.length : 0,
      itv: Array.isArray(itv) ? itv.length : 0,
      impuestos: Array.isArray(impuestos) ? impuestos.length : 0,
      depreciaciones: Array.isArray(depreciaciones) ? depreciaciones.length : 0,
      pronosticos: Array.isArray(pronosticos) ? pronosticos.length : 0
    };

    // Estado de la maquinaria basado en datos disponibles
    let estadoMaquinaria = 'completa';
    if (seccionesConDatos < 3) {
      estadoMaquinaria = 'incompleta';
    } else if (seccionesConDatos < 6) {
      estadoMaquinaria = 'parcial';
    }

    return {
      totalRegistros,
      totalSecciones: secciones.length,
      seccionesConDatos,
      seccionesSinDatos,
      distribucionSecciones,
      resumen,
      estadoMaquinaria
    };
  }, [maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos]);

  const StatCard = ({ title, value, subtitle, color = 'primary.main', icon, variant = 'default' }) => (
    <Card sx={{ 
      height: '100%', 
      background: variant === 'outlined' 
        ? 'transparent' 
        : `linear-gradient(135deg, ${color}08, ${color}15)`,
      border: variant === 'outlined' 
        ? `2px solid ${color}` 
        : `1px solid ${color}20`,
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

  // PropTypes para StatCard
  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.element,
    variant: PropTypes.oneOf(['default', 'outlined'])
  };

  if (!searched) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2, textAlign: 'center' }}>
        <Search sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Dashboard de Reportes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Busca una maquinaria por placa, código o detalle para ver su dashboard de reportes
        </Typography>
        <Chip
          label="Ingresa los datos de búsqueda arriba"
          color="primary"
          variant="outlined"
          icon={<Search />}
        />
      </Paper>
    );
  }

  if (!maquinaria) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
            Buscando maquinaria...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        Dashboard de Reportes
      </Typography>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Registros"
            value={dashboardData.totalRegistros}
            subtitle="En todas las secciones"
            color="#1976d2"
            icon={<Assessment color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Secciones con Datos"
            value={dashboardData.seccionesConDatos}
            subtitle={`de ${dashboardData.totalSecciones} secciones`}
            color="#2e7d32"
            icon={<CheckCircle color="success" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Secciones Vacías"
            value={dashboardData.seccionesSinDatos}
            subtitle="Sin información"
            color="#ed6c02"
            icon={<Warning color="warning" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reporte"
            value="Listo"
            subtitle="Para exportar"
            color="#d32f2f"
            icon={<FileDownload color="error" />}
            variant="outlined"
          />
        </Grid>
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={2}>
        {/* Distribución por Secciones */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Distribución por Secciones
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.distribucionSecciones}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.distribucionSecciones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, 'Registros']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Registros por Sección */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Registros por Sección
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.distribucionSecciones}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [value, 'Registros']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#1976d2" 
                  radius={[4, 4, 0, 0]}
                  name="Registros"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// PropTypes para el componente principal
ReportesDashboard.propTypes = {
  maquinaria: PropTypes.object,
  depreciaciones: PropTypes.array,
  pronosticos: PropTypes.array,
  control: PropTypes.array,
  asignacion: PropTypes.array,
  mantenimiento: PropTypes.array,
  soat: PropTypes.array,
  seguros: PropTypes.array,
  itv: PropTypes.array,
  impuestos: PropTypes.array,
  searched: PropTypes.bool
};

export default ReportesDashboard; 