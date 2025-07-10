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

const ControlTable = ({ controls, maquinariaPlaca, onEdit, onDelete, loading, isReadOnly }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
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

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Ubicación</TableCell>
          <TableCell>Gerente</TableCell>
          <TableCell>Encargado</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Hoja de Trámite</TableCell>
          <TableCell>Fecha Ingreso</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {controls.map((control) => (
          <TableRow key={control._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{control.ubicacion}</TableCell>
            <TableCell>{control.gerente}</TableCell>
            <TableCell>{control.encargado}</TableCell>
            <TableCell>{control.estado}</TableCell>
            <TableCell>{control.hoja_tramite}</TableCell>
            <TableCell>{control.fecha_ingreso}</TableCell>
            <TableCell align="right">
              {!isReadOnly && (
                <>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(control)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(control._id)}
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

ControlTable.propTypes = {
  controls: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ubicacion: PropTypes.string.isRequired,
    gerente: PropTypes.string,
    encargado: PropTypes.string,
    estado: PropTypes.string,
    hoja_tramite: PropTypes.string,
    fecha_ingreso: PropTypes.string.isRequired,
    observacion: PropTypes.string, // aún se valida, solo no se muestra
  })).isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
};

export default ControlTable;
