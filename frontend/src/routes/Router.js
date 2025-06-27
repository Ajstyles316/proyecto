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

const ExRadio = lazy(() => import("../views/form-elements/ExButton"));

const DepreciacionMain = lazy(() => import("../views/dashboard/components/Depreciacion/DepreciacionMain"));
const ActivosMain = lazy(() => import("../views/dashboard/components/Activos/ActivosMain"));
const Pronostico = lazy(() => import("../views/dashboard/components/Pronostico/Pronostico"));

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
      { path: "/depreciacion", element: <PrivateRoute><DepreciacionMain /></PrivateRoute>},
      { path: "/activos", element: <PrivateRoute><ActivosMain /></PrivateRoute>},
      { path: "/mantenimiento", element: <PrivateRoute><ExRadio /></PrivateRoute> },
      { path: "/sample-page", element: <PrivateRoute><SamplePage /></PrivateRoute> },
      { path: "/pronostico", element: <PrivateRoute><Pronostico /></PrivateRoute> },
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