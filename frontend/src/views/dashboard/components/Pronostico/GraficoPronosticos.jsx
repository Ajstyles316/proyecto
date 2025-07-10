import {
  Typography
} from "@mui/material";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  Line
} from "recharts";
import PropTypes from "prop-types";
const GraficoPronosticos = ({ data }) => {
  // Ordenar los datos por recorrido ascendente y, si hay empate, por horas_op ascendente
  const sortedData = [...data].sort((a, b) => {
    const recA = a.recorrido ?? 0;
    const recB = b.recorrido ?? 0;
    if (recA !== recB) return recA - recB;
    return (a.horas_op ?? 0) - (b.horas_op ?? 0);
  });
  // Calcular el dominio exacto para el eje X
  const recorridos = sortedData.map(d => d.recorrido ?? 0);
  const minRecorrido = Math.min(...recorridos);
  const maxRecorrido = Math.max(...recorridos);

  // Calcular regresión lineal (y = a * x + b)
  function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { a: 0, b: 0 };
    const a = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY * sumX2 - sumX * sumXY) / denominator;
    return { a, b };
  }
  const xVals = sortedData.map(d => d.recorrido ?? 0);
  const yVals = sortedData.map(d => d.horas_op ?? 0);
  const { a, b } = linearRegression(xVals, yVals);
  // Generar puntos para la línea de tendencia
  const trendLine = [
    { recorrido: minRecorrido, horas_op: a * minRecorrido + b },
    { recorrido: maxRecorrido, horas_op: a * maxRecorrido + b }
  ];

  return (
    <>
      <Typography variant="h6" mb={2} align="center">
        Gráfica de Recorrido vs Horas
      </Typography>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis
            dataKey="recorrido"
            name="Recorrido (km)"
            domain={[minRecorrido, maxRecorrido]}
            type="number"
          />
          <YAxis dataKey="horas_op" name="Horas de Operación" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="Pronósticos" data={sortedData} fill="#8884d8" />
          <Line
            type="monotone"
            dataKey="horas_op"
            data={sortedData}
            stroke="#1976d2"
            dot={false}
            legendType="plainline"
            name="Evolución real"
          />
          {/* Línea de tendencia */}
          <Line
            type="linear"
            dataKey="horas_op"
            data={trendLine}
            stroke="#ff9800"
            dot={false}
            legendType="plainline"
            name="Tendencia"
            strokeDasharray="5 5"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </>
  );
};
GraficoPronosticos.propTypes = {
  data: PropTypes.array.isRequired,
};
export default GraficoPronosticos;
