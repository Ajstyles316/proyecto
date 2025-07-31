import { useEffect, useState } from 'react';
import { useUser } from '../../components/UserContext';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, Paper, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Chip, Tooltip } from '@mui/material';
import RegistrosDesactivadosButton from '../dashboard/components/RegistrosDesactivados/RegistrosDesactivadosButton';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SecurityIcon from '@mui/icons-material/Security';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const cargos = ["Admin", "Encargado", "Técnico"];
const MODULOS = [
  'Dashboard',
  'Maquinaria',
  'Control',
  'Asignación',
  'Mantenimiento',
  'SOAT',
  'Impuestos',
  'Seguros',
  'Inspección Técnica Vehicular',
  'Depreciaciones',
  'Activos',
  'Pronóstico',
  'Reportes'
];
const MODULOS_SEGUIMIENTO = [
  'Usuarios',
  'Autenticación',
  'Maquinaria',
  'Depreciaciones',
  'Pronóstico',
  'Reportes',
];

// Helper para mostrar usuario bonito
const getAccionChip = (accion) => {
  // Acciones legibles
  const map = {
    login: { label: 'Inicio de Sesión', color: 'info' },
    logout: { label: 'Cierre de Sesión', color: 'warning' },
    crear_maquinaria: { label: 'Crear maquinaria', color: 'success' },
    editar_maquinaria: { label: 'Editar maquinaria', color: 'default' },
    eliminar_maquinaria: { label: 'Desactivar maquinaria', color: 'error' },
    reactivar_maquinaria: { label: 'Reactivar maquinaria', color: 'success' },
    crear_control: { label: 'Crear control', color: 'success' },
    editar_control: { label: 'Editar control', color: 'default' },
    eliminar_control: { label: 'Desactivar control', color: 'error' },
    reactivar_historialcontrol: { label: 'Reactivar control', color: 'default' },
    desactivar_control: { label: 'Desactivar control', color: 'error' },
    crear_asignacion: { label: 'Crear asignación', color: 'success' },
    editar_asignacion: { label: 'Editar asignación', color: 'default' },
    eliminar_asignacion: { label: 'Desactivar asignación', color: 'error' },
    reactivar_asignacion: { label: 'Reactivar asignación', color: 'success' },
    crear_mantenimiento: { label: 'Crear mantenimiento', color: 'success' },
    editar_mantenimiento: { label: 'Editar mantenimiento', color: 'default' },
    eliminar_mantenimiento: { label: 'Desactivar mantenimiento', color: 'error' },
    reactivar_mantenimiento: { label: 'Reactivar mantenimiento', color: 'success' },
    crear_soat: { label: 'Crear SOAT', color: 'success' },
    editar_soat: { label: 'Editar SOAT', color: 'default' },
    eliminar_soat: { label: 'Desactivar SOAT', color: 'error' },
    reactivar_soat: { label: 'Reactivar SOAT', color: 'success' },
    crear_impuesto: { label: 'Crear impuesto', color: 'success' },
    editar_impuesto: { label: 'Editar impuesto', color: 'default' },
    eliminar_impuesto: { label: 'Desactivar impuesto', color: 'error' },
    reactivar_impuesto: { label: 'Reactivar impuesto', color: 'success' },
    crear_seguros: { label: 'Crear seguro', color: 'success' },
    editar_seguros: { label: 'Editar seguro', color: 'default' },
    eliminar_seguros: { label: 'Desactivar seguro', color: 'error' },
    reactivar_seguros: { label: 'Reactivar seguro', color: 'success' },
    crear_itv: { label: 'Crear ITV', color: 'success' },
    editar_itv: { label: 'Editar ITV', color: 'default' },
    eliminar_itv: { label: 'Desactivar ITV', color: 'error' },
    reactivar_itv: { label: 'Reactivar ITV', color: 'success' },
    crear_pronostico: { label: 'Crear pronóstico', color: 'success' },
    editar_pronostico: { label: 'Editar pronóstico', color: 'default' },
    eliminar_pronostico: { label: 'Desactivar pronóstico', color: 'error' },
    reactivar_pronostico: { label: 'Reactivar pronóstico', color: 'success' },
    crear_depreciacion: { label: 'Crear depreciación', color: 'success' },
    editar_depreciacion: { label: 'Editar depreciación', color: 'default' },
    eliminar_depreciacion: { label: 'Desactivar depreciación', color: 'error' },
    reactivar_depreciacion: { label: 'Reactivar depreciación', color: 'success' },
    validar: { label: 'Validar', color: 'primary' },
    autorizar: { label: 'Autorizar', color: 'primary' },
    cambio_permisos: { label: 'Cambio de permisos', color: 'warning', icon: <SecurityIcon /> },
    registro_usuario: { label: 'Registro de usuario', color: 'success', icon: <PersonAddIcon /> },
    eliminar_usuario: { label: 'Desactivación de usuario', color: 'error', icon: <BlockIcon /> },
    reactivar_usuario: { label: 'Reactivación de usuario', color: 'success', icon: <RestoreIcon /> },
    editar_perfil: { label: 'Editar perfil', color: 'default' },
  };
  const found = map[accion?.toLowerCase()];
  if (found) {
    const isErrorAction = found.color === 'error';
    return <Chip 
      icon={found.icon} 
      label={found.label} 
      color={found.color} 
      size="small" 
      sx={{ 
        fontWeight: 600, 
        letterSpacing: 0.2,
        ...(isErrorAction && {
          bgcolor: '#d32f2f',
          color: 'white',
          '&:hover': {
            bgcolor: '#b71c1c'
          }
        })
      }} 
    />;
  }
  return <Chip label={accion} size="small" sx={{ fontWeight: 600, bgcolor: '#e0e0e0', letterSpacing: 0.2 }} />;
};

