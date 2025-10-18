import { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Typography, Button, Snackbar, Alert, Paper, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { useUser } from 'src/components/UserContext.jsx';
import { useCanCreate, useCanView, useIsPermissionDenied, useIsReadOnly, useUnidades } from 'src/components/hooks';
import BlockIcon from '@mui/icons-material/Block';
import NovedadesTable from './NovedadesTable';
import NovedadesForm from './NovedadesForm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/* -------- helpers -------- */
const strip = (s) =>
  (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();

const detectRoles = (user) => {
  const pool = [
    user?.Cargo, user?.Rol, user?.role, user?.rol,
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.Roles) ? user.Roles : []),
  ].filter(Boolean).map(strip);
  const has = (needle) => pool.some((r) => r.includes(needle));
  return { isTecnico: has('TECNIC'), isEncargado: has('ENCARG'), isAdmin: has('ADMIN') };
};

const safeUnit = (user, fallback = '') =>
  user?.Unidad || user?.unidad || user?.Empresa || user?.empresa || fallback || '';

/* -------- component -------- */
const NovedadesMain = ({ maquinariaPlaca, maquinariaDetalle, maquinariaUnidad }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { user } = useUser();
  const { unidades, normalizeUnidadForDB } = useUnidades();

  // roles / permisos (solo lectura)
  const { isTecnico, isEncargado, isAdmin } = useMemo(() => detectRoles(user || {}), [user]);
  const readOnlyByRole = isEncargado || isAdmin;
  const canView = useCanView('Novedades');
  const canCreate = useCanCreate('Novedades');
  const isReadOnlyGlobal = useIsReadOnly();
  const permissionDenied = useIsPermissionDenied('Novedades') && !isTecnico; // técnico no bloquea

  // Mostrar vista si puede ver o si es técnico
  const allowSee = canView || isTecnico;

  // Unidad del usuario (preferida)
  const ownUnit = useMemo(() => safeUnit(user, maquinariaUnidad), [user, maquinariaUnidad]);

  // Filtros UI
  const [selectedUnit, setSelectedUnit] = useState(isTecnico ? (ownUnit || '') : '');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD

  // Fija unidad para técnico
  useEffect(() => {
    if (!isTecnico) return;
    if (ownUnit) setSelectedUnit(ownUnit);
    else if (!selectedUnit && Array.isArray(unidades) && unidades.length) setSelectedUnit(unidades[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTecnico, ownUnit, unidades]);

  // Catálogo de maquinaria (una vez)
  const [maquinariaAll, setMaquinariaAll] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/maquinaria/?page=1&limit=10000`);
        const data = await res.json();
        if (!alive) return;
        const clean = (arr) =>
          Array.from(
            new Map(
              (Array.isArray(arr) ? arr : [])
                .filter((m) => m && (m._id?.$oid || m._id) && m.placa && m.detalle)
                .map((m) => [
                  m._id?.$oid || m._id,
                  { _id: m._id?.$oid || m._id, placa: m.placa, detalle: m.detalle, unidad: m.unidad }
                ])
            ).values()
          );
        setMaquinariaAll(clean(data));
      } catch (err) {
        console.error('loadMaquinarias failed', err);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Opciones filtradas por unidad activa (para el form del técnico)
  const unitForForm = isTecnico ? (ownUnit || selectedUnit) : selectedUnit;
  const maquinariaOptions = useMemo(() => {
    const uf = (unitForForm || '').toString().toUpperCase();
    return maquinariaAll.filter((m) => !uf || (m.unidad || '').toString().toUpperCase() === uf);
  }, [maquinariaAll, unitForForm]);

  // Listado (GET)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      const unidad = isTecnico ? (ownUnit || selectedUnit || '') : selectedUnit;
      if (unidad) qs.set('unidad', unidad);
      if (readOnlyByRole && selectedDate) qs.set('fecha', selectedDate);

      const res = await fetch(`${API}/novedades/${qs.toString() ? `?${qs}` : ''}`, {
        headers: { 'X-User-Email': user?.Email }
      });
      if (!res.ok) throw new Error(`Error al cargar novedades (${res.status})`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setSnackbar({ open: true, message: `Error: ${e.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isTecnico, ownUnit, selectedUnit, selectedDate, readOnlyByRole, user?.Email]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Crear (solo técnico)
  const showCreateButton = isTecnico; // Encargado/Admin NO lo ven
  const allowCreateAction = isTecnico && canCreate && !isReadOnlyGlobal;

  const handleSubmit = async (formData) => {
    if (!allowCreateAction) {
      setSnackbar({ open: true, message: 'No tienes permisos para registrar.', severity: 'error' });
      return;
    }
    setSubmitLoading(true);
    const payload = {
      ...formData,
      descripcion: formData.descripcion || maquinariaDetalle || formData.evento || formData.detalle,
      unidad: normalizeUnidadForDB(unitForForm || ownUnit || selectedUnit || ''),
      placa: formData.placa || maquinariaPlaca,
      registrado_por: user?.Nombre || user?.Email || 'Usuario',
    };

    try {
      const res = await fetch(`${API}/novedades/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': user?.Email },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error en la operación (${res.status})`);
      }
      setSnackbar({ open: true, message: 'Novedad creada exitosamente!', severity: 'success' });
      setShowForm(false);
      await fetchItems();
    } catch (e) {
      setSnackbar({ open: true, message: `Error: ${e.message}`, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Guards
  if (permissionDenied) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>Acceso Denegado</Typography>
        <Typography variant="body1" color="text.secondary">No tienes permisos para acceder al módulo de Novedades.</Typography>
      </Paper>
    );
  }
  if (!allowSee) return null;

  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Novedades</Typography>

          {/* Encargado/Admin: filtros Unidad + Fecha */}
          {readOnlyByRole && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="unidad-select-label">Unidad</InputLabel>
                <Select
                  labelId="unidad-select-label"
                  label="Unidad"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {unidades.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Fecha"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Box>
          )}

          {/* Técnico: botón registrar */}
          {showCreateButton && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color={showForm ? 'error' : 'success'}
                onClick={() => setShowForm((s) => !s)}
              >
                {showForm ? 'Cancelar' : 'Nueva Novedad'}
              </Button>
            </Box>
          )}
        </Box>

        {/* Form (solo técnico) — opciones FILTRADAS por unidad */}
        {showCreateButton && showForm && (
          <NovedadesForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            initialData={{ unidad: unitForForm, placa: '', descripcion: '' }}
            isEditing={false}
            isReadOnly={false}
            submitLoading={submitLoading}
            maquinariaOptions={maquinariaOptions}
          />
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress color="primary" />
            <Typography variant="body1" sx={{ ml: 2 }}>Cargando novedades...</Typography>
          </Box>
        ) : (
          <NovedadesTable rows={items} />
        )}
      </Paper>
    </Box>
  );
};

/* -------- PropTypes -------- */
NovedadesMain.propTypes = {
  maquinariaPlaca: PropTypes.string,
  maquinariaDetalle: PropTypes.string,
  maquinariaUnidad: PropTypes.string,
};

export default NovedadesMain;
