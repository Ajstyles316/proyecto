import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Paper,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { useUser } from '../../../../components/UserContext';

const MantenimientoTable = ({ mantenimientos, onEdit, onDelete, loading, isReadOnly, canEdit = false, canDelete = false, deleteLoading = {} }) => {
  const { user } = useUser();
  const theme = useTheme();
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
    <TableContainer 
      component={Paper} 
      sx={{ 
        overflowX: 'auto', 
        WebkitOverflowScrolling: 'touch',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        maxHeight: { xs: '400px', sm: '500px', md: '600px' }
      }}
    >
      <Table sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>FECHA</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>DESCRIPCIÓN</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>COSTO</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>OPERADOR</TableCell>
            {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {mantenimientos.map((mantenimiento) => (
            <TableRow 
              key={mantenimiento._id} 
              hover
              sx={{ 
                opacity: mantenimiento.activo === false ? 0.5 : 1,
                backgroundColor: mantenimiento.activo === false ? '#fafafa' : 'inherit',
                '&:hover': {
                  backgroundColor: mantenimiento.activo === false ? '#f0f0f0' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <TableCell sx={{ fontSize: '0.875rem' }}>{formatDate(mantenimiento.fecha_mantenimiento)}</TableCell>
              <TableCell sx={{ fontSize: '0.875rem', maxWidth: 300 }}>
                <Box sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  title: mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-'
                }}>
                  {mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-'}
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>
                {mantenimiento.costo_total ? `Bs. ${mantenimiento.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
              </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{mantenimiento.operador || '-'}</TableCell>
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
    </TableContainer>
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