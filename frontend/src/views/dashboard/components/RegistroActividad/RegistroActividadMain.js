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
  'Asignación',
  'Control',
  'SOAT',
  'ITV',
  'Seguro',
  'Mantenimiento',
  'Impuesto',
];

// Mapeo específico para módulos que vienen del backend
const MODULO_MAP = {
  'ActaAsignacion': 'Asignación',
  'HistorialControl': 'Control',
  'SOAT': 'SOAT',
  'ITV': 'ITV',
  'Seguro': 'Seguro',
  'Mantenimiento': 'Mantenimiento',
  'Impuesto': 'Impuesto',
  'Depreciacion': 'Depreciación',
  'Maquinaria': 'Maquinaria',
  'Autenticacion': 'Autenticación',
  'Usuarios': 'Usuarios',
  'Pronostico': 'Pronóstico',
  'Reportes': 'Reportes'
};

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
    'editar_maquinaria': 'info',
    'desactivar_soat': 'error',
    'crear_soat': 'success',
    'editar_asignacion': 'info',
    'editar_soat': 'info',
    'desactivar_asignacion': 'error',
    'crear_asignacion': 'success',
    'crear_seguro': 'success',
    'editar_seguro': 'info',
    'desactivar_seguro': 'error',
    'crear_mantenimiento': 'success',
    'editar_mantenimiento': 'info',
    'desactivar_mantenimiento': 'error',
    'crear_control': 'success',
    'editar_control': 'info',
    'desactivar_control': 'error',
    'crear_depreciacion': 'success',
    'inicio_sesion': 'primary',
    'crear_itv': 'success',
    'editar_itv': 'info',
    'crear_impuesto': 'success',
    'editar_impuesto': 'info'
  };
  
  // Función para formatear la acción
  const formatAccion = (accion) => {
    if (!accion) return 'N/A';
    
         // Mapeo específico para acciones comunes
     const accionMap = {
       'crear_soat': 'Crear SOAT',
       'desactivar_soat': 'Desactivar SOAT',
       'editar_soat': 'Editar SOAT',
       'crear_seguro': 'Crear seguro',
       'editar_seguro': 'Editar seguro',
       'desactivar_seguro': 'Desactivar seguro',
       'crear_mantenimiento': 'Crear mantenimiento',
       'editar_mantenimiento': 'Editar mantenimiento',
       'desactivar_mantenimiento': 'Desactivar mantenimiento',
       'crear_control': 'Crear control',
       'editar_control': 'Editar control',
       'desactivar_control': 'Desactivar control',
       'editar_asignacion': 'Editar asignación',
       'desactivar_asignacion': 'Desactivar asignación',
       'crear_asignacion': 'Crear asignación',
       'editar_maquinaria': 'Editar maquinaria',
       'editar_depreciacion': 'Editar depreciación',
       'crear_depreciacion': 'Crear depreciación',
       'inicio_sesion': 'Inicio de sesión',
       'cambio_permisos': 'Cambio de permisos',
       'registro_usuario': 'Registro de usuario',
       'editar_perfil': 'Editar perfil',
       'crear_itv': 'Crear ITV',
       'editar_itv': 'Editar ITV',
       'crear_impuesto': 'Crear impuesto',
       'editar_impuesto': 'Editar impuesto'
     };
    
    // Si existe un mapeo específico, usarlo
    if (accionMap[accion]) {
      return accionMap[accion];
    }
    
    // Si no, aplicar formateo general
    const formatted = accion.charAt(0).toUpperCase() + accion.slice(1).replace(/_/g, ' ');
    
    // Aplicar correcciones adicionales al resultado
    return formatted
      .replace(/SesióN/g, 'Sesión')
      .replace(/AsignacióN/g, 'Asignación')
      .replace(/DepreciacióN/g, 'Depreciación');
  };
  
  return (
    <Chip
      label={formatAccion(accion)}
      color={colorMap[accion] || 'default'}
      size="small"
      variant="outlined"
    />
  );
};

