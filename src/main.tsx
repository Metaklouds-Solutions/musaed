import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionProvider } from './app/session/SessionContext';
import { AppRouter } from './app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  </StrictMode>
);
