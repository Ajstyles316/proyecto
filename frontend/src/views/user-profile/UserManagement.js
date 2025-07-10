import React, { useEffect, useState } from 'react';
import { useUser } from '../../components/UserContext';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, Paper, Snackbar, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const cargos = ["Encargado", "Tecnico"];
const permisos = ["Editor", "Lector", "Denegado"];

const UserManagement = () => {
  const { user } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  if (!user || user.Cargo.toLowerCase() !== 'encargado') {
    return <Typography variant="h6" color="error">Acceso denegado</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={2}>Gestión de Usuarios</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Permiso</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell>Acciones</TableCell>
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
                  <TableCell>
                    {id === (user._id?.$oid || user._id) ? (
                      u.Permiso || 'Editor'
                    ) : (
                      <Select
                        value={u.Permiso || 'Editor'}
                        onChange={e => handlePermisoChange(id, e.target.value)}
                        size="small"
                      >
                        {permisos.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
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
    </Box>
  );
};

export default UserManagement; 