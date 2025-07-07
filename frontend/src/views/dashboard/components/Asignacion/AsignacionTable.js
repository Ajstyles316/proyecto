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

const AsignacionTable = ({ asignaciones, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly }) => {
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

  if (asignaciones.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros de asignación para esta maquinaria.
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Fecha Asignación</TableCell>
          <TableCell>Fecha Liberación</TableCell>
          <TableCell>Recorrido Asignado (Km)</TableCell>
          <TableCell>Recorrido Entregado (Km)</TableCell>
          <TableCell>Encargado</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {asignaciones.map((asignacion) => (
          <TableRow key={asignacion._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{formatDate(asignacion.fecha_asignacion)}</TableCell>
            <TableCell>{formatDate(asignacion.fecha_liberacion)}</TableCell>
            <TableCell>{asignacion.recorrido_km || ''}</TableCell>
            <TableCell>{asignacion.recorrido_entregado || ''}</TableCell>
            <TableCell>{asignacion.encargado || ''}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(asignacion)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(asignacion._id)}
                  >
                    <DeleteIcon />
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

AsignacionTable.propTypes = {
  asignaciones: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
};

export default AsignacionTable; 