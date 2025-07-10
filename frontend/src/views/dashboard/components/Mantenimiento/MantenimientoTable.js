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

const MantenimientoTable = ({ mantenimientos, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mantenimientos.length === 0) {
    return (
      <Typography align="center" sx={{ py: 5 }}>
        No hay registros de mantenimiento
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Tipo</TableCell>
          <TableCell>Cantidad</TableCell>
          <TableCell>Gestión</TableCell>
          <TableCell>Ubicación</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {mantenimientos.map((m) => (
          <TableRow key={m._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{m.tipo || ''}</TableCell>
            <TableCell>{m.cantidad || ''}</TableCell>
            <TableCell>{m.gestion || ''}</TableCell>
            <TableCell>{m.ubicacion || ''}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(m)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(m._id)}
                  >
                    <DeleteIcon sx={{ color: '#f44336' }} />
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

MantenimientoTable.propTypes = {
  mantenimientos: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
};

export default MantenimientoTable; 