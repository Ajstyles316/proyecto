import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

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
    console.log(`useIsReadOnlyForModule - ${module}: Admin/Encargado, no es solo lectura`);
    return false;
  }
  
  // Verificar permisos específicos del usuario para el módulo
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  console.log(`useIsReadOnlyForModule - Module: ${module}, User: ${user.Email}, Cargo: ${cargo}`);
  console.log(`useIsReadOnlyForModule - ModulePermisos:`, modulePermisos);
  console.log(`useIsReadOnlyForModule - Todos los permisos del usuario:`, permisos);
  
  // Si el permiso de ver es "lector" Y el permiso de editar NO es "editor", está en modo solo lectura
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log(`useIsReadOnlyForModule - ${module}: Modo solo lectura (permiso ver: lector, editar: ${modulePermisos.editar})`);
    return true;
  }
  
  // Debug adicional para ver qué permisos tiene el usuario
  console.log(`🔍 DEBUG useIsReadOnlyForModule - ${module}: Verificando permisos específicos`);
  console.log(`🔍 DEBUG useIsReadOnlyForModule - ${module}: modulePermisos.ver = ${modulePermisos.ver}`);
  console.log(`🔍 DEBUG useIsReadOnlyForModule - ${module}: modulePermisos.editar = ${modulePermisos.editar}`);
  console.log(`🔍 DEBUG useIsReadOnlyForModule - ${module}: modulePermisos.crear = ${modulePermisos.crear}`);
  
  // Si el permiso de editar es "lector", está en modo solo lectura
  if (modulePermisos.editar === 'lector') {
    console.log(`useIsReadOnlyForModule - ${module}: Modo solo lectura (permiso editar: lector)`);
    return true;
  }
  
  // Si el permiso general es "lector"
  if (user.Permiso && user.Permiso.toLowerCase() === "lector") {
    console.log(`useIsReadOnlyForModule - ${module}: Permiso general lector`);
    return true;
  }
  
  console.log(`useIsReadOnlyForModule - ${module}: No es solo lectura`);
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
    console.log('useCanEditMaquinaria - Permiso editar lector, no puede editar');
    return false;
  }
  
  // Si el permiso de editar es "denegado", no puede editar
  if (modulePermisos.editar === 'denegado') {
    console.log('useCanEditMaquinaria - Permiso editar denegado, no puede editar');
    return false;
  }
  
  // Si el permiso de editar es "editor", puede editar
  if (modulePermisos.editar === 'editor') {
    console.log('useCanEditMaquinaria - Permiso editar editor, puede editar');
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede editar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log('useCanEditMaquinaria - Permiso ver lector, no puede editar');
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede editar maquinaria
  if (cargo === 'encargado') return true; // Encargado puede editar
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede editar maquinaria, pero respetando permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log('useCanEditMaquinaria - Técnico con permiso lector, no puede editar');
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log('useCanEditMaquinaria - Técnico con permiso editar lector, no puede editar');
      return false;
    }
    // Técnico puede editar maquinaria
    return true;
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
    console.log('useCanDeleteMaquinaria - Permiso eliminar lector, no puede eliminar');
    return false;
  }
  
  // Si el permiso de eliminar es "denegado", no puede eliminar
  if (modulePermisos.eliminar === 'denegado') {
    console.log('useCanDeleteMaquinaria - Permiso eliminar denegado, no puede eliminar');
    return false;
  }
  
  // Si el permiso de eliminar es "editor", puede eliminar
  if (modulePermisos.eliminar === 'editor') {
    console.log('useCanDeleteMaquinaria - Permiso eliminar editor, puede eliminar');
    return true;
  }
  
  // Si el permiso de editar es "editor", puede eliminar
  if (modulePermisos.editar === 'editor') {
    console.log('useCanDeleteMaquinaria - Permiso editar editor, puede eliminar');
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede eliminar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log('useCanDeleteMaquinaria - Permiso ver lector, no puede eliminar');
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede eliminar maquinaria
  if (cargo === 'encargado') return true; // Encargado puede eliminar
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede eliminar maquinaria, pero respetando permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log('useCanDeleteMaquinaria - Técnico con permiso lector, no puede eliminar');
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log('useCanDeleteMaquinaria - Técnico con permiso editar lector, no puede eliminar');
      return false;
    }
    // Técnico puede eliminar maquinaria
    return true;
  }
  return false;
};

