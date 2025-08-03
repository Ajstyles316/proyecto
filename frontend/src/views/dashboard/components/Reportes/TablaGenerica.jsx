import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { 
  Warning, 
  CheckCircle, 
  Info,
  TableChart
} from '@mui/icons-material';
import { formatDateOnly } from './helpers';
import { formatMethod } from './helpers';

const TablaGenericaAvanzada = ({
  title,
  data,
  fields,
  emptyMessage,
  customCellRender,
  ocultarCampos = [],
  reemplazos = {}
}) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        py={4}
        px={2}
        bgcolor="background.paper"
        borderRadius={2}
        boxShadow={1}
        border={`1px solid ${theme.palette.divider}`}
      >
        <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography 
          variant="h6" 
          color="text.secondary" 
          textAlign="center"
          gutterBottom
        >
          {emptyMessage || `No hay datos de ${title?.toLowerCase() || ''}`}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          textAlign="center"
        >
          Los datos aparecerán aquí cuando estén disponibles
        </Typography>
      </Box>
    );
  }

  // Si no se pasan fields, los infiere del primer objeto, quitando los ocultos
  const keys = fields
    ? fields.map(f => f.key).filter(k => !ocultarCampos.includes(k))
    : Object.keys(data[0] || {}).filter(k => !k.endsWith('_id') && k !== 'maquinaria' && !ocultarCampos.includes(k));

  const headers = fields
    ? fields.filter(f => !ocultarCampos.includes(f.key)).map(f => reemplazos[f.label] || f.label)
    : keys.map(k => {
        // Corrección específica para 'ubicacion' y variantes
        if (k.toLowerCase() === 'ubicacion' || k.toLowerCase() === 'ubicacióN'.toLowerCase()) {
          return 'Ubicación';
        }
        return reemplazos[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });

  // Función para renderizar el contenido de la celda con mejor formato
  const renderCellContent = (key, value, row) => {
    if (customCellRender) {
      return customCellRender(key, value, row);
    }

    // Si es un array
    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'string' ? formatMethod(v) : v).join('; ');
    }

    // Si es una fecha
    if (key.toLowerCase().includes('fecha') && value) {
      return (
        <Chip
          label={formatDateOnly(value)}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ 
            fontSize: '0.75rem',
            height: '24px',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      );
    }

    // Si es método
    if (key.toLowerCase() === 'método' || key.toLowerCase() === 'metodo') {
      return (
        <Chip
          label={formatMethod(value)}
          size="small"
          color="secondary"
          sx={{ 
            fontSize: '0.75rem',
            height: '24px',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      );
    }

    // Si es estado o activo
    if (key.toLowerCase() === 'estado' || key.toLowerCase() === 'activo') {
      const isActive = value === true || value === 'activo' || value === 'Activo';
      return (
        <Chip
          label={isActive ? 'Activo' : 'Inactivo'}
          size="small"
          color={isActive ? 'success' : 'error'}
          icon={isActive ? <CheckCircle /> : <Warning />}
          sx={{ 
            fontSize: '0.75rem',
            height: '24px',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      );
    }

    // Si es importe o costo
    if (key.toLowerCase().includes('importe') || key.toLowerCase().includes('costo') || key.toLowerCase().includes('valor')) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: numValue > 0 ? 'success.main' : 'text.primary',
              fontFamily: 'monospace'
            }}
          >
            Bs. {numValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </Typography>
        );
      }
    }

    // Si es string, aplicar formato
    if (typeof value === 'string') {
      const formatted = value === 'linea_recta' ? 'Línea Recta' : formatMethod(value);
      return (
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {formatted || '-'}
        </Typography>
      );
    }

    // Valor por defecto
    return (
      <Typography variant="body2" color="text.secondary">
        {value ?? '-'}
      </Typography>
    );
  };

  return (
    <Box mb={4}>
      {title && (
        <Box 
          display="flex" 
          alignItems="center" 
          mb={2}
          p={2}
          bgcolor="primary.main"
          color="primary.contrastText"
          borderRadius={1}
          boxShadow={2}
        >
          <TableChart sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Chip
            label={`${data.length} registro${data.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ 
              ml: 'auto',
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'inherit',
              fontWeight: 600
            }}
          />
        </Box>
      )}
      
      <TableContainer 
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
              {headers.map((header, i) => (
                <TableCell 
                  key={i}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 2
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow 
                key={idx}
                sx={{
                  '&:nth-of-type(odd)': {
                    bgcolor: theme.palette.action.hover
                  },
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                    transition: 'background-color 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {keys.map((k, i) => (
                  <TableCell 
                    key={k}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:first-of-type': {
                        fontWeight: 600,
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    {renderCellContent(k, row[k], row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

TablaGenericaAvanzada.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array.isRequired,
  fields: PropTypes.array, 
  emptyMessage: PropTypes.string,
  customCellRender: PropTypes.func,
  ocultarCampos: PropTypes.array, 
  reemplazos: PropTypes.object,  
};

export default TablaGenericaAvanzada;

// Exportación nombrada para compatibilidad
export const TablaGenerica = TablaGenericaAvanzada;
