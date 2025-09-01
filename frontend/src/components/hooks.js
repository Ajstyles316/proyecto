import { useContext } from 'react';
import { UserContext } from './UserContext';
import { useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';

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

// Hook para detectar el tamaño de pantalla
export const useResponsive = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const isExtraLarge = useMediaQuery((theme) => theme.breakpoints.up('xl'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isExtraLarge,
    // Breakpoints específicos
    isSmallMobile: useMediaQuery((theme) => theme.breakpoints.down('xs')),
    isMediumMobile: useMediaQuery((theme) => theme.breakpoints.between('xs', 'sm')),
    isSmallTablet: useMediaQuery((theme) => theme.breakpoints.between('sm', 'md')),
    isLargeTablet: useMediaQuery((theme) => theme.breakpoints.between('md', 'lg')),
  };
};

// Hook para obtener estilos responsivos
export const useResponsiveStyles = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return {
    // Espaciado responsivo
    spacing: {
      xs: isMobile ? 1 : isTablet ? 1.5 : 2,
      sm: isMobile ? 1.5 : isTablet ? 2 : 3,
      md: isMobile ? 2 : isTablet ? 3 : 4,
      lg: isMobile ? 3 : isTablet ? 4 : 5,
    },
    
    // Tamaños de fuente responsivos
    typography: {
      h1: isMobile ? '1.5rem' : isTablet ? '2rem' : '2.5rem',
      h2: isMobile ? '1.25rem' : isTablet ? '1.75rem' : '2rem',
      h3: isMobile ? '1.125rem' : isTablet ? '1.5rem' : '1.75rem',
      h4: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
      h5: isMobile ? '0.875rem' : isTablet ? '1rem' : '1.25rem',
      h6: isMobile ? '0.8rem' : isTablet ? '0.875rem' : '1rem',
      body1: isMobile ? '0.875rem' : isTablet ? '0.9rem' : '1rem',
      body2: isMobile ? '0.8rem' : isTablet ? '0.875rem' : '0.9rem',
    },
    
    // Tamaños de componentes responsivos
    components: {
      button: {
        fontSize: isMobile ? '0.875rem' : isTablet ? '0.9rem' : '1rem',
        padding: isMobile ? '8px 16px' : isTablet ? '10px 20px' : '12px 24px',
        minHeight: isMobile ? '44px' : isTablet ? '48px' : '52px',
      },
      chip: {
        fontSize: isMobile ? '0.7rem' : isTablet ? '0.75rem' : '0.8rem',
        height: isMobile ? '24px' : isTablet ? '28px' : '32px',
      },
      icon: {
        fontSize: isMobile ? '1rem' : isTablet ? '1.2rem' : '1.5rem',
      },
      table: {
        fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
        padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
      },
    },
    
    // Layout responsivo
    layout: {
      container: {
        padding: isMobile ? '8px' : isTablet ? '16px' : '24px',
        maxWidth: isMobile ? '100%' : isTablet ? '900px' : '1200px',
      },
      card: {
        padding: isMobile ? '12px' : isTablet ? '16px' : '24px',
        margin: isMobile ? '4px' : isTablet ? '8px' : '12px',
        borderRadius: isMobile ? '8px' : isTablet ? '12px' : '16px',
      },
      table: {
        maxHeight: isMobile ? '400px' : isTablet ? '500px' : '600px',
      },
    },
  };
};

// Hook para obtener configuraciones de grid responsivas
export const useResponsiveGrid = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    // Configuraciones de grid para diferentes componentes
    stats: {
      xs: 12, // Móvil: 1 columna
      sm: 6,  // Tablet: 2 columnas
      md: 3,  // Desktop: 4 columnas
    },
    
    forms: {
      xs: 12, // Móvil: 1 columna
      sm: 6,  // Tablet: 2 columnas
      md: 4,  // Desktop: 3 columnas
      lg: 3,  // Desktop grande: 4 columnas
    },
    
    tables: {
      xs: 12, // Siempre ancho completo
    },
    
    charts: {
      xs: 12, // Móvil: ancho completo
      sm: 12, // Tablet: ancho completo
      md: 6,  // Desktop: 2 columnas
      lg: 5,  // Desktop grande: ajuste específico
    },
    
    actions: {
      xs: 12, // Móvil: ancho completo
      sm: 6,  // Tablet: 2 columnas
      md: 3,  // Desktop: 4 columnas
    },
  };
};

