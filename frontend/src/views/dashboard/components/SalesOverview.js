import React from 'react';
import { Stack, Typography, MenuItem, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '../../../components/shared/DashboardCard';
import Chart from 'react-apexcharts';


const SalesOverview = () => {

    // select
    const [month, setMonth] = React.useState('1');

    const handleChange = (event) => {
        setMonth(event.target.value);
    };

    // chart color
    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;

    // chart
    const optionscolumnchart = {
        chart: {
            type: 'bar',
            fontFamily: "'Plus Jakarta Sans', sans-serif;",
            foreColor: '#adb0bb',
            toolbar: {
                show: true,
            },
            height: 370,
        },
        colors: [primary, secondary],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "42%",
                borderRadius: 6,
            },
        },

        stroke: {
            show: true,
            width: 5,
            lineCap: "butt",
            colors: ["transparent"],
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.1)',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: false,
                },
            },
        },
        
        xaxis: {
            categories: ["Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",],
            axisBorder: {
                show: false,
            },
        },
        tooltip: {
            theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
            fillSeriesColor: false,
        },
    };
    const seriescolumnchart = [
        {
            name: "Encargado",
            data: [355, 390, 300, 350, 390, 180, 355, 390, 300, 350, 390, 180],
        },
        {
            name: "Gerente",
            data: [280, 250, 325, 215, 250, 310, 280, 250, 325, 215, 250, 310],
        },
    ];

    return (

        <DashboardCard title="Pronóstico de Mantenimiento" action={
            <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                        sx={{
                            backgroundColor: "primary.main",
                            borderRadius: "50%",
                            height: 8,
                            width: 8,
                        }}
                    />
                    <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
                        Encargado
                    </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                        sx={{
                            backgroundColor: "secondary.main",
                            borderRadius: "50%",
                            height: 8,
                            width: 8,
                        }}
                    />
                    <Typography variant="subtitle2" sx={{ color: "secondary.main" }}>
                        Gerente
                    </Typography>
                </Stack>
            </Stack>
        }>
            <Box className='rounded-bars'>
                <Chart
                    options={optionscolumnchart}
                    series={seriescolumnchart}
                    type="bar"
                    height="370px"
                />
            </Box>
        </DashboardCard>
    );
};

export default SalesOverview;
