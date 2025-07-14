import { useEffect, useState } from 'react';
import { useUser } from '../../components/UserContext';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, Paper, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Radio, RadioGroup, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useTheme } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const cargos = ["Encargado", "Tecnico"];
const permisos = ["Editor", "Lector", "Denegado"];

const MODULOS = [
  'Dashboard',
  'Maquinaria',
  'Control',
  'Asignación',
  'Mantenimiento',
  'SOAT',
  'Impuestos',
  'Seguros',
  'ITV',
  'Depreciaciones',
  'Activos',
  'Pronóstico',
  'Reportes'
];
const ACCIONES = ['ver', 'editar', 'eliminar'];

const defaultPermisos = {};
MODULOS.forEach(mod => {
  defaultPermisos[mod] = { ver: false, editar: false, eliminar: false };
});

const MODULOS_SEGUIMIENTO = [
  'Maquinaria',
  'Control',
  'Asignación',
  'Mantenimiento',
  'Seguros',
  'ITV',
  'Impuestos',
  'SOAT',
  'Pronóstico',
  'Reportes',
];

// Helper para mostrar usuario bonito
const getUsuarioLabel = (email, usuarios) => {
  const u = usuarios.find(x => x.email === email);
  if (u) return `${u.nombre} (${u.email})${u.cargo ? ' - ' + u.cargo : ''}${u.unidad ? ', ' + u.unidad : ''}`;
  return email || '-';
};
// Helper para resaltar acciones
const getAccionChip = (accion) => {
  if (accion === 'cambio_permisos') return <Chip icon={<SecurityIcon />} label="Cambio de permisos" color="warning" size="small" sx={{ fontWeight: 600 }} />;
  if (accion === 'registro_usuario') return <Chip icon={<PersonAddIcon />} label="Registro de usuario" color="success" size="small" sx={{ fontWeight: 600 }} />;
  if (accion === 'eliminar_usuario') return <Chip icon={<DeleteIcon />} label="Eliminación de usuario" color="error" size="small" sx={{ fontWeight: 600 }} />;
  if (accion === 'login') return <Chip label="Login" color="info" size="small" sx={{ fontWeight: 600 }} />;
  return <Chip label={accion} size="small" sx={{ fontWeight: 600, bgcolor: '#e0e0e0' }} />;
};

// Helper para mostrar solo el nombre del usuario
const getUsuarioNombre = (email, usuarios) => {
  const u = usuarios.find(x => x.email === email);
  return u ? u.nombre : (email || '-');
};