export const useCanCreateMaquinaria = () => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  console.log('useCanCreateMaquinaria - user cargo:', cargo); // Debug log
  console.log('useCanCreateMaquinaria - user object:', user); // Debug log completo
  
  // Verificar permisos específicos del usuario para Maquinaria
  const permisos = user.permisos || {};
  const modulePermisos = permisos['Maquinaria'] || {};
  
  // Si el permiso de crear es "lector", no puede crear
  if (modulePermisos.crear === 'lector') {
    console.log('useCanCreateMaquinaria - Permiso crear lector, no puede crear');
    return false;
  }
  
  // Si el permiso de crear es "denegado", no puede crear
  if (modulePermisos.crear === 'denegado') {
    console.log('useCanCreateMaquinaria - Permiso crear denegado, no puede crear');
    return false;
  }
  
  // Si el permiso de crear es "editor", puede crear
  if (modulePermisos.crear === 'editor') {
    console.log('useCanCreateMaquinaria - Permiso crear editor, puede crear');
    return true;
  }
  
  // Si el permiso de editar es "editor", puede crear
  if (modulePermisos.editar === 'editor') {
    console.log('useCanCreateMaquinaria - Permiso editar editor, puede crear');
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede crear
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log('useCanCreateMaquinaria - Permiso ver lector, no puede crear');
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede crear maquinaria
  if (cargo === 'encargado') return true; // Encargado puede crear
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede crear maquinaria, pero respetando permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log('useCanCreateMaquinaria - Técnico con permiso lector, no puede crear');
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log('useCanCreateMaquinaria - Técnico con permiso editar lector, no puede crear');
      return false;
    }
    // Técnico puede crear maquinaria (maneja acentos)
    return true;
  }
  return false;
};

// Hook para verificar si el permiso está denegado
export const useIsPermissionDenied = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  // Verificar si el permiso de ver está denegado
  return modulePermisos.ver === false || modulePermisos.ver === 'denegado';
};

