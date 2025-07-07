import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconLogin,
  IconAperture,
  IconAlignBoxLeftBottom,
  IconTable,
} from '@tabler/icons-react';

// Función para cerrar sesión
const handleLogout = () => {
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const Menuitems = [
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
    title: 'Depreciación',
    icon: IconTable,
    href: '/depreciacion',
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
    title: 'Cerrar Sesión',
    icon: IconLogin,
    href: '/login',
    onClick: handleLogout,
  },
];

export default Menuitems;

export const routeTitleMap = Menuitems.filter(item => item.title && item.href)
  .reduce((acc, item) => {
    acc[item.href] = item.title;
    return acc;
  }, {});