const UserManagement = () => {
  const { user } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalPermisos, setModalPermisos] = useState({ open: false, usuario: null, permisos: defaultPermisos });
  const theme = useTheme();

  // Estado para usuarios registrados (para filtro de auditoría)
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);

  // Auditoría
  const [seguimientoModal, setSeguimientoModal] = useState(false);
  const [seguimientoLoading, setSeguimientoLoading] = useState(false);
  const [seguimientoError, setSeguimientoError] = useState('');
  const [seguimientoData, setSeguimientoData] = useState([]);
  const [seguimientoFilters, setSeguimientoFilters] = useState({ usuario: '', modulo: '', desde: '', hasta: '' });

  // Filtros únicos para selects
  const seguimientoUsuarios = usuariosRegistrados.map(u => ({ nombre: u.Nombre, email: u.Email, cargo: u.Cargo, unidad: u.Unidad }));
  const seguimientoModulos = Array.from(new Set(seguimientoData.map(a => a.modulo).filter(Boolean)));

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

  useEffect(() => {
    if (!user || user.Cargo.toLowerCase() !== 'encargado') return;
    fetch('http://localhost:8000/api/usuarios/', {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
        setLoading(false);
      });
  }, [user]);

  const handleCargoChange = (id, newCargo) => {
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

  const handlePermisoChange = (id, newPermiso) => {
    fetch(`http://localhost:8000/api/usuarios/${id}/permiso/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email
      },
      body: JSON.stringify({ Permiso: newPermiso })
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(usuarios => usuarios.map(u => (u._id?.$oid || u._id) === id ? data : u));
        setSnackbar({ open: true, message: 'Permiso actualizado', severity: 'success' });
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al actualizar permiso', severity: 'error' }));
  };

  const handleEliminarUsuario = (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    fetch(`http://localhost:8000/api/usuarios/${id}/`, {
      method: 'DELETE',
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => {
        if (res.ok) {
          setUsuarios(usuarios => usuarios.filter(u => (u._id?.$oid || u._id) !== id));
          setSnackbar({ open: true, message: 'Usuario eliminado', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Error al eliminar usuario', severity: 'error' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al eliminar usuario', severity: 'error' }));
  };

  const handleOpenPermisos = (usuario) => {
    // Si el usuario no tiene permisos aún, usar defaultPermisos
    setModalPermisos({
      open: true,
      usuario,
      permisos: { ...defaultPermisos, ...usuario.permisos },
    });
  };
  const handleClosePermisos = () => setModalPermisos({ open: false, usuario: null, permisos: defaultPermisos });
  const handlePermisoSwitch = (modulo, accion) => (e) => {
    setModalPermisos((prev) => {
      // Si se activa eliminar, denegar todo (ver y editar en false, eliminar en true)
      if (accion === 'eliminar' && e.target.checked) {
        return {
          ...prev,
          permisos: {
            ...prev.permisos,
            [modulo]: { ver: false, editar: false, eliminar: true },
          },
        };
      }
      // Si se desactiva eliminar, restaurar switches a lo que estaban (no forzar nada)
      if (accion === 'eliminar' && !e.target.checked) {
        return {
          ...prev,
          permisos: {
            ...prev.permisos,
            [modulo]: { ...prev.permisos[modulo], eliminar: false },
          },
        };
      }
      // Si se activa ver o editar, desactiva eliminar si estaba activo
      if ((accion === 'ver' || accion === 'editar') && e.target.checked && prev.permisos[modulo].eliminar) {
        return {
          ...prev,
          permisos: {
            ...prev.permisos,
            [modulo]: { ...prev.permisos[modulo], [accion]: true, eliminar: false },
          },
        };
      }
      // Cambio normal
      return {
        ...prev,
        permisos: {
          ...prev.permisos,
          [modulo]: {
            ...prev.permisos[modulo],
            [accion]: e.target.checked,
          },
        },
      };
    });
  };
  const handleGuardarPermisos = () => {
    const id = modalPermisos.usuario._id?.$oid || modalPermisos.usuario._id || modalPermisos.usuario.Email;
    // Fusionar defaultPermisos con los permisos actuales para asegurar que todos los módulos estén presentes
    const permisosAEnviar = { ...defaultPermisos, ...modalPermisos.permisos };
    fetch(`http://localhost:8000/api/usuarios/${id}/permisos/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email,
      },
      body: JSON.stringify({ permisos: permisosAEnviar }),
    })
      .then(res => res.json())
      .then(data => {
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

  if (!user || user.Cargo.toLowerCase() !== 'encargado') {
    return <Typography variant="h6" color="error">Acceso denegado</Typography>;
  }

  const isAdmin = user.Cargo.toLowerCase() === 'encargado';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={2} fontWeight={700} color="primary.main">Gestión de Usuarios</Typography>
      {isAdmin && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<HistoryIcon />}
          sx={{ mb: 2, borderRadius: 2, fontWeight: 600, boxShadow: 2, textTransform: 'none' }}
          onClick={handleOpenSeguimiento}
        >
          Registro de Actividad
        </Button>
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
                      <IconButton color="error" onClick={() => handleEliminarUsuario(id)}>
                        <DeleteIcon sx={{ color: '#f44336' }} />
                      </IconButton>
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
                {filteredSeguimiento.map((row, idx) => {
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
                            return '-';
                          })()}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{getAccionChip(row.accion)}</TableCell>
                      <TableCell>{row.modulo || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ whiteSpace: 'pre-line', fontSize: 14, color: 'text.secondary', maxWidth: 320, overflowWrap: 'break-word' }}>
                          {typeof row.mensaje === 'object' && row.mensaje !== null
                            ? (row.accion === 'cambio_permisos' && row.mensaje.usuario_afectado_email
                                ? `Usuario: ${row.mensaje.usuario_afectado_nombre || ''} (${row.mensaje.usuario_afectado_email || ''})\nCargo: ${row.mensaje.usuario_afectado_cargo || ''}\nUnidad: ${row.mensaje.usuario_afectado_unidad || ''}`
                                : Object.entries(row.mensaje).map(([k, v]) => `${k}: ${v}`).join('\n')
                              )
                            : (row.mensaje || '-')}
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
          <Button onClick={handleCloseSeguimiento} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 