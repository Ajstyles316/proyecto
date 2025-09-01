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

const MantenimientoTable = ({ mantenimientos, onEdit, onDelete, loading, isReadOnly, canEdit = false, canDelete = false, deleteLoading = {} }) => {
  const { user } = useUser();
  const isTechnician = user?.Cargo?.toLowerCase() === 'tecnico' || user?.Cargo?.toLowerCase() === 'técnico';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress color="primary" />
        <Typography variant="body1" sx={{ ml: 2 }}>Cargando mantenimientos...</Typography>
      </Box>
    );
  }

  if (mantenimientos.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros de mantenimiento para esta maquinaria.
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
          <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Combustible</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Lubricantes</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Mano de Obra</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Técnico</TableCell>
          {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {mantenimientos.map((mantenimiento) => (
          <TableRow key={mantenimiento._id} sx={{
            '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
          }}>
            <TableCell>{mantenimiento.tipo_mantenimiento}</TableCell>
            <TableCell>{mantenimiento.consumo_combustible ? `${mantenimiento.consumo_combustible} Lts` : '-'}</TableCell>
            <TableCell>{mantenimiento.consumo_lubricantes ? `${mantenimiento.consumo_lubricantes} Lts` : '-'}</TableCell>
            <TableCell>{mantenimiento.mano_obra ? `Bs. ${mantenimiento.mano_obra}` : '-'}</TableCell>
            <TableCell>{mantenimiento.tecnico_responsable}</TableCell>
            {showActionsColumn && (
              <TableCell align="right">
                {(isEncargado || canEdit) && (
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(mantenimiento)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                )}
                {(isEncargado || canDelete) && (
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(mantenimiento._id)}
                    disabled={deleteLoading[mantenimiento._id]}
                  >
                    {deleteLoading[mantenimiento._id] ? (
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

MantenimientoTable.propTypes = {
  mantenimientos: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

export default MantenimientoTable; 