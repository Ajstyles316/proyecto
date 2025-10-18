import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconTable,
  IconTrendingDown,
  IconBriefcase,
  IconChartLine,
  IconReport,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react';

// Función para cerrar sesión (sin cambios)
const handleLogout = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.Email) {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": user.Email
        }
      });
    }
  } catch (error) {
    console.error("Error al registrar logout:", error);
  } finally {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

const baseMenuItems = [
  {
    navlabel: true,
    subheader: 'Inicio',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Utilidades',
  },
  {
    id: uniqueId(),
    title: 'Maquinaria',
    icon: IconTable,
    href: '/maquinaria',
  },
  {
    id: uniqueId(),
    title: 'Depreciaciones',
    icon: IconTrendingDown, // Icono de tendencia a la baja para depreciaciones
    href: '/depreciaciones',
  },
  {
    id: uniqueId(),
    title: 'Activos',
    icon: IconBriefcase, // Maletín para representar activos
    href: '/activos',
  },
  {
    id: uniqueId(),
    title: 'Pronóstico',
    icon: IconChartLine, // Gráfico de líneas para pronósticos
    href: '/pronostico',
  },
  {
    id: uniqueId(),
    title: 'Reportes',
    icon: IconReport, // Icono específico para reportes
    href: '/reportes',
  },
  {
    id: uniqueId(),
    title: 'Novedades',
    icon: IconReport,
    href: '/novedades',
  },
  {
    navlabel: true,
    subheader: 'Autenticación',
  },
  {
    id: uniqueId(),
    title: 'Permisos y Roles',
    icon: IconUsers,
    href: '/usuarios',
    onlyAdmin: true,
  },
  {
    id: uniqueId(),
    title: 'Cerrar Sesión',
    icon: IconLogout, // Icono específico para logout
    href: '/login',
    onClick: handleLogout,
  },
];

const moduloMap = {
  'Dashboard': 'Dashboard',
  'Maquinaria': 'Maquinaria',
  'Depreciaciones': 'Depreciaciones',
  'Activos': 'Activos',
  'Pronóstico': 'Pronóstico',
  'Reportes': 'Reportes',
  'Novedades': 'Novedades',
  'Usuarios': 'Usuarios',
};

const getMenuItems = (user) => {
  if (!user) return baseMenuItems.filter(item => !item.onlyAdmin);
  
  // Si es admin, tiene acceso a todo
  if (user.Cargo && user.Cargo.toLowerCase() === 'admin') return baseMenuItems;
  
  // Si es encargado, tiene acceso a todo excepto gestión de roles
  if (user.Cargo && user.Cargo.toLowerCase() === 'encargado') {
    return baseMenuItems.filter(item => !item.onlyAdmin);
  }
  
  // Técnico (detección simple sin alterar nada más)
  const isTecnico = user.Cargo && user.Cargo.toLowerCase().includes('técnico');

  // Si es técnico (u otro), filtrar por permisos granulares
  return baseMenuItems.filter(item => {
    if (item.onlyAdmin) return false;
    if (!item.title || !moduloMap[item.title]) return true; // navlabel, subheader, logout, etc.

    // EXCEPCIÓN mínima: mostrar "Novedades" al técnico aunque no tenga permisos cargados
    if (isTecnico && item.title === 'Novedades') return true;

    const mod = moduloMap[item.title];
    return user.permisos && user.permisos[mod] && user.permisos[mod].ver;
  });
};

export default baseMenuItems;
export { getMenuItems };

export const routeTitleMap = baseMenuItems.filter(item => item.title && item.href)
  .reduce((acc, item) => {
    acc[item.href] = item.title;
    return acc;
  }, {});
