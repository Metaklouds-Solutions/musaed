/**
 * Language switcher dropdown. En / العربية.
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCALES, type Locale } from '../../i18n';

function isLocale(s: string): s is Locale {
  return s === 'en' || s === 'ar';
}

function toLocale(s: string): Locale {
  return isLocale(s) ? s : 'en';
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocale = toLocale(i18n.language?.split('-')[0] || 'en');
  const effectiveLocale = LOCALES.includes(currentLocale) ? currentLocale : 'en';

  const handleSelect = (locale: Locale) => {
    i18n.changeLanguage(locale);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-(var(--radius-nav)) relative hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-(var(--text-muted))"
        aria-label={t('common.language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe size={20} aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          className="absolute top-full end-0 mt-2 z-50 min-w-[140px] rounded-(var(--radius-card)) card-glass border border-(var(--border-subtle)) shadow-lg overflow-hidden py-1"
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              role="option"
              aria-selected={effectiveLocale === locale}
              type="button"
              onClick={() => handleSelect(locale)}
              className={cn(
                'w-full px-4 py-2.5 text-left text-sm transition-colors',
                effectiveLocale === locale
                  ? 'bg-(var(--bg-hover)) text-(var(--text-primary)) font-medium'
                  : 'text-(var(--text-secondary)) hover:bg-(var(--bg-hover))'
              )}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
