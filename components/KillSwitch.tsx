'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The real test. A breaker for the website itself.
 *
 * Flip it: the entire site dies the way an unpaid stack dies —
 * grayscale, flicker, 402 stamps on every section. The only living
 * thing left is the core, beating mid-screen. Click it, and the
 * whole site is gripped back in one snap.
 */
export default function KillSwitch() {
  const [dead, setDead] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [ring, setRing] = useState(0);
  const hintTimer = useRef<number>(0);

  useEffect(() => {
    if (dead) {
      document.body.classList.add('sys-dead');
      hintTimer.current = window.setTimeout(() => setShowHint(true), 1800);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') revive(); };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        window.clearTimeout(hintTimer.current);
      };
    }
    document.body.classList.remove('sys-dead');
    setShowHint(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dead]);

  // never leave the site dead on unmount
  useEffect(() => () => document.body.classList.remove('sys-dead'), []);

  const revive = () => {
    setDead(false);
    setRing((r) => r + 1);
  };

  return (
    <section aria-labelledby="kill-heading" className="hairline-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:py-20">
        <div className="max-w-xl">
          <p className="mono-label mono-label--ember mb-4" data-hold>
            The real test
          </p>
          <h2 id="kill-heading" className="text-2xl font-medium tracking-tight text-bone sm:text-3xl lockin" data-hold>
            You felt it in miniature. Now do it to this entire website.
          </h2>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-bone-dim lockin" data-hold>
            This site runs like everything we build: one owned core. Cut the
            power and see what survives.
          </p>
        </div>

        <div className="flex items-center gap-4 lockin" data-hold>
          <span className={`mono-label ${dead ? '' : 'text-bone'}`} aria-hidden="true">Powered</span>
          <button
            type="button"
            role="switch"
            aria-checked={!dead}
            aria-label="Cut the power to this website"
            className="hold-switch"
            onClick={() => (dead ? revive() : setDead(true))}
          >
            <span className="thumb" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                className={dead ? 'text-mute' : 'text-ink'}>
                <path d="M12 3v8" strokeLinecap="square" />
                <path d="M6.3 7a8 8 0 1 0 11.4 0" strokeLinecap="square" />
              </svg>
            </span>
          </button>
          <span className={`mono-label ${dead ? 'text-ember' : ''}`} aria-hidden="true">Cut</span>
        </div>
      </div>

      {/* status for screen readers */}
      <p className="sr-only" aria-live="assertive">
        {dead
          ? 'Simulation: the website has gone dark, like an unpaid software stack. Activate the core, or press Escape, to restore it.'
          : 'The website is restored.'}
      </p>

      {/* the survivor — portaled to <body> so the death filter can't touch it */}
      {dead && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] grid place-items-center"
            role="dialog"
            aria-label="The owned core — the only thing still running"
            style={{
              background:
                'radial-gradient(circle at center, rgba(11,11,9,0.9) 0%, rgba(11,11,9,0.55) 45%, rgba(11,11,9,0.25) 100%)',
            }}
          >
            <div className="pointer-events-auto flex flex-col items-center">
              <button
                type="button"
                onClick={revive}
                aria-label="Activate the core to restore the website"
                className="core-alive grid h-20 w-20 place-items-center bg-ember transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-soft"
                style={{ boxShadow: '0 0 60px 10px rgba(217,99,43,0.35)' }}
              />
              <p
                className={`mono-label mt-6 text-center transition-opacity duration-700 ${showHint ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden="true"
              >
                The owned core doesn&apos;t need permission.
                <span className="mt-1 block text-ember">Click it to take everything back.</span>
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* revive pulse */}
      {ring > 0 && !dead && typeof document !== 'undefined' &&
        createPortal(
          <div key={ring} className="pointer-events-none fixed inset-0 z-[69] grid place-items-center" aria-hidden="true">
            <div className="revive-ring h-24 w-24 border-2 border-ember" />
          </div>,
          document.body
        )}
    </section>
  );
}
