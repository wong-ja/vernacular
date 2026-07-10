import { useState, useRef, useEffect } from 'react';
import { REGIONS, getLanguagesByRegion } from '@vernacular/shared';

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label: string;
  includeAuto?: boolean;
}

export default function LanguageSelector({ value, onChange, label, includeAuto }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = !includeAuto || value ? getLanguagesByRegion('').find((l) => l.code === value) : null;

  const allLanguages = REGIONS.flatMap((region) => getLanguagesByRegion(region).map((l) => ({ ...l, region })));

  const filtered = search
    ? allLanguages.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      )
    : allLanguages;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-10 bg-surface-2 border border-border rounded-md px-[14px] text-left text-sm text-text-primary flex items-center justify-between hover:border-accent transition-colors cursor-pointer"
      >
        <span>{includeAuto && !value ? 'Detect automatically' : selected?.name || value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-40 bg-surface-1 border border-border rounded-lg shadow-md max-h-72 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            {includeAuto && (
              <button
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  !value ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-surface-3'
                }`}
              >
                Detect automatically
              </button>
            )}
            {filtered.map((l) => (
              <button
                key={l.code}
                onClick={() => { onChange(l.code); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  value === l.code ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-surface-3'
                }`}
              >
                <span className="text-text-primary">{l.name}</span>
                <span className="ml-2 text-text-tertiary">{l.nativeName || ''}</span>
                <span className="ml-2 text-xs text-text-tertiary">{l.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
