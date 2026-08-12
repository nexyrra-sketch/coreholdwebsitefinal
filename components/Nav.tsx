'use client';

import { useEffect, useRef, useState } from 'react';
import { LogoMark } from './Logo';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [markVisible, setMarkVisible] = useState(false);
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) setMarkVisible(true);

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // Fallback: past the hero, the mark is simply present.
      if (window.scrollY > window.innerHeight * 2.6) setMarkVisible(true);
    };
    const onDock = (e: Event) => {
      const { docked } = (e as CustomEvent<{ docked: boolean }>).detail;
      setMarkVisible(docked);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('corehold:dock', onDock);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('corehold:dock', onDock);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-300 ${
        scrolled ? 'border-b border-line bg-ink/80 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <a href="#top" className="flex items-center gap-3" aria-label="Corehold — home">
          {/* The convergence docks the mark into this slot. */}
          <span
            ref={slotRef}
            id="nav-logo-slot"
            className="grid h-7 w-7 place-items-center text-ember transition-opacity duration-300"
            style={{ opacity: markVisible ? 1 : 0 }}
          >
            <LogoMark size={26} />
          </span>
          <span className="font-display text-[0.95rem] font-medium tracking-[0.22em] text-bone">
            COREHOLD
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="#method"
            className="mono-label hidden transition-colors hover:text-bone sm:block"
          >
            Method
          </a>
          <a
            href="#audit"
            className="mono-label mono-label--ember border border-ember-deep px-4 py-2.5 transition-colors hover:border-ember hover:text-ember-bright"
          >
            Request an audit
          </a>
        </div>
      </nav>
    </header>
  );
}
