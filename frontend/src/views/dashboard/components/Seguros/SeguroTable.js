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

const SeguroTable = ({ seguros, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly, isEncargado = false }) => {
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

  if (seguros.length === 0) {
    return (
      <Typography align="center" sx={{ py: 5 }}>
        No hay registros de seguro
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>N° 2024</TableCell>
          <TableCell>Importe</TableCell>
          <TableCell>Detalle</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {seguros.map((seguro) => (
          <TableRow key={seguro._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{seguro.numero_2024}</TableCell>
            <TableCell>{seguro.importe}</TableCell>
            <TableCell>{seguro.detalle}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit && onEdit(seguro)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete && onDelete(seguro._id)}
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

SeguroTable.propTypes = {
  seguros: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    numero_2024: PropTypes.string.isRequired,
    importe: PropTypes.number.isRequired,
    detalle: PropTypes.string,
  })).isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool,
  isEncargado: PropTypes.bool,
};

export default SeguroTable; 