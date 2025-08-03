import { useContext } from 'react';
import { UserContext } from './UserContext';

export const useUser = () => useContext(UserContext);

export const useIsReadOnly = () => {
  const { user } = useUser();
  // Si es admin o encargado, nunca es solo lectura
  if (user && (user.Cargo?.toLowerCase() === 'admin' || user.Cargo?.toLowerCase() === 'encargado')) {
    return false;
  }
  // Para técnico, no es solo lectura (puede crear maquinaria)
  if (user && (user.Cargo?.toLowerCase() === 'tecnico' || user.Cargo?.toLowerCase() === 'técnico')) {
    return false;
  }
  return user && user.Permiso && user.Permiso.toLowerCase() === "lector";
};

// Hook específico para verificar si el usuario está en modo lector para un módulo específico
export const useIsReadOnlyForModule = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Si es admin o encargado, nunca es solo lectura
  if (cargo === 'admin' || cargo === 'encargado') {
    return false;
  }
  
  // Verificar permisos específicos del usuario para el módulo
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Si el permiso de ver es "lector" Y el permiso de editar NO es "editor", está en modo solo lectura
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return true;
  }
  
  // Si el permiso de editar es "lector", está en modo solo lectura
  if (modulePermisos.editar === 'lector') {
    return true;
  }
  
  // Si el permiso general es "lector"
  if (user.Permiso && user.Permiso.toLowerCase() === "lector") {
    return true;
  }
  
  return false;
};

export const useCanManageRoles = () => {
  const { user } = useUser();
  return user && user.Cargo?.toLowerCase() === 'admin';
};

export const useCanEditMaquinaria = () => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario para Maquinaria
  const permisos = user.permisos || {};
  const modulePermisos = permisos['Maquinaria'] || {};
  
  // Si el permiso de editar es "lector", no puede editar
  if (modulePermisos.editar === 'lector') {
    return false;
  }
  
  // Si el permiso de editar es "denegado", no puede editar
  if (modulePermisos.editar === 'denegado') {
    return false;
  }
  
  // Si el permiso de editar es "editor", puede editar
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede editar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede editar maquinaria
  if (cargo === 'encargado') return true; // Encargado puede editar
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico NO puede editar maquinaria
    return false;
  }
  return false;
};

export const useCanDeleteMaquinaria = () => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario para Maquinaria
  const permisos = user.permisos || {};
  const modulePermisos = permisos['Maquinaria'] || {};
  
  // Si el permiso de eliminar es "lector", no puede eliminar
  if (modulePermisos.eliminar === 'lector') {
    return false;
  }
  
  // Si el permiso de eliminar es "denegado", no puede eliminar
  if (modulePermisos.eliminar === 'denegado') {
    return false;
  }
  
  // Si el permiso de eliminar es "editor", puede eliminar
  if (modulePermisos.eliminar === 'editor') {
    return true;
  }
  
  // Si el permiso de editar es "editor", puede eliminar
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede eliminar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede eliminar maquinaria
  if (cargo === 'encargado') return true; // Encargado puede eliminar
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico NO puede eliminar maquinaria
    return false;
  }
  return false;
};

export const useCanCreateMaquinaria = () => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario para Maquinaria
  const permisos = user.permisos || {};
  const modulePermisos = permisos['Maquinaria'] || {};
  
  // Si el permiso de crear es "lector", no puede crear
  if (modulePermisos.crear === 'lector') {
    return false;
  }
  
  // Si el permiso de crear es "denegado", no puede crear
  if (modulePermisos.crear === 'denegado') {
    return false;
  }
  
  // Si el permiso de crear es "editor", puede crear
  if (modulePermisos.crear === 'editor') {
    return true;
  }
  
  // Si el permiso de editar es "editor", puede crear
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede crear
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede crear maquinaria
  if (cargo === 'encargado') return true; // Encargado puede crear
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico SÍ puede crear maquinaria
    return true;
  }
  return false;
};

// Hook para verificar si el permiso está denegado
export const useIsPermissionDenied = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Admin nunca tiene permisos denegados
  if (cargo === 'admin') {
    return false;
  }
  
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Verificar si el permiso de ver está denegado
  const isDenied = modulePermisos.ver === false || modulePermisos.ver === 'denegado';
  return isDenied;
};

