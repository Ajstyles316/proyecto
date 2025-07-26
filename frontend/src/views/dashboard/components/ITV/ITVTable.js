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
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';

const ITVTable = ({ itvs, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly, isEncargado = false }) => {
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
            <TableCell>{itv.detalle}</TableCell>
            <TableCell>{itv.importe}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit && onEdit(itv)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete && onDelete(itv._id)}
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

ITVTable.propTypes = {
  itvs: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool,
  isEncargado: PropTypes.bool,
};

export default ITVTable; 