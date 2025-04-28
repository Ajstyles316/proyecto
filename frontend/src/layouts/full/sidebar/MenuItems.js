
import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,  IconTypography,
  IconUserCircle,
  IconLogin,
  IconAperture,
  IconAlignBoxLeftBottom, IconCheckbox, IconRadar, IconSlideshow, IconCaretUpDown, IconTable, 
  IconForms
} from '@tabler/icons-react';


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
    href: '/tables/basic-table',
  },
  {
    id: uniqueId(),
    title: 'Control',
    icon: IconTypography,
    href: '/form-elements/autocomplete',
  },
  {
    id: uniqueId(),
    title: 'Mantenimiento',
    icon: IconAlignBoxLeftBottom,
    href: '/form-elements/button',
  },
  {
    id: uniqueId(),
    title: 'Asignación',
    icon: IconCheckbox,
    href: '/form-elements/checkbox',
  },
  {
    id: uniqueId(),
    title: 'Seguros',
    icon: IconRadar,
    href: '/form-elements/radio',
  },
  {
    id: uniqueId(),
    title: 'ITV',
    icon: IconSlideshow,
    href: '/form-elements/slider',
  },
  {
    id: uniqueId(),
    title: 'Impuesto',
    icon: IconCaretUpDown,
    href: '/form-elements/switch',
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
    title: 'Iniciar Sesión',
    icon: IconLogin,
    href: '/auth/login',
  },
  {
    id: uniqueId(),
    title: 'Registro',
    icon: IconUserCircle,
    href: '/auth/register',
  },
  
];

export default Menuitems;
