/**
 * Global keyboard shortcuts. Supports single keys and sequences (e.g. g then d).
 */

import { useEffect, useCallback, useRef } from 'react';

const SEQUENCE_TIMEOUT_MS = 1000;

export interface HotkeyConfig {
  /** Key (lowercase, e.g. 'g', 'd', '?') */
  key: string;
  /** Optional: second key for sequence (e.g. 'g' then 'd') */
  sequence?: string;
  /** Meta/Ctrl required */
  meta?: boolean;
  /** Callback when triggered */
  onTrigger: () => void;
}

/**
 * Register global hotkeys. Call from a component that has access to navigate, etc.
 */
export function useHotkeys(configs: HotkeyConfig[]) {
  const configsRef = useRef(configs);
  configsRef.current = configs;

  const pendingSequence = useRef<{ first: string; timeoutId: number } | null>(null);

  const handler = useCallback((e: KeyboardEvent) => {
    if (!e.key) return;
    const key = e.key.toLowerCase();
    const isMeta = e.metaKey || e.ctrlKey;

    // Ignore when typing in inputs
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    const configs = configsRef.current;

    // Check for sequence second key (e.g. pressed g, now pressing d)
    if (pendingSequence.current) {
      const { first } = pendingSequence.current;
      const sequenceConfig = configs.find(
        (c) => c.sequence && c.key === first && key === c.sequence && !c.meta
      );
      if (sequenceConfig) {
        e.preventDefault();
        clearTimeout(pendingSequence.current.timeoutId);
        pendingSequence.current = null;
        sequenceConfig.onTrigger();
        return;
      }
      // Wrong key - clear pending
      clearTimeout(pendingSequence.current.timeoutId);
      pendingSequence.current = null;
    }

    // Check for sequence start (e.g. press g)
    const seqStart = configs.find((c) => c.sequence && c.key === key && !c.meta);
    if (seqStart && !isMeta) {
      e.preventDefault();
      pendingSequence.current = {
        first: key,
        timeoutId: window.setTimeout(() => {
          pendingSequence.current = null;
        }, SEQUENCE_TIMEOUT_MS),
      };
      return;
    }

    // Single key or meta combo
    for (const c of configs) {
      const keyMatch = c.key === key;
      const metaMatch = c.meta ? isMeta : !isMeta;
      if (keyMatch && metaMatch && !c.sequence) {
        e.preventDefault();
        c.onTrigger();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
