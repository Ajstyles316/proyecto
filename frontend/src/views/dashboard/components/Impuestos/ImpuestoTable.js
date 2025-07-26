import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';

const ImpuestoTable = ({ impuestos, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly, isEncargado = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (impuestos.length === 0) {
    return (
      <Typography align="center" sx={{ py: 5 }}>
        No hay registros de impuestos
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Importe 2023</TableCell>
          <TableCell>Importe 2024</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {impuestos.map((impuesto) => (
          <TableRow key={impuesto._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{impuesto.importe_2023}</TableCell>
            <TableCell>{impuesto.importe_2024}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit && onEdit(impuesto)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete && onDelete(impuesto._id)}
                  >
                    <BlockIcon sx={{ color: '#f44336' }} />
                  </IconButton>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

ImpuestoTable.propTypes = {
  impuestos: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    importe_2023: PropTypes.number.isRequired,
    importe_2024: PropTypes.number.isRequired,
  })).isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool,
  isEncargado: PropTypes.bool,
};

export default ImpuestoTable; 