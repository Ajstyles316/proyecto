import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Button,
  Pagination,
  Tooltip,
  Chip
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useUser } from '../../../../components/UserContext';

const MODULOS_SEGUIMIENTO = [
  'Usuarios',
  'Autenticación',
  'Maquinaria',
  'Depreciaciones',
  'Pronóstico',
  'Reportes',
];

const getAccionChip = (accion) => {
  const colorMap = {
    'crear': 'success',
    'actualizar': 'info',
    'eliminar': 'error',
    'login': 'primary',
    'logout': 'secondary',
    'cambio_permisos': 'warning',
    'ver': 'default',
    'editar_perfil': 'info',
    'registro_usuario': 'success',
    'editar_depreciacion': 'info',
    'editar_maquinaria': 'info'
  };
  return (
    <Chip
      label={accion ? accion.charAt(0).toUpperCase() + accion.slice(1).replace(/_/g, ' ') : 'N/A'}
      color={colorMap[accion] || 'default'}
      size="small"
      variant="outlined"
    />
  );
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const RegistroActividadMain = () => {
  const { user } = useUser();
  const [seguimientoData, setSeguimientoData] = useState([]);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ usuario: '', modulo: '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 8; // Reducido para que quepa mejor en la pantalla

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar usuarios registrados
      const usuariosRes = await fetch('http://localhost:8000/api/usuarios/', {
        headers: { 'X-User-Email': user.Email }
      });
      const usuariosData = await usuariosRes.json();
      setUsuariosRegistrados(Array.isArray(usuariosData) ? usuariosData : []);

      // Cargar seguimiento
      const seguimientoRes = await fetch('http://localhost:8000/api/seguimiento/', {
        headers: { 'X-User-Email': user.Email }
      });
      
      if (!seguimientoRes.ok) {
        throw new Error('Error al obtener el registro de actividad');
      }
      
      const seguimientoData = await seguimientoRes.json();
      setSeguimientoData(Array.isArray(seguimientoData) ? seguimientoData : []);
    } catch (err) {
      setError('No se pudo cargar el registro de actividad');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de auditoría
  const filteredData = seguimientoData.filter(row => {
    const { usuario, modulo, desde, hasta } = filters;
    let ok = true;
    if (usuario) ok = ok && (row.usuario_email === usuario);
    if (modulo) ok = ok && row.modulo === modulo;
    if (desde) ok = ok && row.fecha_hora && new Date(row.fecha_hora) >= new Date(desde);
    if (hasta) ok = ok && row.fecha_hora && new Date(row.fecha_hora) <= new Date(hasta + 'T23:59:59');
    return ok;
  });

  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const seguimientoUsuarios = usuariosRegistrados.map(u => ({ 
    nombre: u.Nombre, 
    email: u.Email, 
    cargo: u.Cargo, 
    unidad: u.Unidad 
  }));

  // Función para calcular tiempo de conexión
  const calcularTiempoConexion = (row) => {
    // Para login, buscar si hay un logout posterior
    if (row.accion === 'login') {
      // Buscar el logout correspondiente en los datos
      const logoutRecord = seguimientoData.find(r => 
        r.accion === 'logout' && 
        r.usuario_email === row.usuario_email &&
        new Date(r.fecha_hora) > new Date(row.fecha_hora)
      );
      
      if (logoutRecord) {
        const login = new Date(row.fecha_hora);
        const logout = new Date(logoutRecord.fecha_hora);
        const diffMs = logout - login;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
          return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
        } else if (diffHours > 0) {
          return `${diffHours}h ${diffMins % 60}m`;
        } else {
          return `${diffMins}m`;
        }
      } else {
        return 'Conectado actualmente';
      }
    }
    
    // Para logout, usar la fecha de logout del registro
    if (row.accion === 'logout' && row.fecha_logout) {
      // Buscar el login correspondiente
      const loginRecord = seguimientoData.find(r => 
        r.accion === 'login' && 
        r.usuario_email === row.usuario_email &&
        new Date(r.fecha_hora) < new Date(row.fecha_hora)
      );
      
      if (loginRecord) {
        const login = new Date(loginRecord.fecha_hora);
        const logout = new Date(row.fecha_logout);
        const diffMs = logout - login;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
          return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
        } else if (diffHours > 0) {
          return `${diffHours}h ${diffMins % 60}m`;
        } else {
          return `${diffMins}m`;
        }
      }
    }
    
    return '';
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" mb={2} fontWeight={700} color="primary.main">
        Registro de Actividad
      </Typography>

      {/* Filtros */}
      <Box display="flex" flexWrap="wrap" gap={1} mb={2} alignItems="center" 
           sx={{ p: 1, borderRadius: 2, background: theme => theme.palette.grey[50], boxShadow: 1 }}>
        <FilterAltIcon color="primary" sx={{ fontSize: 20 }} />
        <Select
          value={filters.usuario}
          onChange={e => setFilters(f => ({ ...f, usuario: e.target.value }))}
          displayEmpty
          size="small"
          sx={{ minWidth: 200, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Todos los usuarios</MenuItem>
          {seguimientoUsuarios.map(u => (
            <MenuItem key={u.email} value={u.email} sx={{ fontSize: '0.875rem' }}>
              {u.nombre} ({u.email})
            </MenuItem>
          ))}
        </Select>
        <Select
          value={filters.modulo}
          onChange={e => setFilters(f => ({ ...f, modulo: e.target.value }))}
          displayEmpty
          size="small"
          sx={{ minWidth: 120, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Todos los módulos</MenuItem>
          {MODULOS_SEGUIMIENTO.map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.875rem' }}>{m}</MenuItem>)}
        </Select>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary">Desde</Typography>
          <input
            type="date"
            value={filters.desde}
            onChange={e => setFilters(f => ({ ...f, desde: e.target.value }))}
            style={{ border: '1px solid #ccc', borderRadius: 4, padding: '2px 4px', fontSize: '0.75rem' }}
          />
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary">Hasta</Typography>
          <input
            type="date"
            value={filters.hasta}
            onChange={e => setFilters(f => ({ ...f, hasta: e.target.value }))}
            style={{ border: '1px solid #ccc', borderRadius: 4, padding: '2px 4px', fontSize: '0.75rem' }}
          />
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          sx={{ ml: 'auto', borderRadius: 2, fontWeight: 500, fontSize: '0.75rem' }}
          onClick={() => setFilters({ usuario: '', modulo: '', desde: '', hasta: '' })}
        >
          Limpiar filtros
        </Button>
      </Box>

      {/* Tabla de auditoría */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ fontSize: '0.875rem' }}>{error}</Alert>
        ) : filteredData.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>No hay registros de actividad para los filtros seleccionados.</Alert>
        ) : (
          <>
            <Box sx={{ overflow: 'auto', flex: 1 }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead sx={{ background: theme => theme.palette.grey[200] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Fecha/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Acción</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Módulo</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Mensaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:hover': { backgroundColor: theme => theme.palette.action.hover } }}>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        {row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-ES') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Tooltip title={row.usuario_email || ''} arrow>
                          <span>{(() => {
                            const u = seguimientoUsuarios.find(x => x.email === row.usuario_email);
                            if (u && u.nombre) return u.nombre;
                            if (row.usuario_email) return row.usuario_email;
                            return 'Usuario desconocido';
                          })()}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>{getAccionChip(row.accion)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>{capitalizeWords(row.modulo)}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Box sx={{ whiteSpace: 'pre-line', fontSize: '0.75rem', color: 'text.secondary', maxWidth: 250, overflowWrap: 'break-word' }}>
                          {(() => {
                            let mensaje = '';
                            if (typeof row.mensaje === 'object' && row.mensaje !== null) {
                              if (row.accion === 'cambio_permisos' && row.mensaje.usuario_afectado_email) {
                                mensaje = `Usuario: ${row.mensaje.usuario_afectado_nombre || ''} (${row.mensaje.usuario_afectado_email || ''})\nCargo: ${row.mensaje.usuario_afectado_cargo || ''}\nUnidad: ${row.mensaje.usuario_afectado_unidad || ''}`;
                              } else {
                                mensaje = Object.entries(row.mensaje).map(([k, v]) => `${capitalizeWords(k)}: ${capitalizeWords(String(v))}`).join('\n');
                              }
                            } else {
                              mensaje = capitalizeWords(row.mensaje) || '-';
                            }
                            
                            // Agregar tiempo de conexión para login/logout
                            if (row.accion === 'login' || row.accion === 'logout') {
                              const tiempoConexion = calcularTiempoConexion(row);
                              if (tiempoConexion) {
                                mensaje += `\nTiempo de conexión: ${tiempoConexion}`;
                              }
                            }
                            
                            return mensaje;
                          })()}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={1}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default RegistroActividadMain;