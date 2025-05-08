import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import PrivateRoute from './PrivateRoute.js';
/* ***Layouts**** */
const FullLayout = lazy(() => import('../layouts/full/FullLayout'));
const BlankLayout = lazy(() => import('../layouts/blank/BlankLayout'));

/* ****Pages***** */
const Dashboard = lazy(() => import('../views/dashboard/Dashboard'))
const SamplePage = lazy(() => import('../views/sample-page/SamplePage'))
const Error = lazy(() => import('../views/autenticacion/Error.js'));
const Register = lazy(() => import('../views/autenticacion/Registro.js'));
const Login = lazy(() => import('../views/autenticacion/Login.js'));

const BasicTable = lazy(() => import("../views/tables/BasicTable"));
const ExAutoComplete = lazy(() =>
  import("../views/form-elements/ExAutoComplete")
);
const ExButton = lazy(() => import("../views/form-elements/ExButton"));
const ExCheckbox = lazy(() => import("../views/form-elements/ExCheckbox"));
const ExRadio = lazy(() => import("../views/form-elements/ExRadio"));
const ExSlider = lazy(() => import("../views/form-elements/ExSlider"));
const ExSwitch = lazy(() => import("../views/form-elements/ExSwitch"));
const FormLayouts = lazy(() => import("../views/form-layouts/FormLayouts"));

const Router = [
  {
    path: "/",
    element: <FullLayout />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" /> },
      {
        path: "/dashboard",
        element: <PrivateRoute><Dashboard /></PrivateRoute>,
      },
      { path: "/maquinaria", element: <PrivateRoute><BasicTable /></PrivateRoute> },
      { path: "/control", element: <PrivateRoute><ExAutoComplete /></PrivateRoute> },
      { path: "/mantenimiento", element: <PrivateRoute><ExButton /></PrivateRoute> },
      { path: "/asignacion", element: <PrivateRoute><ExCheckbox /></PrivateRoute> },
      { path: "/seguros", element: <PrivateRoute><ExRadio /></PrivateRoute> },
      { path: "/itv", element: <PrivateRoute><ExSlider /></PrivateRoute> },
      { path: "/impuesto", element: <PrivateRoute><ExSwitch /></PrivateRoute> },
      { path: "/form-layouts", element: <PrivateRoute><FormLayouts /></PrivateRoute> },
      { path: "/sample-page", element: <PrivateRoute><SamplePage /></PrivateRoute> },
      { path: "*", element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> },

      { path: '*', element: <Navigate to="/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;