import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconLogin,
  IconAperture,
  IconAlignBoxLeftBottom,
  IconTable,
  IconUsers,
} from '@tabler/icons-react';

// Función para cerrar sesión
const handleLogout = async () => {
  try {
    // Obtener el usuario actual del localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.Email) {
      // Llamar al endpoint de logout
      await fetch("http://localhost:8000/api/logout/", {
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
    // Limpiar localStorage y redirigir
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
    icon: IconTable,
    href: '/depreciaciones',
  },
  {
    id: uniqueId(),
    title: 'Activos',
    icon: IconTable,
    href: '/activos',
  },
  {
    id: uniqueId(),
    title: 'Pronóstico',
    icon: IconAlignBoxLeftBottom,
    href: '/pronostico',
  },
  {
    id: uniqueId(),
    title: 'Reportes',
    icon: IconAperture,
    href: '/reportes',
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
    icon: IconLogin,
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
  
  // Si es técnico, filtrar por permisos granulares
  return baseMenuItems.filter(item => {
    if (item.onlyAdmin) return false;
    if (!item.title || !moduloMap[item.title]) return true; // navlabel, subheader, logout, etc.
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