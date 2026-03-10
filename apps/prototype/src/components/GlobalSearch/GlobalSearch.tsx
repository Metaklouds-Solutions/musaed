/**
 * Global search. Header input + results dropdown. Navigate on select.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users, Phone, UserPlus, Headphones, Command } from 'lucide-react';
import { useSession } from '../../app/session/SessionContext';
import { searchAdapter, type SearchResult } from '../../adapters';
import { useAsyncData } from '../../shared/hooks/useAsyncData';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<SearchResult['type'], React.ReactNode> = {
  tenant: <Users size={16} />,
  call: <Phone size={16} />,
  staff: <UserPlus size={16} />,
  ticket: <Headphones size={16} />,
  nav: <Search size={16} />,
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || '');

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  /** Opens the command palette when the shortcut badge is clicked */
  onOpenCommandPalette?: () => void;
}

export function GlobalSearch({ className, placeholder, onOpenCommandPalette }: GlobalSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tenantId = user?.role === 'ADMIN' ? undefined : user?.tenantId;
  const isAdmin = user?.role === 'ADMIN';

  const { data: rawResults, loading: resultsLoading } = useAsyncData(
    async () => {
      const q = query.trim();
      if (!q) return [] as SearchResult[];
      const response = await Promise.resolve(searchAdapter.search(q, tenantId, isAdmin));
      return Array.isArray(response) ? response : [];
    },
    [query, tenantId, isAdmin],
    [] as SearchResult[],
  );
  const results = useMemo(() => (Array.isArray(rawResults) ? rawResults : []), [rawResults]);

  useEffect(() => {
    setSelected(0);
  }, [query, results]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && e.target instanceof Node && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (r: SearchResult) => {
    navigate(r.path);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && e.key !== 'Escape') {
      setOpen(true);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
      return;
    }
    if (e.key === 'Enter' && results[selected]) {
      e.preventDefault();
      handleSelect(results[selected]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative flex-1 min-w-0 max-w-[280px] sm:max-w-[320px]', className)}>
      <label htmlFor="global-search" className="sr-only">
        {t('common.search')}
      </label>
      <div
        className={cn(
          'relative flex items-center w-full rounded-full h-8 sm:h-9',
          'px-2.5 sm:px-3',
          'bg-(var(--header-search-bg))',
          'shadow-[var(--header-search-shadow)]',
          'focus-within:shadow-(var(--header-search-shadow-focus)) focus-within:ring-2 focus-within:ring-[var(--ds-primary)]/20',
          'transition-shadow duration-200'
        )}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(var(--ds-primary)) pointer-events-none shrink-0"
          aria-hidden
        />
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('common.searchPlaceholder')}
          className={cn(
            'w-full min-w-0 bg-transparent border-0 outline-none text-(var(--text-primary))',
            'placeholder:text-(var(--text-muted)) text-sm',
            'pl-9 pr-16'
          )}
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-activedescendant={results[selected] ? `search-result-${results[selected].id}` : undefined}
        />
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCommandPalette();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-medium text-(var(--text-muted)) hover:text-(var(--text-primary)) hover:bg-(var(--bg-hover)) transition-colors border border-transparent hover:border-(var(--border-subtle))"
            title={t('shortcuts.commandPalette', 'Open command palette')}
            aria-label={t('shortcuts.commandPalette', 'Open command palette')}
          >
            <span className="flex items-center gap-0.5 font-sans">
              {isMac ? (
                <>
                  <Command size={12} className="shrink-0" aria-hidden />
                  <span>K</span>
                </>
              ) : (
                <span>Ctrl+K</span>
              )}
            </span>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-(var(--radius-card)) card-glass border border-(var(--border-subtle)) shadow-lg overflow-hidden max-h-[320px] overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-(var(--text-muted))">
              {resultsLoading ? t('common.loading', 'Loading...') : t('common.noResults', { query })}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                id={`search-result-${r.id}`}
                role="option"
                aria-selected={i === selected}
                type="button"
                onClick={() => handleSelect(r)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                  i === selected
                    ? 'bg-(var(--bg-hover)) text-(var(--text-primary))'
                    : 'text-(var(--text-secondary)) hover:bg-(var(--bg-hover))'
                )}
              >
                <span className="text-(var(--text-muted)) shrink-0">{TYPE_ICONS[r.type]}</span>
                <span className="flex-1 truncate font-medium">{r.label}</span>
                {r.meta && (
                  <span className="text-xs text-(var(--text-muted)) truncate max-w-[120px]">{r.meta}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
