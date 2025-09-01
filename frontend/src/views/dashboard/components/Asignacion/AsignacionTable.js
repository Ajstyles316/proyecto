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
import { useUser } from '../../../../components/UserContext';

const AsignacionTable = ({ asignaciones, onEdit, onDelete, loading, isReadOnly, canEdit = false, canDelete = false, deleteLoading = {} }) => {
  const { user } = useUser();
  const isTechnician = user?.Cargo?.toLowerCase() === 'tecnico' || user?.Cargo?.toLowerCase() === 'técnico';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si está en formato DD/MM/YYYY, convertirlo
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Para otros formatos, intentar con Date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress color="primary" />
        <Typography variant="body1" sx={{ ml: 2 }}>Cargando asignaciones...</Typography>
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

  // Mostrar columna de acciones para encargados y otros roles con permisos (excepto técnicos)
  const showActionsColumn = (isEncargado || (!isTechnician && (canEdit || canDelete)));



  return (
    <Table sx={{
      '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
      },
      '& .MuiTableRow-root:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.04)',
      },
      '& .MuiTableHead-root .MuiTableCell-root': {
        borderBottom: '2px solid rgba(224, 224, 224, 1)',
        fontWeight: 600,
      }
    }}>
      <TableHead>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
          <TableCell sx={{ fontWeight: 600 }}>Unidad</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Fecha de Asignación</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Kilometraje</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Gerente</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Encargado</TableCell>
          {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {asignaciones.map((asignacion) => (
          <TableRow key={asignacion._id} sx={{
            '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
          }}>
            <TableCell>{asignacion.unidad}</TableCell>
            <TableCell>{formatDate(asignacion.fecha_asignacion)}</TableCell>
            <TableCell>{asignacion.kilometraje}</TableCell>
            <TableCell>{asignacion.gerente}</TableCell>
            <TableCell>{asignacion.encargado}</TableCell>
            {showActionsColumn && (
              <TableCell align="right">
                {(isEncargado || canEdit) && (
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(asignacion)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                )}
                {(isEncargado || canDelete) && (
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(asignacion._id)}
                    disabled={deleteLoading[asignacion._id]}
                  >
                    {deleteLoading[asignacion._id] ? (
                      <CircularProgress size={16} color="error" />
                    ) : (
                      <BlockIcon sx={{ color: '#f44336' }} />
                    )}
                  </IconButton>
                )}
              </TableCell>
            )}
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
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

export default AsignacionTable; 