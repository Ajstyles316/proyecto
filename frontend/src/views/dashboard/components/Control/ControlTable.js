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

const ControlTable = ({ controls, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly, canEdit = false, canDelete = false, deleteLoading = {} }) => {
  const { user } = useUser();
  const isTechnician = user?.Cargo?.toLowerCase() === 'tecnico' || user?.Cargo?.toLowerCase() === 'técnico';
  
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
        <Typography variant="body1" sx={{ ml: 2 }}>Cargando controles...</Typography>
      </Box>
    );
  }

  if (controls.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros de control para esta maquinaria.
      </Typography>
    );
  }

  // Mostrar columna de acciones para encargados y otros roles con permisos (excepto técnicos)
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
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
          <TableCell sx={{ fontWeight: 600 }}>Placa</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Ubicación</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Gerente</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Encargado</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Hoja de Trámite</TableCell>
          {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {controls.map((control, index) => (
          <TableRow key={control._id} sx={{
            '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
          }}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{control.ubicacion}</TableCell>
            <TableCell>{control.gerente}</TableCell>
            <TableCell>{control.encargado}</TableCell>
            <TableCell>{control.estado}</TableCell>
            <TableCell>{control.hoja_tramite}</TableCell>
            {showActionsColumn && (
              <TableCell align="right">
                {(isEncargado || canEdit) && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(control)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                )}
                {(isEncargado || canDelete) && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(control._id)}
                    disabled={deleteLoading[control._id]}
                  >
                    {deleteLoading[control._id] ? (
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

ControlTable.propTypes = {
  controls: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ubicacion: PropTypes.string.isRequired,
    gerente: PropTypes.string,
    encargado: PropTypes.string,
    estado: PropTypes.string,
    hoja_tramite: PropTypes.string,
    observacion: PropTypes.string, // aún se valida, solo no se muestra
  })).isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

export default ControlTable;
