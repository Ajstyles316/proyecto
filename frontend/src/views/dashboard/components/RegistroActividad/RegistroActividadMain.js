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
import ExportToPDFButton from './ExportPDFButton';
import { fetchMaquinarias } from '../Reportes/serviciosAPI';

const MODULOS_SEGUIMIENTO = [
  'Usuarios',
  'Autenticación',
  'Maquinaria',
  'Depreciación',
  'Pronóstico',
  'Asignación',
  'Control',
  'ControlOdometro',
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
  'ControlOdometro': 'Control de Odómetros',
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

// Función para normalizar strings (quitar acentos y convertir a minúsculas)
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const getAccionChip = (accion) => {
  const colorMap = {
    'crear': 'success',
    'actualizar': 'info',
    'eliminar': 'error',
    'eliminar_permanentemente': 'error',
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
    'editar_impuesto': 'info',
    'crear_liberacion': 'success',
    'crear_control_odometro': 'success',
    // Reactivar actions - warning color
    'reactivar_soat': 'warning',
    'reactivar_seguro': 'warning',
    'reactivar_mantenimiento': 'warning',
    'reactivar_control': 'warning',
    'reactivar_asignacion': 'warning',
    'reactivar_maquinaria': 'warning',
    'reactivar_depreciacion': 'warning',
    'reactivar_itv': 'warning',
    'reactivar_impuesto': 'warning',
    'reactivar_usuario': 'warning',
    'reactivar_pronostico': 'warning',
    'reactivar_liberacion': 'warning',
    'reactivar_control_odometro': 'warning',
    // Desactivar actions - error color (ensuring all are red)
    'desactivar_liberacion': 'error',
    'desactivar_maquinaria': 'error',
    'desactivar_depreciacion': 'error',
    'desactivar_itv': 'error',
    'desactivar_impuesto': 'error',
    'desactivar_usuario': 'error',
    'desactivar_pronostico': 'error',
    'desactivar_control_odometro': 'error',
  };
  
  // Special handling for "eliminar permanentemente" actions to make them more intense red
  if (accion.includes('eliminar_permanentemente') || 
      accion.includes('eliminar permanente') || 
      accion.includes('eliminar permanentemente') ||
      accion.includes('eliminar_permanente') ||
      accion.includes('eliminar_permanentemente_control') ||
      accion.includes('eliminar_permanentemente_control_odometro') ||
      accion.includes('eliminar_permanentemente_soat') ||
      accion.includes('eliminar_permanentemente_seguro') ||
      accion.includes('eliminar_permanentemente_mantenimiento') ||
      accion.includes('eliminar_permanentemente_asignacion') ||
      accion.includes('eliminar_permanentemente_maquinaria') ||
      accion.includes('eliminar_permanentemente_depreciacion') ||
      accion.includes('eliminar_permanentemente_itv') ||
      accion.includes('eliminar_permanentemente_impuesto') ||
      accion.includes('eliminar_permanentemente_usuario') ||
      accion.includes('eliminar_permanentemente_pronostico') ||
      accion.includes('eliminar_permanentemente_liberacion')) {
    return (
      <Chip
        label={formatAccion(accion)}
        color="error"
        size="small"
        variant="filled"
        sx={{ 
          fontSize: '0.7rem',
          height: 20,
          backgroundColor: '#d32f2f',
          color: 'white',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  }
  
  return (
    <Chip
      label={formatAccion(accion)}
      color={colorMap[accion] || 'default'}
      size="small"
      variant="outlined"
      sx={{ 
        fontSize: '0.7rem',
        height: 20,
        '& .MuiChip-label': {
          px: 1
        }
      }}
    />
  );
};

// Función auxiliar para formato de acciones
const formatAccion = (accion) => {
  if (!accion) return 'N/A';
  
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
    'editar_impuesto': 'Editar impuesto',
    'crear_liberacion': 'Crear liberación',
    'crear_control_odometro': 'Crear control odómetro',
    'editar_control_odometro': 'Editar control odómetro',
    // Reactivar actions
    'reactivar_soat': 'Reactivar SOAT',
    'reactivar_seguro': 'Reactivar seguro',
    'reactivar_mantenimiento': 'Reactivar mantenimiento',
    'reactivar_control': 'Reactivar control',
    'reactivar_asignacion': 'Reactivar asignación',
    'reactivar_maquinaria': 'Reactivar maquinaria',
    'reactivar_depreciacion': 'Reactivar depreciación',
    'reactivar_itv': 'Reactivar ITV',
    'reactivar_impuesto': 'Reactivar impuesto',
    'reactivar_usuario': 'Reactivar usuario',
    'reactivar_pronostico': 'Reactivar pronóstico',
    'reactivar_liberacion': 'Reactivar liberación',
    'reactivar_control_odometro': 'Reactivar control odómetro',
    // Desactivar actions
    'desactivar_liberacion': 'Desactivar liberación',
    'desactivar_maquinaria': 'Desactivar maquinaria',
    'desactivar_depreciacion': 'Desactivar depreciación',
    'desactivar_itv': 'Desactivar ITV',
    'desactivar_impuesto': 'Desactivar impuesto',
    'desactivar_usuario': 'Desactivar usuario',
    'desactivar_pronostico': 'Desactivar pronóstico',
    'desactivar_control_odometro': 'Desactivar control odómetro',
    // Eliminar permanentemente actions
    'eliminar_permanentemente_control': 'Eliminar permanentemente control',
    'eliminar_permanentemente_soat': 'Eliminar permanentemente SOAT',
    'eliminar_permanentemente_seguro': 'Eliminar permanentemente seguro',
    'eliminar_permanentemente_mantenimiento': 'Eliminar permanentemente mantenimiento',
    'eliminar_permanentemente_asignacion': 'Eliminar permanentemente asignación',
    'eliminar_permanentemente_maquinaria': 'Eliminar permanentemente maquinaria',
    'eliminar_permanentemente_depreciacion': 'Eliminar permanentemente depreciación',
    'eliminar_permanentemente_itv': 'Eliminar permanentemente ITV',
    'eliminar_permanentemente_impuesto': 'Eliminar permanentemente impuesto',
    'eliminar_permanentemente_usuario': 'Eliminar permanentemente usuario',
    'eliminar_permanentemente_pronostico': 'Eliminar permanentemente pronóstico',
    'eliminar_permanentemente_liberacion': 'Eliminar permanentemente liberación',
    'eliminar_permanentemente_control_odometro': 'Eliminar permanentemente control odómetro',
  };

  return accionMap[accion] || 
    accion.charAt(0).toUpperCase() + 
    accion.slice(1)
      .replace(/_/g, ' ')
      .replace(/SesióN/g, 'Sesión')
      .replace(/AsignacióN/g, 'Asignación')
      .replace(/DepreciacióN/g, 'Depreciación');
};

const capitalizeWords = (str) => {
  if (!str) return '';
  
  // Verificar si es un módulo que necesita mapeo específico
  if (MODULO_MAP[str]) {
    return MODULO_MAP[str];
  }
  
  return str
    .replace(/cióN/g, 'ción')
    .replace(/sióN/g, 'sión')
    .replace(/DepreciaciónNes/g, 'Depreciaciones')
    .replace(/AsignacióN/g, 'Asignación')
    .replace(/DepreciacióN/g, 'Depreciación')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bPara\b/g, 'para')
    .replace(/\bCon\b/g, 'con')
    .replace(/\bSin\b/g, 'sin');
};

const RegistroActividadMain = () => {
  const { user } = useUser();
  const [seguimientoData, setSeguimientoData] = useState([]);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ usuario: '', modulo: '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

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
      
      // Cargar maquinarias para reemplazar IDs con placas
      try {
        const maquinariasData = await fetchMaquinarias();
        setMaquinarias(maquinariasData);
      } catch (maqError) {
        console.warn('No se pudieron cargar las maquinarias:', maqError);
      }
    } catch (err) {
      setError('No se pudo cargar el registro de actividad');
    } finally {
      setLoading(false);
    }
  };

  // CORRECCIÓN DEL FILTRO DE MÓDULOS - AHORA FUNCIONA CORRECTAMENTE
  const filteredData = seguimientoData.filter(row => {
    const { usuario, modulo, desde, hasta } = filters;
    let ok = true;
    
    if (usuario) ok = ok && (row.usuario_email === usuario);
    
    if (modulo) {
      // Normalizamos para ignorar acentos y diferencias de mayúsculas
      const normalizedModulo = normalizeString(modulo);
      
      // Buscamos el módulo en el mapa normalizado
      const moduloBackend = Object.keys(MODULO_MAP).find(key => 
        normalizeString(MODULO_MAP[key]) === normalizedModulo
      );
      
      if (moduloBackend) {
        // Comparamos normalizando el valor del backend
        ok = ok && normalizeString(row.modulo) === normalizeString(moduloBackend);
      } else {
        // Si no está en el mapa, comparamos directamente normalizando
        ok = ok && normalizeString(row.modulo) === normalizedModulo;
      }
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

  // Función para procesar mensaje y reemplazar IDs de maquinaria con placas
  const procesarMensaje = (mensaje) => {
    if (!mensaje || typeof mensaje !== 'string') return mensaje;
    
    // Buscar IDs de maquinaria en el mensaje (patrón: 24 caracteres hexadecimales)
    const idPattern = /[a-f0-9]{24}/g;
    let mensajeProcesado = mensaje;
    
    const idsEncontrados = mensaje.match(idPattern);
    if (idsEncontrados) {
      idsEncontrados.forEach(id => {
        // Buscar la maquinaria correspondiente
        const maquinaria = maquinarias.find(m => 
          m._id === id || m._id?.$oid === id || m.id === id
        );
        
        if (maquinaria && maquinaria.placa) {
          // Reemplazar el ID con la placa
          mensajeProcesado = mensajeProcesado.replace(id, maquinaria.placa);
        }
      });
    }
    
    return mensajeProcesado;
  };

  // Función para calcular tiempo de conexión
  const calcularTiempoConexion = (row) => {
    if (row.accion === 'login') {
      const logoutRecord = seguimientoData.find(r => 
        r.accion === 'logout' && 
        r.usuario_email === row.usuario_email &&
        new Date(r.fecha_hora) > new Date(row.fecha_hora)
      );
      
      if (logoutRecord) {
        const diffMs = new Date(logoutRecord.fecha_hora) - new Date(row.fecha_hora);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins}m`;
      }
      return 'Conectado actualmente';
    }
    
    return '';
  };

  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: 3, 
      boxShadow: 3, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary.main">
          Registro de Actividad
        </Typography>
        
        {/* Botón de exportación PDF */}
        <ExportToPDFButton
          seguimientoData={seguimientoData}
          filteredData={filteredData}
          seguimientoUsuarios={seguimientoUsuarios}
        />
      </Box>

      {/* Filtros */}
      <Box display="flex" flexWrap="wrap" gap={1} mb={2} alignItems="center" 
           sx={{ 
             p: 1.5, 
             borderRadius: 2, 
             background: theme => theme.palette.grey[50], 
             boxShadow: 1,
             border: '1px solid',
             borderColor: 'divider'
           }}>
        <FilterAltIcon color="primary" sx={{ fontSize: 20 }} />
        <Select
          value={filters.usuario}
          onChange={e => setFilters(f => ({ ...f, usuario: e.target.value }))}
          displayEmpty
          size="small"
          sx={{ 
            minWidth: 200, 
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              py: 0.7
            }
          }}
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
          sx={{ 
            minWidth: 150, 
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              py: 0.7
            }
          }}
        >
          <MenuItem value="">Todos los módulos</MenuItem>
          {MODULOS_SEGUIMIENTO.map(m => (
            <MenuItem key={m} value={m} sx={{ fontSize: '0.875rem' }}>
              {m}
            </MenuItem>
          ))}
        </Select>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary">Desde</Typography>
          <input
            type="date"
            value={filters.desde}
            onChange={e => setFilters(f => ({ ...f, desde: e.target.value }))}
            style={{ 
              border: '1px solid #ccc', 
              borderRadius: 4, 
              padding: '4px 6px', 
              fontSize: '0.75rem',
              height: 28
            }}
          />
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary">Hasta</Typography>
          <input
            type="date"
            value={filters.hasta}
            onChange={e => setFilters(f => ({ ...f, hasta: e.target.value }))}
            style={{ 
              border: '1px solid #ccc', 
              borderRadius: 4, 
              padding: '4px 6px', 
              fontSize: '0.75rem',
              height: 28
            }}
          />
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          sx={{ 
            ml: 'auto', 
            borderRadius: 2, 
            fontWeight: 500, 
            fontSize: '0.75rem',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
          onClick={() => setFilters({ usuario: '', modulo: '', desde: '', hasta: '' })}
        >
          Limpiar filtros
        </Button>
      </Box>

      {/* Tabla de auditoría */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress color="primary" thickness={4} size={36} />
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
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: 'action.hover'
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                }
              }}>
                <TableHead sx={{ background: theme => theme.palette.grey[100] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Fecha/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Acción</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Módulo</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Mensaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow key={idx} sx={{ 
                      '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                      '&:nth-of-type(even)': { backgroundColor: 'background.default' }
                    }}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-ES') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        <Tooltip title={row.usuario_email || ''} arrow>
                          <span>{(() => {
                            const u = seguimientoUsuarios.find(x => x.email === row.usuario_email);
                            if (u && u.nombre) return u.nombre;
                            if (row.usuario_email) return row.usuario_email;
                            return 'Usuario desconocido';
                          })()}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        {getAccionChip(row.accion)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{capitalizeWords(row.modulo)}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        <Box sx={{ 
                          whiteSpace: 'pre-line', 
                          color: 'text.secondary', 
                          maxWidth: 250, 
                          overflowWrap: 'break-word',
                          lineHeight: 1.4
                        }}>
                          {(() => {
                            let mensaje = '';
                            if (typeof row.mensaje === 'object' && row.mensaje !== null) {
                              if (row.accion === 'cambio_permisos' && row.mensaje.usuario_afectado_email) {
                                mensaje = `Usuario: ${row.mensaje.usuario_afectado_nombre || ''} (${row.mensaje.usuario_afectado_email || ''})\nCargo: ${row.mensaje.usuario_afectado_cargo || ''}\nUnidad: ${row.mensaje.usuario_afectado_unidad || ''}`;
                              } else {
                                mensaje = Object.entries(row.mensaje).map(([k, v]) => 
                                  `${capitalizeWords(k)}: ${capitalizeWords(String(v))}`).join('\n');
                              }
                            } else {
                              mensaje = capitalizeWords(row.mensaje) || '-';
                            }
                            
                            if (row.accion === 'login' || row.accion === 'logout') {
                              const tiempoConexion = calcularTiempoConexion(row);
                              if (tiempoConexion) {
                                mensaje += `\nTiempo de conexión: ${tiempoConexion}`;
                              }
                            }
                            
                            // Procesar mensaje para reemplazar IDs de maquinaria con placas
                            return procesarMensaje(mensaje);
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
                  size="medium"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      fontWeight: 500
                    }
                  }}
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