export const SECTIONS = [
  { key: 'Maquinaria', label: 'Maquinaria' },
  { key: 'Asignación', label: 'Asignación' },
  { key: 'Liberación', label: 'Liberación' },
  { key: 'Control', label: 'Control y Seguimiento' },
  { key: 'ControlOdometro', label: 'Control de Odómetros' },
  { key: 'Mantenimiento', label: 'Mantenimiento' },
  { key: 'Seguros', label: 'Seguros' },
  { key: 'ITV', label: 'ITV' },
  { key: 'Impuestos', label: 'Impuestos' },
  { key: 'SOAT', label: 'SOAT' },
];

// Función para filtrar secciones basándose en los permisos del usuario
export const getFilteredSections = (user) => {
  if (!user) return SECTIONS;
  
  // Si es admin, mostrar todas las secciones
  if (user.Cargo && user.Cargo.toLowerCase() === 'admin') {
    return SECTIONS;
  }
  
  // Filtrar secciones basándose en permisos
  return SECTIONS.filter(section => {
    const permisos = user.permisos || {};
    const modulePermisos = permisos[section.key] || {};
    
    // SOLO para ControlOdometro: si el permiso está denegado, no mostrar la sección
    if (section.key === 'ControlOdometro') {
      if (modulePermisos.ver === false || modulePermisos.ver === 'denegado') {
        return false;
      }
    }
    
    // Para encargado, mostrar todas excepto ControlOdometro denegado
    if (user.Cargo && user.Cargo.toLowerCase() === 'encargado') {
      return true;
    }
    
    // Para técnico, verificar permisos granulares pero solo ocultar ControlOdometro
    if (user.Cargo && (user.Cargo.toLowerCase() === 'tecnico' || user.Cargo.toLowerCase() === 'técnico')) {
      if (section.key === 'ControlOdometro') {
        return modulePermisos.ver !== false && modulePermisos.ver !== 'denegado';
      }
      return true; // Para otros módulos, siempre mostrar (el mensaje de acceso denegado se maneja en cada componente)
    }
    
    return true;
  });
};
