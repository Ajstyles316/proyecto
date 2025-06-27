export async function fetchActivos() {
  const res = await fetch('http://localhost:8000/api/activos/');
  if (!res.ok) throw new Error('Error al obtener activos');
  return await res.json();
} 