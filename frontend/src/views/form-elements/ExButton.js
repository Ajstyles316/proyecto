import { useState } from "react";
import {
  Box,
} from "@mui/material";
import Pronostico from "../dashboard/components/Pronostico/Pronostico";
const ExButton = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Pronostico/>
    </Box>
  )
};
export default ExButton;