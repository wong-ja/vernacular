import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const links = [
  { href: '/translate', label: 'Translate' },
  { href: '/transcribe', label: 'Transcribe' },
  { href: '/explore', label: 'Explore' },
];

export default function TopNav() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-1 border-b border-border dark:bg-brand-dark">
      <div className="max-w-container mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <picture>
            <source srcSet="/logo_dark.png" media="(prefers-color-scheme: dark)" />
            <Image
              src="/logo_light.png"
              alt="Vernacular"
              width={140}
              height={32}
              className="h-6 w-auto"
              priority
            />
          </picture>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                router.pathname === link.href
                  ? 'text-accent border-b-2 border-accent pb-0.5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Sign in
          </a>
          <a
            href="/orgs/signup"
            className="text-sm font-medium px-4 py-[6px] bg-accent text-accentOn rounded-md hover:bg-accent-hover transition-colors"
          >
            Create org account
          </a>
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
        <div className="md:hidden bg-surface-1 border-b border-border px-6 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm font-medium ${
                router.pathname === link.href ? 'text-accent' : 'text-text-secondary'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-border" />
          <a href="#" className="block text-sm text-text-secondary">Sign in</a>
          <a href="/orgs/signup" className="block text-sm font-medium text-accent">Create org account</a>
        </div>
      )}
    </header>
  );
}
