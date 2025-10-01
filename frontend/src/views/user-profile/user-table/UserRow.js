import { Box, Typography, Select, MenuItem, IconButton, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TableRow, TableCell } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';

const UserRow = ({
  usuario,
  id,
  user,
  isReadOnly,
  isAdmin,
  isEncargado,
  cargoLoading,
  memorandumLoading,
  actionLoading,
  cargos,
  parseDateFromString,
  formatDateToString,
  onCargoChange,
  onMemorandumChange,
  onOpenPermisos,
  onEliminarUsuario,
  onReactivarUsuario
}) => {
  return (
    <TableRow>
      <TableCell>{usuario.Nombre}</TableCell>
      <TableCell>{usuario.Email}</TableCell>
      <TableCell>
        {id === (user._id?.$oid || user._id) ? (
          <Typography variant="body2" sx={{ py: 1 }}>{usuario.Cargo?.toUpperCase()}</Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              value={usuario.Cargo}
              onChange={e => onCargoChange(id, e.target.value)}
              size="small"
              disabled={isReadOnly || cargoLoading}
            >
              {cargos.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
            {cargoLoading && <CircularProgress size={16} />}
          </Box>
        )}
      </TableCell>
      <TableCell align="center">
        {(isAdmin || isEncargado) && usuario.Email !== user.Email && !isReadOnly && (
          <IconButton onClick={() => onOpenPermisos(usuario)}>
            <VpnKeyIcon />
          </IconButton>
        )}
      </TableCell>
      <TableCell>{usuario.Unidad}</TableCell>
      <TableCell>
        {id === (user._id?.$oid || user._id) ? (
          <Typography variant="body2" sx={{ py: 1 }}>{usuario.Memorandum || '-'}</Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DatePicker
              value={parseDateFromString(usuario.Memorandum)}
              onChange={(newDate) => {
                if (newDate) {
                  const formattedDate = formatDateToString(newDate);
                  onMemorandumChange(id, formattedDate);
                } else {
                  onMemorandumChange(id, '');
                }
              }}
              disabled={isReadOnly || memorandumLoading}
              slotProps={{
                textField: {
                  size: "small",
                  placeholder: "DD/MM/YYYY",
                  sx: { 
                    minWidth: 100,
                    maxWidth: 150,
                    '& .MuiInputBase-input': {
                      fontSize: '0.875rem',
                      padding: '6px 8px'
                    }
                  }
                }
              }}
              format="dd/MM/yyyy"
              clearable={false}
            />
            {memorandumLoading && <CircularProgress size={16} />}
          </Box>
        )}
      </TableCell>
      <TableCell>
        {id === (user._id?.$oid || user._id) ? (
          <Typography variant="caption" color="textSecondary">(Tú)</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isReadOnly && (
              <IconButton 
                color="error" 
                onClick={() => onEliminarUsuario(id)}
                disabled={actionLoading[`delete_${id}`]}
              >
                {actionLoading[`delete_${id}`] ? (
                  <CircularProgress size={20} color="error" />
                ) : (
                  <BlockIcon sx={{ color: '#f44336' }} />
                )}
              </IconButton>
            )}
            {usuario.activo === false && !isReadOnly && (
              <IconButton 
                color="success" 
                onClick={() => onReactivarUsuario(id)}
                disabled={actionLoading[`reactivate_${id}`]}
              >
                {actionLoading[`reactivate_${id}`] ? (
                  <CircularProgress size={20} color="success" />
                ) : (
                  <RestoreIcon sx={{ color: '#4caf50' }} />
                )}
              </IconButton>
            )}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
};

UserRow.propTypes = {
  usuario: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isEncargado: PropTypes.bool.isRequired,
  cargoLoading: PropTypes.bool.isRequired,
  memorandumLoading: PropTypes.bool.isRequired,
  actionLoading: PropTypes.object.isRequired,
  cargos: PropTypes.array.isRequired,
  parseDateFromString: PropTypes.func.isRequired,
  formatDateToString: PropTypes.func.isRequired,
  onCargoChange: PropTypes.func.isRequired,
  onMemorandumChange: PropTypes.func.isRequired,
  onOpenPermisos: PropTypes.func.isRequired,
  onEliminarUsuario: PropTypes.func.isRequired,
  onReactivarUsuario: PropTypes.func.isRequired,
};

export default UserRow;
