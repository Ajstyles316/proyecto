import PropTypes from "prop-types"; // Import PropTypes
import { Box, Typography, Paper } from "@mui/material";
import Icon from "@mdi/react";
import {
  mdiFileDocumentOutline,
  mdiWrench,
  mdiTruckFast,
  mdiClockTimeEight,
  mdiTractor,
  mdiShieldCheck,
  mdiCalendarAlert,
  mdiCalendarCheck,
  mdiClipboardList,
  mdiCashMultiple,
  mdiRobot,
} from "@mdi/js";

const StatCard = ({ title, value, icon, color }) => {
  const iconMap = {
    "mdi:file-document-outline": mdiFileDocumentOutline,
    "mdi:wrench": mdiWrench,
    "mdi:truck-fast": mdiTruckFast,
    "mdi:clock-time-eight": mdiClockTimeEight,
    "mdi:tractor": mdiTractor,
    "mdi:shield-check": mdiShieldCheck,
    "mdi:calendar-alert": mdiCalendarAlert,
    "mdi:calendar-check": mdiCalendarCheck,
    "mdi:clipboard-list": mdiClipboardList,
    "mdi:cash-multiple": mdiCashMultiple,
    "mdi:robot": mdiRobot,
  };

  return (
    <Paper elevation={3} sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
      {/* Ícono */}
      <Box
        sx={{
          bgcolor: color ? `${color.split('.')[0]}.light` : 'primary.light',
          color: color || 'primary.dark',
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon path={iconMap[icon] || mdiWrench} size={1} />
      </Box>

      {/* Contenido */}
      <Box>
        <Typography variant="h6" fontWeight={600}>
          {value}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

// Define PropTypes for validation
StatCard.propTypes = {
  title: PropTypes.string.isRequired, // Title is required and must be a string
  value: PropTypes.string.isRequired, // Value is required and must be a string
  icon: PropTypes.string.isRequired, // Icon is required and must be a string
  color: PropTypes.string.isRequired, // Color is required and must be a string
};

export default StatCard;