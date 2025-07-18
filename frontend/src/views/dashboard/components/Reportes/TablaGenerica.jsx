import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
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

  return (
    <Box mb={3}>
      {title && <Typography variant="subtitle1" mt={2} mb={1}>{title}</Typography>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((header, i) => <TableCell key={i}>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {keys.map((k, i) => (
                  <TableCell key={k}>
                    {customCellRender
                      ? customCellRender(k, row[k], row)
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
