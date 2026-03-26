import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { I18nDirSync } from './i18n/I18nDirSync';
import { OfflineBanner } from './components/OfflineBanner';
import { AppRouter } from './app/router';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineBanner />
    <I18nDirSync />
    <AppRouter />
    <Toaster
      position="top-right"
      duration={2000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'toast-pop',
          title: 'toast-pop-title',
          description: 'toast-pop-desc',
          content: 'toast-pop-content',
        },
      }}
    />
  </StrictMode>
);
