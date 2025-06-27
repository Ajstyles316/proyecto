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

const SOATTable = ({ soats, maquinariaPlaca, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (soats.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros de SOAT para esta maquinaria.
      </Typography>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Placa</TableCell>
          <TableCell>Importe 2024</TableCell>
          <TableCell>Importe 2025</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {soats.map((soat) => (
          <TableRow key={soat._id}>
            <TableCell>{maquinariaPlaca}</TableCell>
            <TableCell>{soat.importe_2024 || ''}</TableCell>
            <TableCell>{soat.importe_2025 || ''}</TableCell>
            <TableCell align="right">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onEdit(soat)}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete(soat._id)}
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

SOATTable.propTypes = {
  soats: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SOATTable; 