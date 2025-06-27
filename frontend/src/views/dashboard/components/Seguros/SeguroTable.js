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
import DeleteIcon from '@mui/icons-material/Delete';

const SeguroTable = ({ seguros, maquinariaPlaca, onEdit, onDelete, loading }) => {
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
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onEdit(seguro)}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete(seguro._id)}
              >
                <DeleteIcon />
              </IconButton>
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
};

export default SeguroTable; 