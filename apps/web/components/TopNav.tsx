import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeContext';

const links = [
  { href: '/translate', label: 'Translate' },
  { href: '/transcribe', label: 'Transcribe' },
  { href: '/interpret', label: 'Interpret' },
  { href: '/explore', label: 'Explore' },
];

export default function TopNav() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  function isActive(href: string) {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-1 border-b border-border shadow-xs dark:bg-surface-1 dark:border-border">
      <div className="max-w-container mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0 font-heading text-lg font-bold text-text-primary">
          Vernacular
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full" style={{ backgroundColor: '#A8BEF7' }} />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Sign in
          </a>
          <a
            href="/orgs/signup"
            className="text-sm font-medium px-4 py-[7px] bg-accent text-accentOn rounded-md hover:bg-accent-hover transition-colors inline-flex items-center"
          >
            Create org account
          </a>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>

        <button
          className="md:hidden text-text-secondary hover:text-text-primary cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface-1 dark:bg-surface-1 border-b border-border px-6 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm font-medium ${
                isActive(link.href) ? 'text-text-primary' : 'text-text-secondary'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-border" />
          <a href="#" className="block text-sm text-text-secondary">Sign in</a>
          <a href="/orgs/signup" className="block text-sm font-medium text-accent">Create org account</a>
          <button onClick={toggle} className="block text-sm text-text-secondary cursor-pointer">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      )}
    </header>
  );
}