function capitalizeWords(str) {
  if (!str) return '';
  // Reemplazar guiones bajos por espacios
  let formatted = str.replace(/_/g, ' ');
  
  // Capitalizar solo la primera letra de cada palabra, respetando acentos
  formatted = formatted.replace(/\b\w/g, l => l.toUpperCase());
  
  // Corregir casos específicos de ortografía española
  formatted = formatted.replace(/SesióN/g, 'Sesión');
  formatted = formatted.replace(/Inicio De SesióN/g, 'Inicio de Sesión');
  formatted = formatted.replace(/Cierre De SesióN/g, 'Cierre de Sesión');
  
  return formatted;
}

// Función mejorada para capitalizar acciones y módulos
function formatActivityText(text) {
  if (!text) return '';
  // Reemplazar guiones bajos por espacios y capitalizar cada palabra
  let formatted = text.replace(/_/g, ' ');
  // Mapeo específico para acciones
  const actionMap = {
    'crear ': 'Creó ',
    'editar ': 'Editó ',
    'eliminar ': 'Eliminó ',
    'desactivar ': 'Desactivó ',
    'reactivar ': 'Reactivó ',
    'validar ': 'Validó ',
    'autorizar ': 'Autorizó '
  };
  Object.entries(actionMap).forEach(([key, value]) => {
    if (formatted.toLowerCase().startsWith(key)) {
      formatted = formatted.replace(new RegExp('^' + key, 'i'), value);
    }
  });
  // Mapeo específico para módulos
  const moduleMap = {
    'maquinaria': 'Maquinaria',
    'control': 'Control',
    'asignacion': 'Asignación',
    'mantenimiento': 'Mantenimiento',
    'seguro': 'Seguro',
    'itv': 'ITV',
    'soat': 'SOAT',
    'impuesto': 'Impuesto',
    'depreciacion': 'Depreciación',
    'pronostico': 'Pronóstico',
    'usuario': 'Usuario'
  };
  Object.entries(moduleMap).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'gi'), value);
  });
  // Capitalizar palabras restantes
  formatted = formatted.replace(/\b\w/g, l => l.toUpperCase());
  return formatted;
}

