import { Grid, Box, CircularProgress, Typography } from "@mui/material";
import PageContainer from "src/components/container/PageContainer";
import { useEffect, useState } from "react";
import PronosticoChart from './components/PronosticoChart';
import StatCard from "./components/StatCard";
import ActivosMain from "./components/Activos/ActivosMain";

// Mapeo de iconos más representativos
const iconMap = {
  "Total de Maquinarias": "mdi:tractor",
  "Total de Seguros": "mdi:shield-check",
  "Seguros Próximos a Vencer": "mdi:calendar-alert",
  "Mantenimientos Pendientes": "mdi:wrench",
  "Mantenimientos Este Mes": "mdi:calendar-check",
  "Unidades en Control": "mdi:clipboard-list",
  "Horas Totales Operativas": "mdi:clock-time-eight",
  "Depreciación Total Acumulada": "mdi:cash-multiple",
  "Próximos Mantenimientos": "mdi:robot",
};

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/api/dashboard/");
        if (!res.ok) throw new Error("Error al obtener estadísticas del dashboard");
        const data = await res.json();
        setStats(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Filtrar solo las tarjetas con valor distinto de 0 o '0'
  const filteredStats = stats.filter(
    (stat) => {
      // Considera 0, '0', '0.00', '0,00', etc. como cero
      const value = typeof stat.value === 'string' ? stat.value.replace(/[,]/g, '') : stat.value;
      return !(value === 0 || value === '0' || value === '0.00' || value === '0,00');
    }
  );

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        {/* Sección de Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Grid>
          ) : error ? (
            <Grid item xs={12} sx={{ textAlign: "center", py: 5 }}>
              <Typography color="error">{error}</Typography>
            </Grid>
          ) : filteredStats.length === 0 ? (
            <Grid item xs={12} sx={{ textAlign: "center", py: 5 }}>
              <Typography>No hay estadísticas disponibles</Typography>
            </Grid>
          ) : (
            filteredStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={iconMap[stat.title] || stat.icon}
                  color={stat.color}
                />
              </Grid>
            ))
          )}
        </Grid>

        {/* Gráficos y otros componentes */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <PronosticoChart />
          </Grid>
          <Grid item xs={12} lg={7}>
            <ActivosMain />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;