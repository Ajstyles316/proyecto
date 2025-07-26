import { Grid, Box, CircularProgress, Typography } from "@mui/material";
import PageContainer from "src/components/container/PageContainer";
import { useEffect, useState } from "react";
import PronosticoChart from './components/PronosticoChart';
import StatCard from "./components/StatCard";
import RegistroActividadMain from "./components/RegistroActividad/RegistroActividadMain";
import ActivosDashboardSimple from "./components/Activos/ActivosDashboardSimple";
import { useUser } from "src/components/UserContext";

// Mapeo de iconos más representativos
const iconMap = {
  "Total de Maquinarias": "mdi:tractor",
  "Horas Totales Operativas": "mdi:clock-time-eight",
  "Depreciación Total Acumulada": "mdi:cash-multiple",
  "Próximos Mantenimientos": "mdi:robot",
};

const Dashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determinar si el usuario es admin/encargado o técnico
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'encargado' || user?.Cargo?.toLowerCase() === 'admin';
  const isTecnico = user?.Cargo?.toLowerCase() === 'técnico' || user?.Cargo?.toLowerCase() === 'tecnico';

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

  // Filtrar solo las tarjetas con valor distinto de 0 o '0' y quitar 'Total de Seguros' y 'Unidades en Control'
  const filteredStats = stats.filter(
    (stat) => {
      // Considera 0, '0', '0.00', '0,00', etc. como cero
      const value = typeof stat.value === 'string' ? stat.value.replace(/[,]/g, '') : stat.value;
      // Quitar tarjetas específicas
      if (stat.title === 'Total de Seguros' || stat.title === 'Unidades en Control') return false;
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
            {/* Mostrar contenido diferente según el cargo */}
            {isAdminOrEncargado ? (
              <RegistroActividadMain />
            ) : isTecnico ? (
              <ActivosDashboardSimple />
            ) : (
              // Fallback para otros cargos o usuarios sin cargo definido
              <ActivosDashboardSimple />
            )}
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;