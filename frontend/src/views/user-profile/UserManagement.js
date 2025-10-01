import { useEffect, useState } from 'react';
import { useUser, useIsReadOnlyForModule } from '../../components/hooks';
import { Box, Typography, Button, Snackbar, Alert, TextField, Select, MenuItem, InputLabel, FormControl, Pagination } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import RegistrosDesactivadosButton from '../dashboard/components/RegistrosDesactivados/RegistrosDesactivadosButton';
import AddIcon from '@mui/icons-material/Add';

// Importar componentes de user-table
import UserTable from './user-table/UserTable';
import PermissionsModal from './user-table/PermissionsModal';
import DeactivateUserModal from './user-table/DeactivateUserModal';

// Importar componentes de user-creation
import CreateUserModal from './user-creation/CreateUserModal';

// Regex para validación de email y contraseña
const EMAIL_REGEX = /^[\w.-]+@(gmail\.com|enc\.cof\.gob\.bo|tec\.cof\.gob\.bo)$/i;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// Función para generar contraseña automática
const generatePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Completar hasta 8 caracteres mínimo
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const UserManagement = () => {
  const { user } = useUser();
  const isReadOnly = useIsReadOnlyForModule('Usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalPermisos, setModalPermisos] = useState({ open: false, usuario: null, permisos: {} });
  
  // Estado para el modal de desactivación de usuario
  const [desactivarUsuarioModal, setDesactivarUsuarioModal] = useState({ open: false, usuarioId: null });
  const [justificacionDesactivacion, setJustificacionDesactivacion] = useState('');
  
  // Estado para el modal de crear usuario
  const [crearUsuarioModal, setCrearUsuarioModal] = useState({ open: false });
  const [crearUsuarioForm, setCrearUsuarioForm] = useState({
    Nombre: "",
    Cargo: "",
    Unidad: "",
    Email: "",
    Password: "",
  });
  const [crearUsuarioErrors, setCrearUsuarioErrors] = useState({});
  const [crearUsuarioLoading, setCrearUsuarioLoading] = useState(false);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [opcionesCrearUsuario, setOpcionesCrearUsuario] = useState({ cargos: [], unidades: [] });
  const [loadingOpcionesCrearUsuario, setLoadingOpcionesCrearUsuario] = useState(false);
  
  const [cargoLoading, setCargoLoading] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [permisosLoading, setPermisosLoading] = useState(false);
  const [memorandumLoading, setMemorandumLoading] = useState({});

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsuarios = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/`, {
      headers: { 'X-User-Email': user.Email }
    })
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      usuario.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.CarnetIdentidad?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCargo = !cargoFilter || usuario.Cargo === cargoFilter;
    
    return matchesSearch && matchesCargo;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Resetear página cuando cambien los filtros
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCargoFilterChange = (e) => {
    setCargoFilter(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!user || (user.Cargo.toLowerCase() !== 'admin' && user.Cargo.toLowerCase() !== 'encargado')) return;
    fetchUsuarios();
  }, [user]);

  const handleCargoChange = (id, newCargo) => {
    setCargoLoading(prev => ({ ...prev, [id]: true }));
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/${id}/cargo/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email
      },
      body: JSON.stringify({ Cargo: newCargo })
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Error al actualizar cargo');
        }
        return data;
      })
      .then(data => {
        setUsuarios(usuarios => usuarios.map(u => (u._id?.$oid || u._id) === id ? data : u));
        setSnackbar({ open: true, message: 'Cargo actualizado', severity: 'success' });
      })
      .catch((e) => setSnackbar({ open: true, message: e.message || 'Error al actualizar cargo', severity: 'error' }))
      .finally(() => {
        setCargoLoading(prev => ({ ...prev, [id]: false }));
      });
  };

  const handleMemorandumChange = (id, newMemorandum) => {
    setMemorandumLoading(prev => ({ ...prev, [id]: true }));
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/${id}/memorandum/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.Email
      },
      body: JSON.stringify({ Memorandum: newMemorandum })
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Error al actualizar memorandum');
        }
        return data;
      })
      .then(data => {
        setUsuarios(usuarios => usuarios.map(u => (u._id?.$oid || u._id) === id ? data : u));
        setSnackbar({ open: true, message: 'Memorandum actualizado', severity: 'success' });
      })
      .catch((e) => setSnackbar({ open: true, message: e.message || 'Error al actualizar memorandum', severity: 'error' }))
      .finally(() => {
        setMemorandumLoading(prev => ({ ...prev, [id]: false }));
      });
  };
  
  const handleEliminarUsuario = (id) => {
    setDesactivarUsuarioModal({ open: true, usuarioId: id });
    setJustificacionDesactivacion('');
  };
  
  const confirmarDesactivarUsuario = () => {
  const { usuarioId } = desactivarUsuarioModal;
  if (!usuarioId || !justificacionDesactivacion.trim()) {
    setSnackbar({ 
      open: true, 
      message: 'La justificación es obligatoria', 
      severity: 'error' 
    });
    return;
  }
  
  setActionLoading(prev => ({ ...prev, [`delete_${usuarioId}`]: true }));
  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/${usuarioId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': user.Email
    },
    body: JSON.stringify({ 
      justificacion: justificacionDesactivacion.trim(),
      desactivado_por: user.Email
    })
  })
  .then(res => {
    if (res.ok) {
      setSnackbar({ open: true, message: 'Usuario desactivado exitosamente!', severity: 'success' });
        fetchUsuarios();
    } else {
      setSnackbar({ open: true, message: 'Error al desactivar usuario', severity: 'error' });
    }
  })
  .catch(() => setSnackbar({ open: true, message: 'Error al desactivar usuario', severity: 'error' }))
  .finally(() => {
    setActionLoading(prev => ({ ...prev, [`delete_${usuarioId}`]: false }));
    setDesactivarUsuarioModal({ open: false, usuarioId: null });
  });
};

  const handleReactivarUsuario = (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este usuario?')) return;
    setActionLoading(prev => ({ ...prev, [`reactivate_${id}`]: true }));
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/${id}/`, {
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
      .catch(() => setSnackbar({ open: true, message: 'Error al reactivar usuario', severity: 'error' }))
      .finally(() => {
        setActionLoading(prev => ({ ...prev, [`reactivate_${id}`]: false }));
      });
  };

  const handleOpenPermisos = (usuario) => {
    setModalPermisos({
      open: true,
      usuario,
      permisos: { ...{}, ...usuario.permisos },
    });
  };
  
  const handleClosePermisos = () => setModalPermisos({ open: false, usuario: null, permisos: {} });
  
  const handlePermisosChange = (modulo, nuevosPermisos) => {
    setModalPermisos(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: nuevosPermisos,
      },
    }));
  };
  
  const handleGuardarPermisos = () => {
    setPermisosLoading(true);
    const id = modalPermisos.usuario._id?.$oid || modalPermisos.usuario._id || modalPermisos.usuario.Email;
    const permisosAEnviar = { ...{}, ...modalPermisos.permisos };
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/${id}/permisos/`, {
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
      .catch(() => setSnackbar({ open: true, message: 'Error al actualizar permisos', severity: 'error' }))
      .finally(() => {
        setPermisosLoading(false);
      });
  };

  // Funciones para el modal de crear usuario
  const handleCrearUsuarioChange = (e) => {
    const { name, value } = e.target;
    setCrearUsuarioForm(prev => ({ ...prev, [name]: value }));
    setCrearUsuarioErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowGeneratedPassword(!showGeneratedPassword);
  };

  const validateCrearUsuarioForm = () => {
    const newErrors = {};
    if (!crearUsuarioForm.Nombre.trim()) newErrors.Nombre = "El nombre es obligatorio";
    if (!crearUsuarioForm.Cargo.trim()) newErrors.Cargo = "El cargo es obligatorio";
    if (!crearUsuarioForm.Unidad.trim()) newErrors.Unidad = "La unidad es obligatoria";
    if (!crearUsuarioForm.Email.trim()) newErrors.Email = "El correo es obligatorio";
    else if (!EMAIL_REGEX.test(crearUsuarioForm.Email))
      newErrors.Email = "Solo se permiten correos @gmail.com, @enc.cof.gob.bo o @tec.cof.gob.bo. Ej: usuario@gmail.com";
    if (!crearUsuarioForm.Password.trim()) newErrors.Password = "La contraseña es obligatoria";
    else if (!PASSWORD_REGEX.test(crearUsuarioForm.Password))
      newErrors.Password = "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial. Ej: Ejemplo1!";

    setCrearUsuarioErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerarPassword = () => {
    const newPassword = generatePassword();
    setCrearUsuarioForm(prev => ({ ...prev, Password: newPassword }));
    setCrearUsuarioErrors(prev => ({ ...prev, Password: "" }));
  };

  const handleCrearUsuario = async () => {
    if (!validateCrearUsuarioForm()) return;
    
    setCrearUsuarioLoading(true);
    try {
      const payload = {
        Nombre: crearUsuarioForm.Nombre,
        Cargo: crearUsuarioForm.Cargo,
        Unidad: crearUsuarioForm.Unidad,
        Email: crearUsuarioForm.Email,
        Password: crearUsuarioForm.Password,
        confirmPassword: crearUsuarioForm.Password,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/crear/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-User-Email': user.Email
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data?.error || 'Error al crear usuario');
      }

      setSnackbar({ 
        open: true, 
        message: 'Usuario creado exitosamente. La contraseña ha sido enviada por correo.', 
        severity: 'success' 
      });
      
      setCrearUsuarioForm({
        Nombre: "",
        Cargo: "",
        Unidad: "",
        Email: "",
        Password: "",
      });
      setCrearUsuarioModal({ open: false });
      setShowGeneratedPassword(false);
      
      fetchUsuarios();
      
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.message || 'Error al crear usuario', 
        severity: 'error' 
      });
    } finally {
      setCrearUsuarioLoading(false);
    }
  };

  const handleOpenCrearUsuario = async () => {
    setCrearUsuarioModal({ open: true });
    setLoadingOpcionesCrearUsuario(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/usuarios/opciones/`);
      if (!res.ok) throw new Error("No se pudieron cargar las opciones");
      const data = await res.json();
      setOpcionesCrearUsuario({
        cargos: data.cargos || [],
        unidades: data.unidades || [],
      });
    } catch (e) {
      setOpcionesCrearUsuario({ cargos: [], unidades: [] });
    } finally {
      setLoadingOpcionesCrearUsuario(false);
    }
  };

  const handleCloseCrearUsuario = () => {
    setCrearUsuarioModal({ open: false });
    setCrearUsuarioForm({
      Nombre: "",
      Cargo: "",
      Unidad: "",
      Email: "",
      Password: "",
    });
    setCrearUsuarioErrors({});
    setShowGeneratedPassword(false);
  };

  if (!user || (user.Cargo.toLowerCase() !== 'admin' && user.Cargo.toLowerCase() !== 'encargado')) {
    return <Typography variant="h6" color="error">Acceso denegado</Typography>;
  }
  
  const isAdmin = user.Cargo.toLowerCase() === 'admin';
  const isEncargado = user.Cargo.toLowerCase() === 'encargado';
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">Gestión de Usuarios</Typography>
          {isAdmin && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleOpenCrearUsuario}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Crear Usuario
            </Button>
          )}
        </Box>
        
      {(isAdmin || isEncargado) && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                          <RegistrosDesactivadosButton maquinariaId="all" isAdmin={isAdmin} />
            
            {/* Filtros de usuarios */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ml: 'auto' }}>
              <TextField
                label="Buscar usuarios"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ 
                  minWidth: 250,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#e3f2fd',
                    '&:hover': {
                      backgroundColor: '#bbdefb',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    }
                  }
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Filtrar cargo</InputLabel>
                <Select
                  value={cargoFilter}
                  onChange={handleCargoFilterChange}
                  label="Filtrar cargo"
                  sx={{
                    backgroundColor: '#e8f5e8',
                    '&:hover': {
                      backgroundColor: '#c8e6c9',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Encargado">Encargados</MenuItem>
                  <MenuItem value="Técnico">Técnicos</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" sx={{ 
                backgroundColor: '#fff3e0', 
                px: 2, 
                py: 1, 
                borderRadius: 1,
                fontWeight: 500,
                color: '#e65100'
              }}>
                {filteredUsuarios.length} de {usuarios.length}
              </Typography>
            </Box>
                      </Box>
                    )}
        
        <UserTable
          usuarios={paginatedUsuarios}
          loading={loading}
          user={user}
          isReadOnly={isReadOnly}
          isAdmin={isAdmin}
          isEncargado={isEncargado}
          cargoLoading={cargoLoading}
          memorandumLoading={memorandumLoading}
          actionLoading={actionLoading}
          onCargoChange={handleCargoChange}
          onMemorandumChange={handleMemorandumChange}
          onOpenPermisos={handleOpenPermisos}
          onEliminarUsuario={handleEliminarUsuario}
          onReactivarUsuario={handleReactivarUsuario}
        />
        
        {/* Paginación pequeña */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, page) => setCurrentPage(page)}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        
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
      
        <DeactivateUserModal
          open={desactivarUsuarioModal.open}
          onClose={() => setDesactivarUsuarioModal({ open: false, usuarioId: null })}
          justificacion={justificacionDesactivacion}
          onJustificacionChange={setJustificacionDesactivacion}
          onConfirm={confirmarDesactivarUsuario}
          loading={actionLoading[`delete_${desactivarUsuarioModal.usuarioId}`]}
        />
        
        <PermissionsModal
          open={modalPermisos.open}
          onClose={handleClosePermisos}
          usuario={modalPermisos.usuario}
          permisos={modalPermisos.permisos}
          onPermisosChange={handlePermisosChange}
          onGuardar={handleGuardarPermisos}
          isReadOnly={isReadOnly}
          loading={permisosLoading}
        />
        
        <CreateUserModal
          open={crearUsuarioModal.open}
          onClose={handleCloseCrearUsuario}
          form={crearUsuarioForm}
          errors={crearUsuarioErrors}
          loading={crearUsuarioLoading}
          optionsLoading={loadingOpcionesCrearUsuario}
          options={opcionesCrearUsuario}
          showGeneratedPassword={showGeneratedPassword}
          onFormChange={handleCrearUsuarioChange}
          onGeneratePassword={handleGenerarPassword}
          onTogglePasswordVisibility={handleTogglePasswordVisibility}
          onSubmit={handleCrearUsuario}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default UserManagement;