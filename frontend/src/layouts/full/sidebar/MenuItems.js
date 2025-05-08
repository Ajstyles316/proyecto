import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconTypography,
  IconUserCircle,
  IconLogin,
  IconAperture,
  IconAlignBoxLeftBottom,
  IconCheckbox,
  IconRadar,
  IconSlideshow,
  IconCaretUpDown,
  IconTable,
  IconForms
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
    title: 'Control',
    icon: IconTypography,
    href: '/control',
  },
  {
    id: uniqueId(),
    title: 'Mantenimiento',
    icon: IconAlignBoxLeftBottom,
    href: '/mantenimiento',
  },
  {
    id: uniqueId(),
    title: 'Asignación',
    icon: IconCheckbox,
    href: '/asignacion',
  },
  {
    id: uniqueId(),
    title: 'Seguros',
    icon: IconRadar,
    href: '/seguros',
  },
  {
    id: uniqueId(),
    title: 'ITV',
    icon: IconSlideshow,
    href: '/itv',
  },
  {
    id: uniqueId(),
    title: 'Impuesto',
    icon: IconCaretUpDown,
    href: '/impuesto',
  },
  {
    id: uniqueId(),
    title: 'Form Layouts',
    icon: IconForms,
    href: '/form-layouts',
  },
  {
    id: uniqueId(),
    title: 'Sample Page',
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