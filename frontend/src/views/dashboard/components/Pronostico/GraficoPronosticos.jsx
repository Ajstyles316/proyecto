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
  return (
    <>
      <Typography variant="h6" mb={2} align="center">
        Gráfica de Recorrido vs Horas
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis dataKey="recorrido" name="Recorrido (km)" />
          <YAxis dataKey="horas_op" name="Horas de Operación" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="Pronósticos" data={data} fill="#8884d8" />
          <Line
            type="monotone"
            dataKey="horas_op"
            data={data}
            stroke="#1976d2"
            dot={false}
            legendType="plainline"
            name="Evolución real"
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