// Hook genérico para verificar permisos de visualización
export const useCanView = (module) => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  
  // Admin siempre puede ver todo
  if (cargo === 'admin') return true;
  
  // Verificar permisos específicos del usuario
  const permisos = user.permisos || {};
  const modulePermisos = permisos[module] || {};
  
  console.log(`useCanView - Module: ${module}, User: ${user.Email}, Cargo: ${cargo}`);
  console.log(`useCanView - Permisos:`, permisos);
  console.log(`useCanView - ModulePermisos:`, modulePermisos);
  
  // Si el permiso es "denegado", no puede ver
  if (modulePermisos.ver === false || modulePermisos.ver === 'denegado') {
    console.log(`useCanView - DENEGADO para ${module}`);
    return false;
  }
  
  // Si el permiso es "ver" con "lector" o "editor", puede ver
  if (modulePermisos.ver === 'lector' || modulePermisos.ver === 'editor' || modulePermisos.ver === true) {
    console.log(`useCanView - PERMITIDO para ${module} (permiso: ${modulePermisos.ver})`);
    return true;
  }
  
  // Si el permiso de editar es "editor", puede ver
  if (modulePermisos.editar === 'editor') {
    console.log(`useCanView - PERMITIDO para ${module} (permiso editar: editor)`);
    return true;
  }
  
  // Para encargado, por defecto puede ver si no hay restricciones específicas
  if (cargo === 'encargado') {
    console.log(`useCanView - ENCARGADO puede ver ${module}`);
    return true;
  }
  
  // Para técnico, por defecto puede ver si no hay restricciones específicas
  if (cargo === 'tecnico' || cargo === 'técnico') {
    console.log(`useCanView - TÉCNICO puede ver ${module}`);
    return true;
  }
  
  console.log(`useCanView - NO PUEDE VER ${module}`);
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
  
  // Si el permiso de crear es "lector", no puede crear
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
    console.log(`useCanCreate - ${module}: Permiso ver lector, no puede crear`);
    return false;
  }
  
  if (cargo === 'admin') return false; // Admin no puede crear en estos módulos
  if (cargo === 'encargado') return true; // Encargado puede crear
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede crear en módulos específicos, pero respetando permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log(`useCanCreate - ${module}: Técnico con permiso lector, no puede crear`);
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log(`useCanCreate - ${module}: Técnico con permiso editar lector, no puede crear`);
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
    console.log(`🔍 DEBUG useCanEdit - ${module}: Permiso denegado, retornando false`);
    return false;
  }
  
  // Si el permiso es "lector", no puede editar
  if (modulePermisos.editar === 'lector') {
    console.log(`🔍 DEBUG useCanEdit - ${module}: Permiso lector, retornando false`);
    return false;
  }
  
  // Si el permiso de editar es "lector", no puede editar
  if (modulePermisos.editar === 'lector') {
    console.log(`🔍 DEBUG useCanEdit - ${module}: Permiso editar lector, retornando false`);
    return false;
  }
  
  // Si el permiso de editar es "editor" o true, puede editar
  if (modulePermisos.editar === 'editor' || modulePermisos.editar === true) {
    console.log(`🔍 DEBUG useCanEdit - ${module}: Permiso específico true, retornando true`);
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede editar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log(`useCanEdit - ${module}: Permiso ver lector, no puede editar`);
    return false;
  }
  
  if (cargo === 'admin') {
    console.log(`🔍 DEBUG useCanEdit - ${module}: Admin, retornando false`);
    return false; // Admin no puede editar en estos módulos
  }
  if (cargo === 'encargado') {
    console.log(`🔍 DEBUG useCanEdit - ${module}: Encargado, retornando true`);
    return true; // Encargado puede editar
  }
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede editar en módulos específicos, pero respetando permisos de lector
    if (module === 'SOAT') {
      console.log('useCanEdit - SOAT: Técnico no puede editar, retornando false');
      return false;
    }
    // Verificar si tiene permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log(`useCanEdit - ${module}: Técnico con permiso lector, no puede editar`);
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log(`useCanEdit - ${module}: Técnico con permiso editar lector, no puede editar`);
      return false;
    }
    if (module === 'Depreciación') {
      console.log(`🔍 DEBUG useCanEdit - ${module}: Técnico puede editar depreciaciones, retornando true`);
      return true;
    }
    console.log(`🔍 DEBUG useCanEdit - ${module}: Técnico, retornando false`);
    return false;
  }
  console.log(`🔍 DEBUG useCanEdit - ${module}: Cargo no reconocido (${cargo}), retornando false`);
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
    console.log(`🔍 DEBUG useCanDelete - ${module}: Permiso denegado, retornando false`);
    return false;
  }
  
  // Si el permiso es "lector", no puede eliminar
  if (modulePermisos.eliminar === 'lector') {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Permiso lector, retornando false`);
    return false;
  }
  
  // Si el permiso de eliminar es "lector", no puede eliminar
  if (modulePermisos.eliminar === 'lector') {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Permiso eliminar lector, retornando false`);
    return false;
  }
  
  // Si el permiso de eliminar es "editor" o true, puede eliminar
  if (modulePermisos.eliminar === 'editor' || modulePermisos.eliminar === true) {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Permiso específico true, retornando true`);
    return true;
  }
  
  // Si el permiso de editar es "editor", puede eliminar (porque editor puede eliminar)
  if (modulePermisos.editar === 'editor') {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Permiso editar editor, puede eliminar`);
    return true;
  }
  
  // Si el permiso de ver es "lector" y no tiene permiso de editar como "editor", no puede eliminar
  if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
    console.log(`useCanDelete - ${module}: Permiso ver lector, no puede eliminar`);
    return false;
  }
  
  if (cargo === 'admin') {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Admin, retornando false`);
    return false; // Admin no puede eliminar en estos módulos
  }
  if (cargo === 'encargado') {
    console.log(`🔍 DEBUG useCanDelete - ${module}: Encargado, retornando true`);
    return true; // Encargado puede eliminar
  }
  if (cargo === 'tecnico' || cargo === 'técnico') {
    // Técnico puede eliminar en módulos específicos, pero respetando permisos de lector
    if (module === 'SOAT') {
      console.log('useCanDelete - SOAT: Técnico no puede eliminar, retornando false');
      return false;
    }
    // Verificar si tiene permisos de lector
    if (modulePermisos.ver === 'lector' && modulePermisos.editar !== 'editor') {
      console.log(`useCanDelete - ${module}: Técnico con permiso lector, no puede eliminar`);
      return false;
    }
    if (modulePermisos.editar === 'lector') {
      console.log(`useCanDelete - ${module}: Técnico con permiso editar lector, no puede eliminar`);
      return false;
    }
    if (module === 'Depreciación') {
      console.log(`🔍 DEBUG useCanDelete - ${module}: Técnico puede eliminar depreciaciones, retornando true`);
      return true;
    }
    console.log(`🔍 DEBUG useCanDelete - ${module}: Técnico, retornando false`);
    return false;
  }
  console.log(`🔍 DEBUG useCanDelete - ${module}: Cargo no reconocido (${cargo}), retornando false`);
  return false;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}; 