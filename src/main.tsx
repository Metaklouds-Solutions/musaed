import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { SessionProvider } from './app/session/SessionContext';
import { I18nDirSync } from './i18n/I18nDirSync';
import { AppRouter } from './app/router';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nDirSync />
    <SessionProvider>
      <AppRouter />
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'toast-pop',
            title: 'toast-pop-title',
            description: 'toast-pop-desc',
            closeButton: 'toast-pop-close',
            content: 'toast-pop-content',
          },
        }}
      />
    </SessionProvider>
  </StrictMode>
);
