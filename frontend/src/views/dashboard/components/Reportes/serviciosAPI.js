const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchMaquinarias() {
  const res = await fetch(`${API_BASE}/maquinaria/`);
  if (!res.ok) throw new Error('Error al obtener maquinarias');
  return await res.json();
}

export async function fetchDepreciaciones(maquinariaId) {
  const res = await fetch(`${API_BASE}/depreciaciones/${maquinariaId}/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchPronosticos(maquinariaId) {
  const res = await fetch(`${API_BASE}/pronostico/?maquinaria_id=${maquinariaId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchControl(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/control/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchAsignacion(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/asignacion/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchLiberacion(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/liberacion/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchMantenimiento(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/mantenimiento/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchSOAT(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/soat/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchSeguros(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/seguros/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchITV(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/itv/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchImpuestos(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/impuestos/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchOdometerData(maquinariaId) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/control-odometro/`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchMaquinariasConDepreciacion() {
  const res = await fetch(`${API_BASE}/maquinarias_con_depreciacion/`);
  if (!res.ok) throw new Error('Error al obtener maquinarias con depreciación');
  return await res.json();
}

export async function fetchMaquinariaConDepreciacionBuscar(q) {
  const res = await fetch(`${API_BASE}/maquinarias_con_depreciacion/buscar/?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('No se encontró la maquinaria');
  return await res.json();
}
