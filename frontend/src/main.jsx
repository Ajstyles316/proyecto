import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './components/UserContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <UserProvider>
    <Suspense>
      <App />
    </Suspense>
  </UserProvider>
)
