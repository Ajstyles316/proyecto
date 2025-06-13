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
  // ✅ Elimina el usuario del localStorage
  localStorage.removeItem("user");
  
  // ✅ Redirige a la página de login
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
    title: 'Pronóstico',
    icon: IconAlignBoxLeftBottom,
    href: '/mantenimiento',
  },
  {
    id: uniqueId(),
    title: 'Reportes',
    icon: IconAperture,
    href: '/sample-page',
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