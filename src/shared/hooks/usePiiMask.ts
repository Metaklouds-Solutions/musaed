/**
 * PII masking hook. Masks sensitive data unless user has permission and opts to reveal.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePermissions } from './usePermissions';
import * as pii from '../utils/piiMask';

const PII_UNMASK_KEY = 'clinic-crm-pii-unmask';

export function usePiiMask() {
  const { canViewUnmaskedPII } = usePermissions();
  const [showUnmasked, setShowUnmasked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PII_UNMASK_KEY) === 'true';
  });

  useEffect(() => {
    if (canViewUnmaskedPII && typeof window !== 'undefined') {
      localStorage.setItem(PII_UNMASK_KEY, String(showUnmasked));
    }
  }, [showUnmasked, canViewUnmaskedPII]);

  const masked = useMemo(
    () => !canViewUnmaskedPII || !showUnmasked,
    [canViewUnmaskedPII, showUnmasked]
  );

  const toggleUnmasked = useCallback(() => {
    if (canViewUnmaskedPII) setShowUnmasked((v) => !v);
  }, [canViewUnmaskedPII]);

  const maskEmail = useCallback(
    (value: string | null | undefined) =>
      masked ? pii.maskEmail(value) : (value ?? '—'),
    [masked]
  );

  const maskName = useCallback(
    (value: string | null | undefined) =>
      masked ? pii.maskName(value) : (value ?? '—'),
    [masked]
  );

  const maskPhone = useCallback(
    (value: string | null | undefined) =>
      masked ? pii.maskPhone(value) : (value ?? '—'),
    [masked]
  );

  const maskInText = useCallback(
    (value: string | null | undefined) =>
      masked ? pii.maskInText(value) : (value ?? ''),
    [masked]
  );

  return {
    masked,
    canViewUnmaskedPII,
    showUnmasked,
    toggleUnmasked,
    maskEmail,
    maskName,
    maskPhone,
    maskInText,
  };
}
