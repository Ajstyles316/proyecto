import PropTypes from "prop-types"; // Import PropTypes
import { Box, Typography, Paper, useMediaQuery } from "@mui/material";
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
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.between('sm', 'md'));

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
    <Paper elevation={3} sx={{ 
      p: { xs: 2, sm: 2.5, md: 3 }, 
      display: "flex", 
      alignItems: "center", 
      gap: { xs: 1.5, sm: 2 },
      minHeight: { xs: '80px', sm: '90px', md: '100px' },
    }}>
      {/* Ícono */}
      <Box
        sx={{
          bgcolor: color ? `${color.split('.')[0]}.light` : 'primary.light',
          color: color || 'primary.dark',
          borderRadius: "50%",
          width: { xs: 35, sm: 38, md: 40 },
          height: { xs: 35, sm: 38, md: 40 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon path={iconMap[icon] || mdiWrench} size={isMobile ? 0.8 : isTablet ? 0.9 : 1} />
      </Box>

      {/* Contenido */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant={isMobile ? "h6" : "h6"} fontWeight={600} sx={{ 
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
          lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
        }}>
          {value}
        </Typography>
        <Typography variant={isMobile ? "caption" : "subtitle2"} color="text.secondary" sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
          lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
          wordBreak: 'break-word',
        }}>
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