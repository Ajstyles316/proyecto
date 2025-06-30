import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';

import DashboardCard from '../../../components/shared/DashboardCard';

const PronosticoChart = () => {
  const [chartData, setChartData] = useState({ series: [], labels: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // chart color
  const theme = useTheme();
  const errorColor = theme.palette.error.main;
  const warning = theme.palette.warning.main;
  const success = theme.palette.success.main;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/pronostico/summary/');
        if (!res.ok) {
          throw new Error('Error al cargar datos del gráfico');
        }
        const data = await res.json();
        
        // Ordenar los datos por un orden lógico (ALTO, MEDIO, BAJO)
        const order = { "ALTO": 0, "MEDIO": 1, "BAJO": 2 };
        const sortedData = data.sort((a, b) => (order[a.name] ?? 3) - (order[b.name] ?? 3));
        
        const series = sortedData.map(item => item.value);
        const labels = sortedData.map(item => item.name);

        setChartData({ series, labels });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // chart
  const optionsdonutchart = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 300,
    },
    colors: [errorColor, warning, success],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          background: 'transparent',
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
      y: {
        formatter: (value) => `${value} Unidades`,
      }
    },
    stroke: {
      show: false,
    },
    labels: chartData.labels,
    legend: {
      show: true,
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + "%"
      },
    },
  };

  return (
    <DashboardCard title="Riesgo de Mantenimiento">
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : chartData.series.reduce((a, b) => a + b, 0) === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <Typography>No hay datos de pronóstico</Typography>
        </Box>
      ) : (
        <Chart
            options={optionsdonutchart}
            series={chartData.series}
            type="donut"
            height="300px"
        />
      )}
    </DashboardCard>
  );
};

export default PronosticoChart; 