// Función para procesar mensajes y reemplazar IDs con nombres reales
function formatMessage(message, accion) {
  if (!message) return '';
  
  // Si es un objeto, procesarlo
  if (typeof message === 'object' && message !== null) {
    if (accion === 'cambio_permisos' && message.usuario_afectado_email) {
      return `Usuario: ${message.usuario_afectado_nombre || ''} (${message.usuario_afectado_email || ''})\nCargo: ${message.usuario_afectado_cargo || ''}\nUnidad: ${message.usuario_afectado_unidad || ''}`;
    }
    
    // Para otros objetos, procesar cada campo
    return Object.entries(message).map(([k, v]) => {
      const key = capitalizeWords(k);
      let value = String(v);
      
      // Reemplazar IDs con nombres más legibles
      if (k === 'maquinaria_id' || k === 'maquinaria') {
        value = 'Maquinaria'; // Aquí podrías hacer una llamada a la API para obtener la placa
      } else if (k === 'control_id' || k === 'control') {
        value = 'Control';
      } else if (k === 'asignacion_id' || k === 'asignacion') {
        value = 'Asignación';
      } else if (k === 'mantenimiento_id' || k === 'mantenimiento') {
        value = 'Mantenimiento';
      } else if (k === 'seguro_id' || k === 'seguro') {
        value = 'Seguro';
      } else if (k === 'itv_id' || k === 'itv') {
        value = 'ITV';
      } else if (k === 'soat_id' || k === 'soat') {
        value = 'SOAT';
      } else if (k === 'impuesto_id' || k === 'impuesto') {
        value = 'Impuesto';
      } else if (k === 'depreciacion_id' || k === 'depreciacion') {
        value = 'Depreciación';
      } else if (k === 'pronostico_id' || k === 'pronostico') {
        value = 'Pronóstico';
      } else if (k === 'usuario_id' || k === 'usuario') {
        value = 'Usuario';
      }
      
      return `${key}: ${value}`;
    }).join('\n');
  }
  
  // Si es un string, procesarlo
  let formatted = String(message);
  
  // Cambiar "Eliminó" por "Desactivó"
  formatted = formatted.replace(/Eliminó/gi, 'Desactivó');
  
  // Eliminar completamente los IDs y patrones específicos
  formatted = formatted.replace(/Con ID [a-f0-9]{24}/gi, '');
  formatted = formatted.replace(/Para Maquinaria [a-f0-9]{24}/gi, '');
  formatted = formatted.replace(/maquinaria [a-f0-9]{24}/gi, 'maquinaria');
  formatted = formatted.replace(/control [a-f0-9]{24}/gi, 'control');
  formatted = formatted.replace(/asignacion [a-f0-9]{24}/gi, 'asignación');
  formatted = formatted.replace(/mantenimiento [a-f0-9]{24}/gi, 'mantenimiento');
  formatted = formatted.replace(/seguro [a-f0-9]{24}/gi, 'seguro');
  formatted = formatted.replace(/itv [a-f0-9]{24}/gi, 'ITV');
  formatted = formatted.replace(/soat [a-f0-9]{24}/gi, 'SOAT');
  formatted = formatted.replace(/impuesto [a-f0-9]{24}/gi, 'impuesto');
  formatted = formatted.replace(/depreciacion [a-f0-9]{24}/gi, 'depreciación');
  formatted = formatted.replace(/pronostico [a-f0-9]{24}/gi, 'pronóstico');
  formatted = formatted.replace(/usuario [a-f0-9]{24}/gi, 'usuario');
  
  // Limpiar espacios extra y caracteres no deseados
  formatted = formatted.replace(/\s+/g, ' ').trim();
  formatted = formatted.replace(/^\s*,\s*/, ''); // Eliminar comas al inicio
  formatted = formatted.replace(/\s*,\s*$/, ''); // Eliminar comas al final
  
  // Capitalizar y limpiar
  return capitalizeWords(formatted);
}

