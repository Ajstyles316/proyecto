import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Chip } from '@mui/material';
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
  if (!data || data.length === 0) {
    return <Typography color="text.secondary" mb={2}>{emptyMessage || `No hay datos de ${title?.toLowerCase() || ''}`}</Typography>;
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

  const renderRecomendaciones = (recomendaciones) => {
    if (!recomendaciones) return '-';
    
    // Si es un array, tomar solo los primeros 3 elementos
    if (Array.isArray(recomendaciones)) {
      const items = recomendaciones.slice(0, 3);
      const texto = recomendaciones.join('; ');
      return (
        <Tooltip title={texto} placement="top-start">
          <Box sx={{ 
            maxHeight: '100px', 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
            fontSize: '0.875rem'
          }}>
            {items.map((item, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>
                - {item}
              </Box>
            ))}
          </Box>
        </Tooltip>
      );
    }
    
    // Si es un string, dividirlo por puntos y comas y tomar solo los primeros 3
    if (typeof recomendaciones === 'string') {
      const items = recomendaciones.split(';').map(item => item.trim()).filter(item => item).slice(0, 3);
      return (
        <Tooltip title={recomendaciones} placement="top-start">
          <Box sx={{ 
            maxHeight: '100px', 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
            fontSize: '0.875rem'
          }}>
            {items.map((item, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>
                - {item}
              </Box>
            ))}
          </Box>
        </Tooltip>
      );
    }
    
    return recomendaciones;
  };

  return (
    <Box mb={3}>
      {title && (
        <Typography 
          variant="subtitle1" 
          mt={2} 
          mb={1}
          sx={{
            fontWeight: 600,
            color: '#1976d2',
            fontSize: '1.1rem',
            borderLeft: '4px solid #1976d2',
            paddingLeft: 2
          }}
        >
          {title}
        </Typography>
      )}
      <TableContainer component={Paper} sx={{ 
        maxHeight: '600px',
        overflow: 'auto',
        '& .MuiTableCell-root': {
          borderRight: '1px solid rgba(224, 224, 224, 1)',
          '&:last-child': {
            borderRight: 'none'
          }
        }
      }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((header, i) => (
                <TableCell 
                  key={i} 
                  sx={{ 
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#333',
                    textAlign: 'center',
                    minWidth: header === 'Recomendaciones' ? '300px' : 'auto'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {keys.map((k, i) => (
                  <TableCell key={k} sx={{ 
                    maxWidth: k === 'recomendaciones' ? '300px' : 'auto',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    verticalAlign: 'top'
                  }}>
                    {customCellRender
                      ? customCellRender(k, row[k], row)
                      : k === 'recomendaciones'
                        ? renderRecomendaciones(row[k])
                        : Array.isArray(row[k])
                          ? row[k].map(v => typeof v === 'string' ? formatMethod(v) : v).join('; ')
                          : (k.toLowerCase().includes('fecha') && row[k])
                            ? formatDateOnly(row[k])
                            : (k.toLowerCase() === 'método' || k.toLowerCase() === 'metodo')
                              ? formatMethod(row[k])
                              : (typeof row[k] === 'string' ? formatMethod(row[k]) : (row[k] === 'linea_recta' ? 'Línea Recta' : (row[k] ?? '-')))}
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

// Componente TablaGenerica simple con el mismo estilo mejorado
const TablaGenerica = ({
  title,
  data,
  ocultarCampos = [],
  reemplazos = {}
}) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary" mb={2}>{`No hay datos de ${title?.toLowerCase() || ''}`}</Typography>;
  }

  const keys = Object.keys(data[0] || {}).filter(k => 
    !k.endsWith('_id') && 
    k !== 'maquinaria' && 
    !ocultarCampos.includes(k)
  );

  const headers = keys.map(k => {
    if (k.toLowerCase() === 'ubicacion' || k.toLowerCase() === 'ubicacióN'.toLowerCase()) {
      return 'Ubicación';
    }
    return reemplazos[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  });

  return (
    <Box mb={3}>
      {title && (
        <Typography 
          variant="subtitle1" 
          mt={2} 
          mb={1}
          sx={{
            fontWeight: 600,
            color: '#1976d2',
            fontSize: '1.1rem',
            borderLeft: '4px solid #1976d2',
            paddingLeft: 2
          }}
        >
          {title}
        </Typography>
      )}
      <TableContainer component={Paper} sx={{ 
        maxHeight: '600px',
        overflow: 'auto',
        '& .MuiTableCell-root': {
          borderRight: '1px solid rgba(224, 224, 224, 1)',
          '&:last-child': {
            borderRight: 'none'
          }
        }
      }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((header, i) => (
                <TableCell 
                  key={i} 
                  sx={{ 
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#333',
                    textAlign: 'center'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {keys.map((k, i) => (
                  <TableCell key={k} sx={{ 
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    verticalAlign: 'top',
                    fontSize: '0.875rem'
                  }}>
                    {k === 'recomendaciones'
                      ? renderRecomendaciones(row[k])
                      : Array.isArray(row[k])
                        ? row[k].map(v => typeof v === 'string' ? formatMethod(v) : v).join('; ')
                        : (k.toLowerCase().includes('fecha') && row[k])
                          ? formatDateOnly(row[k])
                          : (k.toLowerCase() === 'método' || k.toLowerCase() === 'metodo')
                            ? formatMethod(row[k])
                            : (typeof row[k] === 'string' ? formatMethod(row[k]) : (row[k] === 'linea_recta' ? 'Línea Recta' : (row[k] ?? '-')))}
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

TablaGenerica.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array.isRequired,
  ocultarCampos: PropTypes.array,
  reemplazos: PropTypes.object,
};

export { TablaGenerica };
