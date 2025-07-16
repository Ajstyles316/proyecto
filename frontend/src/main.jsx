import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './components/UserContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

ReactDOM.createRoot(document.getElementById('root')).render(
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <UserProvider>
      <Suspense>
        <App />
      </Suspense>
    </UserProvider>
  </LocalizationProvider>
)
