import { Grid, Box,} from "@mui/material";
import PageContainer from "src/components/container/PageContainer";

// Componentes
import SalesOverview from "./components/SalesOverview";
import StatCard from "./components/StatCard"; // Crearemos este componente para mostrar las estadísticas

const Dashboard = () => {
  // Datos simulados para las estadísticas (pueden ser reemplazados por datos reales desde el backend)
  const stats = [
    {
      title: "Total de Seguros",
      value: "120",
      icon: "mdi:file-document-outline", // Icono de ejemplo (puedes usar cualquier librería de íconos)
      color: "primary.main",
    },
    {
      title: "Mantenimientos Pendientes",
      value: "15",
      icon: "mdi:wrench",
      color: "warning.main",
    },
    {
      title: "Unidades en Control",
      value: "50",
      icon: "mdi:truck-fast",
      color: "success.main",
    },
    {
      title: "Horas Totales Operativas",
      value: "9,876",
      icon: "mdi:clock-time-eight",
      color: "info.main",
    },
  ];

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        {/* Sección de Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            </Grid>
          ))}
        </Grid>

        {/* Gráficos y otros componentes */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SalesOverview />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;