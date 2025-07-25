import { createTheme } from "@mui/material/styles";
import typography from "./Typography";
import { shadows } from "./Shadows";

const baselightTheme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: "#1e4db7",
      light: "#ddebff",
      transparent: "#ffffff00"
    },
    secondary: {
      main: "#1a97f5",
      light: "#edf7ff",
    },
    success: {
      main: '#13DEB9',
      light: '#E6FFFA',
      dark: '#02b3a9',
      contrastText: '#ffffff',
    },
    info: {
      main: '#539BFF',
      light: '#EBF3FE',
      dark: '#1682d4',
      contrastText: '#ffffff',
    },
    error: {
      main: '#FA896B',
      light: '#FDEDE8',
      dark: '#f3704d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFAE1F',
      light: '#FEF5E5',
      dark: '#ae8e59',
      contrastText: '#ffffff',
    },
    purple: {
      A50: '#EBF3FE',
      A100: '#6610f2',
      A200: '#557fb9',
    },
    grey: {
      100: '#F2F6FA',
      200: '#EAEFF4',
      300: '#DFE5EF',
      400: '#7C8FAC',
      500: '#5A6A85',
      600: '#2A3547',
      700: '#dfe5ef'

    },
    text: {
      primary: '#2A3547',
      secondary: '#5A6A85',
    },
    action: {
      disabledBackground: 'rgba(73,82,88,0.12)',
      hoverOpacity: 0.02,
      hover: '#f6f9fc',
    },
    divider: '#e5eaef',
  },
  typography,
  shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          textDecoration: "none",
        },
        '.simplebar-scrollbar:before': {
          background: " #DFE5EF!important"
        },
        ".rounded-bars .apexcharts-bar-series.apexcharts-plot-series .apexcharts-series path":
        {
          clipPath: "inset(0 0 5% 0 round 20px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)'
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.MuiMenuItem-root': {
            color: 'inherit',
            '& .MuiTypography-root': {
              color: 'inherit',
            },
          },
          '&.sidebar-menu-item': {
          color: 'white',
          '& .MuiTypography-root': {
            color: 'white',
            },
          },
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          '&.MuiListSubheader-root': {
            color: 'inherit',
            '& .MuiTypography-root': {
              color: 'inherit',
            },
          },
          '&.sidebar-subheader': {
          color: 'white',
          '& .MuiTypography-root': {
            color: 'white',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#2A3547',
          '& .MuiSelect-select': {
            color: '#2A3547',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: '#2A3547',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: '#2A3547',
          },
          '& .MuiSelect-select': {
            color: '#2A3547',
          },
        },
      },
    },
  }
},

);

export { baselightTheme };
