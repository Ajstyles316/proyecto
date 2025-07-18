import { useEffect, useState } from 'react';
import { useUser } from '../../components/UserContext';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, Paper, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SecurityIcon from '@mui/icons-material/Security';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const cargos = ["Encargado", "Tecnico"];
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
    login: { label: 'Inicio de sesión', color: 'info' },
    crear_maquinaria: { label: 'Crear Maquinaria', color: 'success' },
    editar_maquinaria: { label: 'Editar Maquinaria', color: 'default' },
    eliminar_maquinaria: { label: 'Eliminar Maquinaria', color: 'error' },
    crear_control: { label: 'Crear Control', color: 'success' },
    editar_control: { label: 'Editar Control', color: 'default' },
    eliminar_control: { label: 'Eliminar Control', color: 'error' },
    crear_asignacion: { label: 'Crear Asignación', color: 'success' },
    editar_asignacion: { label: 'Editar Asignación', color: 'default' },
    eliminar_asignacion: { label: 'Eliminar Asignación', color: 'error' },
    crear_mantenimiento: { label: 'Crear Mantenimiento', color: 'success' },
    editar_mantenimiento: { label: 'Editar Mantenimiento', color: 'default' },
    eliminar_mantenimiento: { label: 'Eliminar Mantenimiento', color: 'error' },
    crear_soat: { label: 'Crear SOAT', color: 'success' },
    editar_soat: { label: 'Editar SOAT', color: 'default' },
    eliminar_soat: { label: 'Eliminar SOAT', color: 'error' },
    crear_impuesto: { label: 'Crear Impuesto', color: 'success' },
    editar_impuesto: { label: 'Editar Impuesto', color: 'default' },
    eliminar_impuesto: { label: 'Eliminar Impuesto', color: 'error' },
    crear_seguros: { label: 'Crear Seguro', color: 'success' },
    editar_seguros: { label: 'Editar Seguro', color: 'default' },
    eliminar_seguros: { label: 'Eliminar Seguro', color: 'error' },
    crear_itv: { label: 'Crear ITV', color: 'success' },
    editar_itv: { label: 'Editar ITV', color: 'default' },
    eliminar_itv: { label: 'Eliminar ITV', color: 'error' },
    crear_pronostico: { label: 'Crear Pronóstico', color: 'success' },
    editar_pronostico: { label: 'Editar Pronóstico', color: 'default' },
    eliminar_pronostico: { label: 'Eliminar Pronóstico', color: 'error' },
    crear_depreciacion: { label: 'Crear Depreciación', color: 'success' },
    editar_depreciacion: { label: 'Editar Depreciación', color: 'default' },
    eliminar_depreciacion: { label: 'Eliminar Depreciación', color: 'error' },
    validar: { label: 'Validar', color: 'primary' },
    autorizar: { label: 'Autorizar', color: 'primary' },
    cambio_permisos: { label: 'Cambio de permisos', color: 'warning', icon: <SecurityIcon /> },
    registro_usuario: { label: 'Registro de usuario', color: 'success', icon: <PersonAddIcon /> },
    eliminar_usuario: { label: 'Eliminación de usuario', color: 'error', icon: <DeleteIcon /> },
  };
  const found = map[accion?.toLowerCase()];
  if (found) {
    return <Chip icon={found.icon} label={found.label} color={found.color} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', letterSpacing: 0.2 }} />;
  }
  return <Chip label={accion} size="small" sx={{ fontWeight: 600, bgcolor: '#e0e0e0', textTransform: 'capitalize', letterSpacing: 0.2 }} />;
};

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    if (!user || user.Cargo.toLowerCase() !== 'encargado') return;
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
      permisos: { ...{}, ...usuario.permisos },
    });
  };
  const handleClosePermisos = () => setModalPermisos({ open: false, usuario: null, permisos: {} });
  const handleGuardarPermisos = () => {
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
                      <TableCell>{capitalizeWords(row.accion)}</TableCell>
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