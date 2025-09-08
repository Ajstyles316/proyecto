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
  useTheme,
  Pagination,
  TextField,
  MenuItem,
  useMediaQuery
} from '@mui/material';
import { 
  Info,
  TableChart
} from '@mui/icons-material';
import { formatDateOnly } from './helpers';
import { useState, useMemo } from 'react';
import FileDownloadCell from './FileDownloadCell';

const TablaGenericaAvanzada = ({
  title,
  data,
  fields,
  emptyMessage,
  customCellRender,
  ocultarCampos = ['gestion'], // ⬅️ MODIFICACIÓN REALIZADA AQUÍ (solo se agregó 'gestion' al array por defecto)
  reemplazos = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    if (rowsPerPage === 'Todos') return data;
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, page, rowsPerPage]);

  const totalPages = rowsPerPage === 'Todos' ? 1 : Math.ceil(data.length / rowsPerPage);

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
    ? fields.map(f => f.key).filter(k => !ocultarCampos.includes(k) && k !== 'archivo_pdf')
    : Object.keys(data[0] || {}).filter(k => !k.endsWith('_id') && k !== 'maquinaria' && k !== 'archivo_pdf' && !ocultarCampos.includes(k));

  const headers = fields
    ? fields.filter(f => !ocultarCampos.includes(f.key) && f.key !== 'archivo_pdf').map(f => reemplazos[f.label] || f.label)
    : keys.map(k => {
        // Corrección específica para 'ubicacion' y variantes
        if (k.toLowerCase() === 'ubicacion' || k.toLowerCase() === 'ubicacióN'.toLowerCase()) {
          return 'Ubicación';
        }
        // Formatear nombre_archivo como "Archivo"
        if (k === 'nombre_archivo') {
          return 'Archivo';
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
      return value.map(v => typeof v === 'string' ? v : v).join('; ');
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
      const formatted = value === 'linea_recta' ? 'Línea Recta' : value;
      return (
        <Chip
          label={formatted}
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

    // Si es un campo de archivo (nombre_archivo o cualquier campo que termine en .pdf)
    if ((key === 'nombre_archivo' || (typeof value === 'string' && value.toLowerCase().includes('.pdf'))) && value) {
      console.log('🔍 TablaGenerica - Campo archivo encontrado:', { 
        key, 
        value, 
        hasArchivoPdf: !!row.archivo_pdf,
        rowKeys: Object.keys(row),
        fullRow: row
      });
      
      // Buscar los datos del archivo en diferentes campos posibles
      const possibleFileFields = ['archivo_pdf', 'archivo', 'file_data', 'pdf_data', 'documento'];
      let fileData = null;
      
      for (const field of possibleFileFields) {
        if (row[field] && typeof row[field] === 'string' && row[field].length > 0) {
          fileData = { archivo_pdf: row[field] };
          console.log(`🔍 TablaGenerica - Datos encontrados en campo '${field}':`, {
            fileName: value,
            field: field,
            dataLength: row[field].length,
            dataPreview: row[field].substring(0, 50) + '...'
          });
          break;
        }
      }
      
      // Si no encontramos datos de archivo, mostrar solo el nombre sin funcionalidad de descarga
      if (!fileData) {
        console.log('🔍 TablaGenerica - No se encontraron datos de archivo en ningún campo:', {
          fileName: value,
          availableFields: Object.keys(row),
          rowData: row
        });
        return (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontStyle: 'italic',
              opacity: 0.7
            }}
          >
            {value} (sin datos de archivo)
          </Typography>
        );
      }
      
      // Mostrar FileDownloadCell para campos de archivo con datos disponibles
      return (
        <FileDownloadCell 
          fileName={value} 
          fileData={fileData} 
          showIcon={true}
        />
      );
    }

    // Si es importe o costo
    if (key.toLowerCase().includes('importe') || key.toLowerCase().includes('costo') || key.toLowerCase().includes('mano_obra')) {
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

    // Si es string, mostrar tal como se registró
    if (typeof value === 'string') {
      const formatted = value === 'linea_recta' ? 'Línea Recta' : value;
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
          justifyContent="space-between"
          mb={2}
          p={2}
          bgcolor="primary.main"
          color="primary.contrastText"
          borderRadius={2}
          boxShadow={3}
        >
          <Box display="flex" alignItems="center">
            <TableChart sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`${data.length} registro${data.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
                fontWeight: 600
              }}
            />
            {data.length > 10 && (
              <TextField
                select
                size="small"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(e.target.value === 'Todos' ? 'Todos' : parseInt(e.target.value, 10));
                  setPage(1);
                }}
                sx={{
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    color: 'inherit',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255,255,255,0.7)',
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: 'inherit',
                  },
                }}
              >
                <MenuItem value={5}>5 por página</MenuItem>
                <MenuItem value={10}>10 por página</MenuItem>
                <MenuItem value={20}>20 por página</MenuItem>
                <MenuItem value={50}>50 por página</MenuItem>
                <MenuItem value={'Todos'}>Todos</MenuItem>
              </TextField>
            )}
          </Box>
        </Box>
      )}
      
      <TableContainer 
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          maxHeight: { xs: '400px', sm: '500px', md: '600px' }
        }}
      >
        <Table size={isMobile ? "small" : "medium"} stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
              {headers.map((header, i) => (
                <TableCell 
                  key={i}
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: { xs: 1, sm: 2 },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, idx) => (
              <TableRow 
                key={idx}
                sx={{
                  '&:nth-of-type(odd)': {
                    bgcolor: theme.palette.action.hover
                  },
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                    transition: 'background-color 0.2s ease',
                    transform: 'scale(1.01)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {keys.map((k, i) => (
                  <TableCell 
                    key={k}
                    sx={{
                      py: { xs: 1, sm: 1.5 },
                      px: { xs: 1, sm: 2 },
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
      
      {/* Paginación */}
      {totalPages > 1 && rowsPerPage !== 'Todos' && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            showFirstButton
            showLastButton
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
            }}
          />
        </Box>
      )}
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