// Hook genérico para verificar permisos de visualización
export const useCanView = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Admin siempre puede ver todo
  if (cargo === 'admin') {
    return true;
  }
  
  // Verificar permisos específicos del usuario
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Si el permiso es "denegado", no puede ver
  if (modulePermisos.ver === false || modulePermisos.ver === 'denegado') {
    return false;
  }
  
  // Si el permiso es "ver" con "lector" o "editor", puede ver
  if (modulePermisos.ver === 'lector' || modulePermisos.ver === 'editor' || modulePermisos.ver === true) {
    return true;
  }
  
  // Si el permiso de editar es "editor", puede ver
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Para encargado, por defecto puede ver si no hay restricciones específicas
  if (cargo === 'encargado') {
    return true;
  }
  
  // Para técnico, por defecto puede ver si no hay restricciones específicas
  if (cargo === 'tecnico' || cargo === 'técnico') {
    return true;
  }
  
  return false;
};

// Hook genérico para verificar permisos de creación
export const useCanCreate = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario primero
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Si el permiso es "denegado", no puede crear
  if (modulePermisos.crear === false || modulePermisos.crear === 'denegado') {
    return false;
  }
  
  // Si el permiso es "lector", no puede crear
  if (modulePermisos.crear === 'lector') {
    return false;
  }
  
  // Si el permiso de crear es "editor" o true, puede crear
  if (modulePermisos.crear === 'editor' || modulePermisos.crear === true) {
    return true;
  }
  
  // Si el permiso de editar es "editor", puede crear (porque editor puede crear)
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede crear
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede crear en estos módulos
  if (cargo === 'encargado') return true; // Encargado puede crear
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede crear en módulos específicos, pero respetando permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      return false;
    }
    // Técnico puede crear en todos los módulos excepto cuando tiene permisos de lector
    return true;
  }
  return false;
};

// Hook genérico para verificar permisos de edición
export const useCanEdit = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario primero
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Si el permiso es "denegado", no puede editar
  if (modulePermisos.editar === false || modulePermisos.editar === 'denegado') {
    return false;
  }
  
  // Si el permiso es "lector", no puede editar
  if (modulePermisos.editar === 'lector') {
    return false;
  }
  
  // Si el permiso de editar es "editor" o true, puede editar
  if (modulePermisos.editar === 'editor' || modulePermisos.editar === true) {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede editar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') {
    return false; // Admin no puede editar en estos módulos
  }
  if (cargo === 'encargado') {
    return true; // Encargado puede editar
  }
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede editar en módulos específicos, pero respetando permisos de lector
    if (module === 'SOAT') {
      return false;
    }
    // Verificar si tiene permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      return false;
    }
    if (module === 'Depreciación') {
      return true;
    }
    return false;
  }
  return false;
};

// Hook genérico para verificar permisos de eliminación
export const useCanDelete = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Verificar permisos específicos del usuario primero
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Si el permiso es "denegado", no puede eliminar
  if (modulePermisos.eliminar === false || modulePermisos.eliminar === 'denegado') {
    return false;
  }
  
  // Si el permiso es "lector", no puede eliminar
  if (modulePermisos.eliminar === 'lector') {
    return false;
  }
  
  // Si el permiso de eliminar es "editor" o true, puede eliminar
  if (modulePermisos.eliminar === 'editor' || modulePermisos.eliminar === true) {
    return true;
  }
  
  // Si el permiso de editar es "editor", puede eliminar (porque editor puede eliminar)
  if (modulePermisos.editar === 'editor') {
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede eliminar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    return false;
  }
  
  if (cargo === 'admin') {
    return false; // Admin no puede eliminar en estos módulos
  }
  if (cargo === 'encargado') {
    return true; // Encargado puede eliminar
  }
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede eliminar en módulos específicos, pero respetando permisos de lector
    if (module === 'SOAT') {
      return false;
    }
    // Verificar si tiene permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      return false;
    }
    if (module === 'Depreciación') {
      return true;
    }
    return false;
  }
  return false;
}; 