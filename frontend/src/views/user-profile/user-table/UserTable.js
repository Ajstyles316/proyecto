import PropTypes from 'prop-types';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import UserRow from './UserRow';

const cargos = ["Encargado", "Técnico"]; // Admin no se incluye porque solo el admin puede crear usuarios

// Función para convertir fecha DD/MM/YYYY a objeto Date
const parseDateFromString = (dateString) => {
  if (!dateString) return null;
  
  // Limpiar la cadena de espacios y caracteres extra
  const cleanString = dateString.toString().trim();
  
  // Verificar si ya es un objeto Date
  if (cleanString instanceof Date) return cleanString;
  
  // Verificar formato DD/MM/YYYY
  const parts = cleanString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Verificar que la fecha sea válida
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  // Si no es DD/MM/YYYY, intentar parsear como fecha ISO
  const isoDate = new Date(cleanString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  return null;
};

// Función para convertir objeto Date a DD/MM/YYYY
const formatDateToString = (date) => {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const UserTable = ({ 
  usuarios, 
  loading, 
  user, 
  isReadOnly, 
  isAdmin, 
  isEncargado,
  cargoLoading,
  memorandumLoading,
  actionLoading,
  onCargoChange,
  onMemorandumChange,
  onOpenPermisos,
  onEliminarUsuario,
  onReactivarUsuario
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper sx={{ overflowX: 'auto', borderRadius: 3, boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress color="primary" />
            <Typography variant="body1" sx={{ ml: 2 }}>Cargando usuarios...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ background: theme => theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cargo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Permisos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unidad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Memorándum</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map(u => {
                const id = u._id?.$oid || u._id || u.Email;
                return (
                  <UserRow
                    key={id}
                    usuario={u}
                    id={id}
                    user={user}
                    isReadOnly={isReadOnly}
                    isAdmin={isAdmin}
                    isEncargado={isEncargado}
                    cargoLoading={cargoLoading[id]}
                    memorandumLoading={memorandumLoading[id]}
                    actionLoading={actionLoading}
                    cargos={cargos}
                    parseDateFromString={parseDateFromString}
                    formatDateToString={formatDateToString}
                    onCargoChange={onCargoChange}
                    onMemorandumChange={onMemorandumChange}
                    onOpenPermisos={onOpenPermisos}
                    onEliminarUsuario={onEliminarUsuario}
                    onReactivarUsuario={onReactivarUsuario}
                  />
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

UserTable.propTypes = {
  usuarios: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isEncargado: PropTypes.bool.isRequired,
  cargoLoading: PropTypes.object.isRequired,
  memorandumLoading: PropTypes.object.isRequired,
  actionLoading: PropTypes.object.isRequired,
  onCargoChange: PropTypes.func.isRequired,
  onMemorandumChange: PropTypes.func.isRequired,
  onOpenPermisos: PropTypes.func.isRequired,
  onEliminarUsuario: PropTypes.func.isRequired,
  onReactivarUsuario: PropTypes.func.isRequired,
};

export default UserTable;
