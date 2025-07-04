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
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const ITVTable = ({ itvs, maquinariaPlaca, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (itvs.length === 0) {
    return (
      <Typography align="center" sx={{ py: 5 }}>
        No hay registros de ITV
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Detalle</TableCell>
          <TableCell>Importe</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {itvs.map((itv) => (
          <TableRow key={itv._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{itv.detalle || ''}</TableCell>
            <TableCell>{itv.importe || ''}</TableCell>
            <TableCell align="right">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onEdit(itv)}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete(itv._id)}
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

ITVTable.propTypes = {
  itvs: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default ITVTable; 