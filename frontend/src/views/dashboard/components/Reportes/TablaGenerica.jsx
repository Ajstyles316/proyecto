import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const TablaGenericaAvanzada = ({ title, data, fields, emptyMessage, customCellRender }) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary" mb={2}>{emptyMessage || `No hay datos de ${title?.toLowerCase() || ''}`}</Typography>;
  }

  // Si no se pasan fields, los infiere del primer objeto
  const keys = fields ? fields.map(f => f.key) : Object.keys(data[0] || {}).filter(k => !k.endsWith('_id') && k !== 'maquinaria');
  const headers = fields ? fields.map(f => f.label) : keys.map(k => k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

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
                        ? row[k].join('; ')
                        : (row[k] ?? '-')}
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
  fields: PropTypes.array, // [{key, label}]
  emptyMessage: PropTypes.string,
  customCellRender: PropTypes.func,
};

export default TablaGenericaAvanzada;