const capitalizeWords = (str) => {
  if (!str) return '';
  
  // Verificar si es un módulo que necesita mapeo específico
  if (MODULO_MAP[str]) {
    return MODULO_MAP[str];
  }
  
  // Correcciones específicas para mensajes problemáticos
  if (str.includes('De Sin Detalle Para Maquinaria')) {
    return str.replace('De Sin Detalle Para Maquinaria', 'de sin detalle para maquinaria');
  }
  if (str.includes('Para Maquinaria')) {
    return str.replace(/Para Maquinaria/g, 'para maquinaria');
  }
  if (str.includes('Con Placa')) {
    return str.replace(/Con Placa/g, 'con placa');
  }
  if (str.includes('De Sin Detalle')) {
    return str.replace(/De Sin Detalle/g, 'de sin detalle');
  }
  
  // Corrección específica para el problema de la N mayúscula
  if (str.includes('ióN')) {
    str = str.replace(/ióN/g, 'ión');
  }
  if (str.includes('AsignacióN')) {
    str = str.replace(/AsignacióN/g, 'Asignación');
  }
  if (str.includes('DepreciacióN')) {
    str = str.replace(/DepreciacióN/g, 'Depreciación');
  }
  if (str.includes('AutenticacióN')) {
    str = str.replace(/AutenticacióN/g, 'Autenticación');
  }
  if (str.includes('SesióN')) {
    str = str.replace(/SesióN/g, 'Sesión');
  }
  
  // Corregir terminaciones incorrectas con N mayúscula
  let correctedStr = str
    .replace(/cióN/g, 'ción')
    .replace(/sióN/g, 'sión')
    .replace(/DepreciaciónNes/g, 'Depreciaciones')
    .replace(/ActaAsignacióN/g, 'Asignación')
    .replace(/AutenticacióN/g, 'Autenticación')
    .replace(/SesióN/g, 'Sesión')
    .replace(/AsignacióN/g, 'Asignación')
    .replace(/DepreciacióN/g, 'Depreciación')
    .replace(/AsignacióN/g, 'Asignación')
    .replace(/DepreciacióN/g, 'Depreciación')
    .replace(/AutenticacióN/g, 'Autenticación')
    .replace(/SesióN/g, 'Sesión')
    .replace(/PronósticóN/g, 'Pronóstico')
    .replace(/ReportéN/g, 'Reportes')
    .replace(/UsuarióN/g, 'Usuarios')
    .replace(/MaquinariáN/g, 'Maquinaria')
    .replace(/ContróN/g, 'Control')
    .replace(/SeguróN/g, 'Seguro')
    .replace(/MantenimientóN/g, 'Mantenimiento')
    .replace(/ImpuestóN/g, 'Impuesto')
    .replace(/ITVóN/g, 'ITV')
    .replace(/SOATóN/g, 'SOAT');
  
  // Corregir casos específicos de mayúsculas incorrectas en preposiciones y artículos
  correctedStr = correctedStr
    .replace(/\bDe\b/g, 'de')
    .replace(/\bPara\b/g, 'para')
    .replace(/\bCon\b/g, 'con')
    .replace(/\bSin\b/g, 'sin')
    .replace(/\bPor\b/g, 'por')
    .replace(/\bEn\b/g, 'en')
    .replace(/\bSobre\b/g, 'sobre')
    .replace(/\bEntre\b/g, 'entre')
    .replace(/\bHasta\b/g, 'hasta')
    .replace(/\bDesde\b/g, 'desde')
    .replace(/\bHacia\b/g, 'hacia')
    .replace(/\bSegún\b/g, 'según')
    .replace(/\bMediante\b/g, 'mediante')
    .replace(/\bDurante\b/g, 'durante')
    .replace(/\bContra\b/g, 'contra')
    .replace(/\bTras\b/g, 'tras')
    .replace(/\bAnte\b/g, 'ante')
    .replace(/\bBajo\b/g, 'bajo')
    .replace(/\bCabe\b/g, 'cabe')
    .replace(/\bSobre\b/g, 'sobre')
    .replace(/\bTras\b/g, 'tras');
  
  // Corregir casos específicos de combinaciones incorrectas
  correctedStr = correctedStr
    .replace(/\bDe Sin Detalle\b/g, 'de sin detalle')
    .replace(/\bDe sin Detalle\b/g, 'de sin detalle')
    .replace(/\bDe Sin detalle\b/g, 'de sin detalle')
    .replace(/\bDe Sin Detalle Para Maquinaria\b/g, 'de sin detalle para maquinaria')
    .replace(/\bPara Maquinaria\b/g, 'para maquinaria')
    .replace(/\bCon Placa\b/g, 'con placa');
  
  // Si el string ya tiene espacios y parece estar bien formateado, devolverlo tal como está
  if (correctedStr.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(correctedStr)) {
    return correctedStr;
  }
  
  // Si es un string con guiones bajos, procesarlo
  if (correctedStr.includes('_')) {
    return correctedStr.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // Para otros casos, solo capitalizar la primera letra
  return correctedStr.charAt(0).toUpperCase() + correctedStr.slice(1).toLowerCase();
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
    if (modulo) {
      // Convertir el módulo del filtro al formato del backend para comparar
      const moduloBackend = Object.keys(MODULO_MAP).find(key => MODULO_MAP[key] === modulo);
      ok = ok && (row.modulo === moduloBackend || row.modulo === modulo);
    }
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
              <Table size="small" sx={{ 
                minWidth: 600,
                '& .MuiTableCell-root': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)',
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: '2px solid rgba(224, 224, 224, 1)',
                  fontWeight: 700,
                }
              }}>
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
                    <TableRow key={idx} sx={{ 
                      '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                      '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                    }}>
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