// Hook para obtener configuraciones de breakpoints
export const useBreakpoints = () => {
  return {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };
};

// Hook para obtener configuraciones de sidebar responsivas
export const useSidebarConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    width: isMobile ? '85vw' : isTablet ? '280px' : '270px',
    maxWidth: isMobile ? '320px' : '270px',
    variant: isMobile ? 'temporary' : 'permanent',
    anchor: 'left',
    elevation: isMobile ? 8 : 0,
  };
};

// Hook para obtener configuraciones de header responsivas
export const useHeaderConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    height: isMobile ? '60px' : isTablet ? '65px' : '70px',
    padding: isMobile ? '0 8px' : isTablet ? '0 16px' : '0 24px',
    showMenuButton: isMobile || isTablet,
  };
};

// Hook para obtener configuraciones de tabla responsivas
export const useTableConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    size: isMobile ? 'small' : isTablet ? 'medium' : 'medium',
    stickyHeader: true,
    maxHeight: isMobile ? '400px' : isTablet ? '500px' : '600px',
    overflow: 'auto',
    fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
    padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
  };
};

// Hook para obtener configuraciones de formulario responsivas
export const useFormConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    size: isMobile ? 'small' : 'medium',
    fullWidth: true,
    margin: 'normal',
    variant: 'outlined',
    fontSize: isMobile ? '0.875rem' : '1rem',
    spacing: isMobile ? 2 : 3,
  };
};

// Hook para obtener configuraciones de paginación responsivas
export const usePaginationConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    size: isMobile ? 'small' : 'medium',
    showFirstButton: true,
    showLastButton: true,
    color: 'primary',
    fontSize: isMobile ? '0.7rem' : '0.875rem',
    spacing: isMobile ? 1 : 2,
  };
};

// Hook para obtener configuraciones de modal responsivas
export const useModalConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    maxWidth: isMobile ? 'calc(100vw - 32px)' : isTablet ? '600px' : '800px',
    maxHeight: isMobile ? 'calc(100vh - 32px)' : '80vh',
    margin: isMobile ? '16px' : '32px',
    padding: isMobile ? '16px' : '24px',
  };
};

// Hook para obtener configuraciones de gráfico responsivas
export const useChartConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    height: isMobile ? '250px' : isTablet ? '300px' : '400px',
    width: '100%',
    padding: isMobile ? '8px' : '16px',
    margin: isMobile ? '4px' : '8px',
  };
};

// Hook para obtener configuraciones de tarjeta responsivas
export const useCardConfig = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    padding: isMobile ? '12px' : isTablet ? '16px' : '24px',
    margin: isMobile ? '4px' : isTablet ? '8px' : '12px',
    borderRadius: isMobile ? '8px' : isTablet ? '12px' : '16px',
    elevation: isMobile ? 2 : isTablet ? 3 : 4,
    minHeight: isMobile ? '80px' : isTablet ? '100px' : '120px',
  };
}; 

// Hook para manejar unidades de manera consistente
export const useUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/usuarios/opciones/");
        if (!response.ok) throw new Error("No se pudieron cargar las opciones");
        const data = await response.json();
        setUnidades(data.unidades || []);
      } catch (error) {
        console.error("Error cargando unidades:", error);
        setUnidades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUnidades();
  }, []);

  // Convertir unidad de display a valor de base de datos
  const normalizeUnidadForDB = (unidadDisplay) => {
    if (unidadDisplay === 'OFICINA CENTRAL') {
      return 'OF. CENTRAL';
    }
    return unidadDisplay;
  };

  // Convertir unidad de base de datos a display
  const normalizeUnidadForDisplay = (unidadDB) => {
    if (unidadDB === 'OF. CENTRAL') {
      return 'OFICINA CENTRAL';
    }
    return unidadDB;
  };

  // Normalizar todas las unidades para display
  const unidadesNormalizadas = unidades.map(normalizeUnidadForDisplay);

  return {
    unidades: unidadesNormalizadas,
    unidadesDB: unidades, // Unidades originales de la base de datos
    loading,
    normalizeUnidadForDB,
    normalizeUnidadForDisplay
  };
}; 