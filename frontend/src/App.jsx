import './App.css'

import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import router from "./routes/Router.js"
import { routeTitleMap } from './layouts/full/sidebar/MenuItems';

import { baselightTheme } from "./theme/DefaultColors";

function App() {
  const theme = baselightTheme;

  useEffect(() => {
    // Suscribirse a los cambios de navegación
    const unsubscribe = router.subscribe((state) => {
      const pathname = state.location.pathname;
      const title = routeTitleMap[pathname] || 'Activos Fijos';
      document.title = title;
    });

    // Establecer el título inicial
    const initialTitle = routeTitleMap[window.location.pathname] || 'Activos Fijos';
    document.title = initialTitle;

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App