const UserManagement = () => {
  const { user } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalPermisos, setModalPermisos] = useState({ open: false, usuario: null, permisos: {} });
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);

  // Auditoría
  const [seguimientoModal, setSeguimientoModal] = useState(false);
  const [seguimientoLoading, setSeguimientoLoading] = useState(false);
  const [seguimientoError, setSeguimientoError] = useState('');
  const [seguimientoData, setSeguimientoData] = useState([]);
  const [seguimientoFilters, setSeguimientoFilters] = useState({ usuario: '', modulo: '', desde: '', hasta: '' });

  // Filtros únicos para selects
  const seguimientoUsuarios = usuariosRegistrados.map(u => ({ nombre: u.Nombre, email: u.Email, cargo: u.Cargo, unidad: u.Unidad }));

  // Filtrado de auditoría
  const filteredSeguimiento = seguimientoData.filter(row => {
    const { usuario, modulo, desde, hasta } = seguimientoFilters;
    let ok = true;
    if (usuario) ok = ok && (row.usuario_email === usuario);
    if (modulo) ok = ok && row.modulo === modulo;
    if (desde) ok = ok && row.fecha_hora && new Date(row.fecha_hora) >= new Date(desde);
    if (hasta) ok = ok && row.fecha_hora && new Date(row.fecha_hora) <= new Date(hasta + 'T23:59:59');
    return ok;
  });

  // --- PAGINACIÓN EN EL MODAL DE SEGUIMIENTO ---
  const [seguimientoPage, setSeguimientoPage] = useState(1);
  const rowsPerPage = 10;
  const paginatedSeguimiento = filteredSeguimiento.slice((seguimientoPage - 1) * rowsPerPage, seguimientoPage * rowsPerPage);
  const totalSeguimientoPages = Math.ceil(filteredSeguimiento.length / rowsPerPage);

  useEffect(() => {
    if (!user || user.Cargo.toLowerCase() !== 'admin') return;
    fetch('http://localhost:8000/api/usuarios/', {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
      });
  }, [user]);

  const fetchUsuarios = () => {
    if (!user || user.Cargo.toLowerCase() !== 'admin') return;
    fetch('http://localhost:8000/api/usuarios/', {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
      });
  };

  const handleCargoChange = (id, newCargo) => {
    // Solo el admin puede cambiar cargos
    if (user.Cargo?.toLowerCase() !== 'admin') {
      setSnackbar({ open: true, message: 'Solo el administrador puede cambiar roles', severity: 'error' });
      return;
    }
    
    fetch(`http://localhost:8000/api/usuarios/${id}/cargo/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email
      },
      body: JSON.stringify({ Cargo: newCargo })
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(usuarios => usuarios.map(u => (u._id?.$oid || u._id) === id ? data : u));
        setSnackbar({ open: true, message: 'Cargo actualizado', severity: 'success' });
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al actualizar cargo', severity: 'error' }));
  };
  const handleEliminarUsuario = (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este usuario?')) return;
    fetch(`http://localhost:8000/api/usuarios/${id}/`, {
      method: 'DELETE',
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => {
        if (res.ok) {
          setUsuarios(usuarios => usuarios.filter(u => (u._id?.$oid || u._id) !== id));
          setSnackbar({ open: true, message: 'Usuario eliminado', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Error al desactivar usuario', severity: 'error' });
        }
      })
              .catch(() => setSnackbar({ open: true, message: 'Error al desactivar usuario', severity: 'error' }));
  };

  const handleReactivarUsuario = (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este usuario?')) return;
    fetch(`http://localhost:8000/api/usuarios/${id}/`, {
      method: 'PATCH',
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => {
        if (res.ok) {
          setSnackbar({ open: true, message: 'Usuario reactivado exitosamente!', severity: 'success' });
          fetchUsuarios();
        } else {
          setSnackbar({ open: true, message: 'Error al reactivar usuario', severity: 'error' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al reactivar usuario', severity: 'error' }));
  };

  const handleOpenPermisos = (usuario) => {
    // Si el usuario no tiene permisos aún, usar defaultPermisos
    setModalPermisos({
      open: true,
      usuario,
      permisos: { ...{}, ...usuario.permisos },
    });
  };
  const handleClosePermisos = () => setModalPermisos({ open: false, usuario: null, permisos: {} });
  const handleGuardarPermisos = () => {
    // Solo el admin puede gestionar permisos
    if (user.Cargo?.toLowerCase() !== 'admin') {
      setSnackbar({ open: true, message: 'Solo el administrador puede gestionar permisos', severity: 'error' });
      return;
    }
    
    const id = modalPermisos.usuario._id?.$oid || modalPermisos.usuario._id || modalPermisos.usuario.Email;
    // Fusionar defaultPermisos con los permisos actuales para asegurar que todos los módulos estén presentes
    const permisosAEnviar = { ...{}, ...modalPermisos.permisos };
    fetch(`http://localhost:8000/api/usuarios/${id}/permisos/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email,
      },
      body: JSON.stringify({ permisos: permisosAEnviar }),
    })
      .then(res => res.json())
      .then(() => {
        setUsuarios(usuarios => usuarios.map(u => (u._id?.$oid || u._id) === id ? { ...u, permisos: permisosAEnviar } : u));
        setSnackbar({ open: true, message: 'Permisos actualizados', severity: 'success' });
        handleClosePermisos();
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al actualizar permisos', severity: 'error' }));
  };

  const handleOpenSeguimiento = () => {
    setSeguimientoModal(true);
    setSeguimientoLoading(true);
    setSeguimientoError('');
    // Cargar usuarios registrados
    fetch('http://localhost:8000/api/usuarios/', {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => res.json())
      .then(data => {
        setUsuariosRegistrados(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsuariosRegistrados([]));
    // Cargar seguimiento
    fetch('http://localhost:8000/api/seguimiento/', {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener el registro de actividad');
        return res.json();
      })
      .then(data => {
        setSeguimientoData(Array.isArray(data) ? data : []);
        setSeguimientoLoading(false);
      })
      .catch(() => {
        setSeguimientoError('No se pudo cargar el registro de actividad');
        setSeguimientoLoading(false);
      });
  };
  const handleCloseSeguimiento = () => {
    setSeguimientoModal(false);
    setSeguimientoData([]);
    setSeguimientoError('');
    setSeguimientoFilters({ usuario: '', modulo: '', desde: '', hasta: '' });
  };

  if (!user || user.Cargo.toLowerCase() !== 'admin') {
    return <Typography variant="h6" color="error">Acceso denegado</Typography>;
  }

  const isAdmin = user.Cargo.toLowerCase() === 'admin';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={2} fontWeight={700} color="primary.main">Gestión de Usuarios</Typography>
      {isAdmin && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<HistoryIcon />}
            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 2, textTransform: 'none' }}
            onClick={handleOpenSeguimiento}
          >
            Registro de Actividad
          </Button>
          
          {/* Botón de Registros Desactivados (solo para encargados) */}
          <RegistrosDesactivadosButton maquinariaId="all" isEncargado={isAdmin} />
        </Box>
      )}
      <Paper sx={{ overflowX: 'auto', borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ background: theme => theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cargo</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Permisos</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Unidad</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map(u => {
              const id = u._id?.$oid || u._id || u.Email;
              return (
                <TableRow key={id}>
                  <TableCell>{u.Nombre}</TableCell>
                  <TableCell>{u.Email}</TableCell>
                  <TableCell>
                    {id === (user._id?.$oid || user._id) ? (
                      u.Cargo
                    ) : (
                      <Select
                        value={u.Cargo}
                        onChange={e => handleCargoChange(id, e.target.value)}
                        size="small"
                      >
                        {cargos.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {isAdmin && u.Email !== user.Email && (
                      <IconButton onClick={() => handleOpenPermisos(u)}>
                        <VpnKeyIcon />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>{u.Unidad}</TableCell>
                  <TableCell>
                    {id === (user._id?.$oid || user._id) ? (
                      <Typography variant="caption" color="textSecondary">(Tú)</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton color="error" onClick={() => handleEliminarUsuario(id)}>
                          <BlockIcon sx={{ color: '#f44336' }} />
                        </IconButton>
                        {u.activo === false && (
                          <IconButton color="success" onClick={() => handleReactivarUsuario(id)}>
                            <RestoreIcon sx={{ color: '#4caf50' }} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={modalPermisos.open} onClose={handleClosePermisos} maxWidth="md" fullWidth>
        <DialogTitle>Permisos de {modalPermisos.usuario?.Nombre || ''}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Ver</TableCell>
                <TableCell>Editar</TableCell>
                <TableCell>Denegar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MODULOS.map((mod, idx) => {
                const value = modalPermisos.permisos[mod]?.eliminar
                  ? 'denegado'
                  : modalPermisos.permisos[mod]?.editar
                  ? 'editor'
                  : modalPermisos.permisos[mod]?.ver
                  ? 'lector'
                  : '';
                return (
                  <TableRow key={mod}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{mod}</TableCell>
                    <TableCell>
                      <Switch
                        checked={value === 'lector'}
                        onChange={e => {
                          if (e.target.checked) {
                            setModalPermisos(prev => ({
                              ...prev,
                              permisos: {
                                ...prev.permisos,
                                [mod]: { ver: true, editar: false, eliminar: false },
                              },
                            }));
                          }
                        }}
                        color="primary"
                      />
                      Lector
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={value === 'editor'}
                        onChange={e => {
                          if (e.target.checked) {
                            setModalPermisos(prev => ({
                              ...prev,
                              permisos: {
                                ...prev.permisos,
                                [mod]: { ver: true, editar: true, eliminar: false },
                              },
                            }));
                          }
                        }}
                        color="primary"
                      />
                      Editor
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={value === 'denegado'}
                        onChange={e => {
                          if (e.target.checked) {
                            setModalPermisos(prev => ({
                              ...prev,
                              permisos: {
                                ...prev.permisos,
                                [mod]: { ver: false, editar: false, eliminar: true },
                              },
                            }));
                          }
                        }}
                        color="error"
                      />
                      Denegado
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGuardarPermisos} variant="contained" color="success">Guardar</Button>
          <Button onClick={handleClosePermisos} variant="contained" color="error">Salir</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={seguimientoModal} onClose={handleCloseSeguimiento} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="secondary" /> Registro de Actividad
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 350, background: theme => theme.palette.grey[50] }}>
          {/* Filtros */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3} alignItems="center" sx={{ p: 1, borderRadius: 2, background: theme => theme.palette.background.paper, boxShadow: 1 }}>
            <FilterAltIcon color="primary" />
            <Select
              value={seguimientoFilters.usuario}
              onChange={e => setSeguimientoFilters(f => ({ ...f, usuario: e.target.value }))}
              displayEmpty
              size="small"
              sx={{ minWidth: 320 }}
            >
              <MenuItem value="">Todos los usuarios</MenuItem>
              {seguimientoUsuarios.map(u => (
                <MenuItem key={u.email} value={u.email}>
                  {u.nombre} ({u.email}) - {u.cargo}{u.unidad ? `, ${u.unidad}` : ''}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={seguimientoFilters.modulo}
              onChange={e => setSeguimientoFilters(f => ({ ...f, modulo: e.target.value }))}
              displayEmpty
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Todos los módulos</MenuItem>
              {MODULOS_SEGUIMIENTO.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">Desde</Typography>
              <input
                type="date"
                value={seguimientoFilters.desde}
                onChange={e => setSeguimientoFilters(f => ({ ...f, desde: e.target.value }))}
                style={{ border: '1px solid #ccc', borderRadius: 6, padding: '4px 8px', fontSize: 14 }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">Hasta</Typography>
              <input
                type="date"
                value={seguimientoFilters.hasta}
                onChange={e => setSeguimientoFilters(f => ({ ...f, hasta: e.target.value }))}
                style={{ border: '1px solid #ccc', borderRadius: 6, padding: '4px 8px', fontSize: 14 }}
              />
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              sx={{ ml: 'auto', borderRadius: 2, fontWeight: 500 }}
              onClick={() => setSeguimientoFilters({ usuario: '', modulo: '', desde: '', hasta: '' })}
            >
              Limpiar filtros
            </Button>
          </Box>
          {/* Tabla de auditoría */}
          {seguimientoLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress color="primary" />
            </Box>
          ) : seguimientoError ? (
            <Alert severity="error">{seguimientoError}</Alert>
          ) : filteredSeguimiento.length === 0 ? (
            <Alert severity="info">No hay registros de actividad para los filtros seleccionados.</Alert>
          ) : (
            <Table size="small" sx={{ minWidth: 700, background: theme => theme.palette.background.paper, borderRadius: 2, boxShadow: 1 }}>
              <TableHead sx={{ background: theme => theme.palette.grey[200] }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Módulo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSeguimiento.map((row, idx) => {
                  // Mostrar solo el mensaje principal
                  return (
                    <TableRow key={idx} hover>
                      <TableCell>{row.fecha_hora ? new Date(row.fecha_hora).toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        <Tooltip title={row.usuario_email || ''} arrow>
                          <span>{(() => {
                            const u = seguimientoUsuarios.find(x => x.email === row.usuario_email);
                            if (u && u.nombre) return u.nombre;
                            if (row.usuario_email) return row.usuario_email;
                            return 'Usuario desconocido';
                          })()}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{getAccionChip(row.accion)}</TableCell>
                      <TableCell>{formatActivityText(row.modulo || row.accion)}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          whiteSpace: 'pre-line', 
                          fontSize: 14, 
                          color: 'text.secondary', 
                          maxWidth: 320, 
                          overflowWrap: 'break-word'
                        }}>
                          {formatMessage(row.mensaje, row.accion)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          {totalSeguimientoPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                onClick={() => setSeguimientoPage(p => Math.max(1, p - 1))}
                disabled={seguimientoPage === 1}
                sx={{ mr: 1 }}
              >Anterior</Button>
              {[...Array(totalSeguimientoPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={seguimientoPage === i + 1 ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => setSeguimientoPage(i + 1)}
                  sx={{ mx: 0.5, minWidth: 36 }}
                >{i + 1}</Button>
              ))}
              <Button
                onClick={() => setSeguimientoPage(p => Math.min(totalSeguimientoPages, p + 1))}
                disabled={seguimientoPage === totalSeguimientoPages}
                sx={{ ml: 1 }}
              >Siguiente</Button>
            </Box>
          )}
          <Button onClick={handleCloseSeguimiento} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 