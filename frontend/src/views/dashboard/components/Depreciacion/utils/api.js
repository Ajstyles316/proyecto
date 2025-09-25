// Configuración de API para desarrollo y producción
const isDevelopment = import.meta.env.DEV;
const API_BASE = isDevelopment 
  ? 'http://localhost:8000/api'  // Para desarrollo local
  : 'https://gestion-maquinaria-backend.herokuapp.com/api';  // Para producción

export async function fetchMaquinarias() {
  const res = await fetch(`${API_BASE}/maquinaria/`);
  if (!res.ok) throw new Error('Error al obtener maquinarias');
  return await res.json();
}

export async function fetchMaquinariaById(id) {
  const res = await fetch(`${API_BASE}/maquinaria/${id}/`);
  if (!res.ok) throw new Error('Error al obtener detalles de maquinaria');
  return await res.json();
}

export async function createMaquinaria(data) {
  const res = await fetch(`${API_BASE}/maquinaria/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear maquinaria');
  return await res.json();
}

export async function updateMaquinaria(id, data) {
  const res = await fetch(`${API_BASE}/maquinaria/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar maquinaria');
  return await res.json();
}

export async function deleteMaquinaria(id) {
  const res = await fetch(`${API_BASE}/maquinaria/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar maquinaria');
  return true;
}

// 📌 -- Depreciación --

export async function fetchDepreciaciones(maquinariaId) {
  const res = await fetch(`${API_BASE}/depreciaciones/${maquinariaId}/`);
  if (!res.ok) {
    console.error('ERROR', res.status, res.statusText);
    throw new Error('Error al obtener depreciaciones');
  }
  return await res.json();
}

export async function createDepreciacion(maquinariaId, data) {
  const res = await fetch(`${API_BASE}/depreciaciones/${maquinariaId}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear depreciación');
  return await res.json();
}

export async function updateDepreciacion(maquinariaId, recordId, data) {
  const res = await fetch(`${API_BASE}/maquinaria/${maquinariaId}/depreciaciones/${recordId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar depreciación');
  return await res.json();
}

export async function deleteDepreciacion(maquinariaId, recordId) {
  const res = await fetch(`${API_BASE}/depreciaciones/${maquinariaId}/${recordId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar depreciación');
  return true;
}

export async function fetchDetalleDepreciacion(maquinariaId) {
  const res = await fetch(`${API_BASE}/depreciaciones/detalle/${maquinariaId}/`);
  if (!res.ok) throw new Error('Error al obtener el detalle de depreciación');
  return await res.json();
}