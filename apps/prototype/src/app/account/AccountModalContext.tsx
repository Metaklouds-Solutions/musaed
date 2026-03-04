/**
 * Context for opening the Account modal from anywhere (e.g. header UserMenu).
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface AccountModalContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AccountModalContext = createContext<AccountModalContextValue | null>(null);

export function AccountModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const value = { open, openModal, closeModal };
  return (
    <AccountModalContext.Provider value={value}>
      {children}
    </AccountModalContext.Provider>
  );
}

export function useAccountModal(): AccountModalContextValue {
  const ctx = useContext(AccountModalContext);
  if (!ctx) throw new Error('useAccountModal must be used within AccountModalProvider');
  return ctx;
}
