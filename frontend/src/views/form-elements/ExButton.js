import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";

import MantenimientoActual from "./MantenimientoActual";
import MantenimientoIA from "./MantenimientoIA";

const Mantenimiento = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Mantenimiento
      </Typography>

      <Tabs value={tabValue} onChange={handleChange}>
        <Tab label="Mantenimiento Act." />
        <Tab label="Mantenimiento IA" />
      </Tabs>

      {tabValue === 0 && <MantenimientoActual />}
      {tabValue === 1 && <MantenimientoIA />}
    </Box>
  );
};

export default Mantenimiento;