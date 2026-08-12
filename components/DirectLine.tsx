'use client';

import { useEffect, useRef, useState } from 'react';

const PHONE_DISPLAY = '+971 50 395 3988';
const PHONE_TEL = 'tel:+971503953988';
const WA_LINK =
  'https://wa.me/971503953988?text=' +
  encodeURIComponent('Hi Corehold — I want to own the system my business runs on. Can we talk?');

function ChatGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* a held conversation: square bubble, bracket tail */}
      <rect x="3.2" y="3.2" width="17.6" height="14.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 17.8 V21.5 L11 17.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter" />
      <rect x="8" y="8.5" width="8" height="1.8" fill="currentColor" />
      <rect x="8" y="12" width="5" height="1.8" fill="currentColor" />
    </svg>
  );
}

/**
 * The direct line — a bracket-held live channel to a human.
 * Appears after the hero, opens into WhatsApp + call.
 */
export default function DirectLine() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`direct-line fixed bottom-5 right-5 z-40 transition-all duration-500 sm:bottom-6 sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {/* panel */}
      <div
        id="direct-line-panel"
        className={`absolute bottom-full right-0 mb-3 w-[248px] origin-bottom-right border border-line bg-ink-900/95 backdrop-blur-md transition-all duration-300 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
        role="dialog"
        aria-label="Direct line to Corehold"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="mono-label">Direct line — Dubai</p>
          <span className="chip-dot" aria-hidden="true" />
        </div>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors hover:bg-ink-800"
        >
          <span className="text-ember"><ChatGlyph /></span>
          <span>
            <span className="block font-mono text-[0.78rem] tracking-[0.1em] text-bone uppercase">
              WhatsApp us
            </span>
            <span className="mono-label mt-0.5 block group-hover:text-ember-soft">
              A human replies. Fast.
            </span>
          </span>
          <span className="ml-auto text-ember" aria-hidden="true">↗</span>
        </a>
        <a
          href={PHONE_TEL}
          className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-800"
        >
          <span className="text-ember" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 4h4l1.8 4.4-2.2 2.2a13.5 13.5 0 0 0 4.8 4.8l2.2-2.2L20 15v4a1.6 1.6 0 0 1-1.7 1.6C10 20 4 14 3.4 5.7A1.6 1.6 0 0 1 5 4Z"
                stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" />
            </svg>
          </span>
          <span>
            <span className="block font-mono text-[0.78rem] tracking-[0.1em] text-bone uppercase">
              Call
            </span>
            <span className="mono-label mt-0.5 block group-hover:text-ember-soft">
              {PHONE_DISPLAY}
            </span>
          </span>
        </a>
      </div>

      {/* the held button */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="direct-line-panel"
        aria-label={open ? 'Close direct line' : 'Open direct line — WhatsApp or call Corehold'}
        onClick={() => setOpen((v) => !v)}
        className="held is-held relative grid h-12 w-12 place-items-center border border-line-strong bg-ink-900/90 text-ember backdrop-blur-md transition-colors hover:border-ember"
        style={{ ['--bracket-thick' as string]: '2px' }}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ) : (
          <ChatGlyph size={22} />
        )}
        <span className="chip-dot absolute -right-1 -top-1" aria-hidden="true" />
      </button>
    </div>
  );
}
