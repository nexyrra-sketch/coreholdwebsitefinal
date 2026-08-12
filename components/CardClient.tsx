'use client';

import { useEffect, useRef, useState } from 'react';
import { LogoMark } from './Logo';

const PHONE_DISPLAY = '+971 50 395 3988';
const WA_LINK =
  'https://wa.me/971503953988?text=' +
  encodeURIComponent('Hi Ghassan — got your card. I want to talk about owning the system my business runs on.');

/**
 * The founder's card — what the QR opens.
 * A held identity: the portrait gripped by the brackets, every
 * channel one tap away, the whole thing alive but precise.
 */
const BOOT = ['SCAN RECEIVED', 'IDENTITY: GHASSAN ADIL', 'STATUS: HELD ✓'];

export default function CardClient() {
  const [clock, setClock] = useState<string | null>(null);
  const [photoOk, setPhotoOk] = useState(true);
  const [shared, setShared] = useState(false);
  const [boot, setBoot] = useState(0);   // how many boot lines shown
  const [stage, setStage] = useState(0); // entrance choreography step
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  /* the photo may fail before hydration — check, don't assume */
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setPhotoOk(false);
  }, []);

  /* the entrance: scanned in, verified, held */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBoot(BOOT.length);
      setStage(4);
      return;
    }
    const timers = [
      window.setTimeout(() => setBoot(1), 150),
      window.setTimeout(() => { setBoot(2); setStage(1); }, 600),
      window.setTimeout(() => setStage(2), 1250),
      window.setTimeout(() => { setBoot(3); setStage(3); }, 1650),
      window.setTimeout(() => setStage(4), 2050),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  /* Dubai clock */
  useEffect(() => {
    const tick = () => {
      const t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date());
      setClock(t);
    };
    tick();
    const iv = window.setInterval(tick, 30_000);
    return () => window.clearInterval(iv);
  }, []);

  /* pointer tilt (fine pointers only) */
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const card = cardRef.current;
    if (!fine || reduced || !card) return;
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    };
    const onLeave = () => { card.style.transform = ''; };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    return () => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ghassan Adil — Corehold', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2000);
      }
    } catch { /* dismissed */ }
  };

  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-14"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(237,231,220,0.05) 1px, transparent 1px)',
        backgroundSize: '34px 34px',
      }}
    >
      {/* quiet header */}
      <a
        href="/"
        className="mb-6 flex items-center gap-3"
        aria-label="Corehold — visit the studio site"
      >
        <LogoMark size={22} className="text-ember" />
        <span className="font-display text-sm font-medium tracking-[0.22em] text-bone">COREHOLD</span>
      </a>

      {/* boot line: the scan being acknowledged */}
      <p
        className={`mb-5 h-4 font-mono text-[0.65rem] tracking-[0.16em] text-bone-dim uppercase ${
          boot < BOOT.length ? 'boot-caret' : ''
        }`}
        aria-hidden="true"
      >
        {BOOT.slice(0, boot).map((line, i) => (
          <span key={line} className={i === 2 ? 'text-ember' : ''}>
            {i > 0 && <span className="text-mute"> ▸ </span>}
            {line}
          </span>
        ))}
      </p>

      <div
        ref={cardRef}
        className={`held w-full max-w-sm transition-transform duration-200 ease-out ${stage >= 4 ? 'is-held' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`card-stage border border-line bg-ink-900/60 backdrop-blur-sm ${stage >= 1 ? 'on' : ''}`}>
          {/* portrait, scanned in and gripped */}
          <div className="relative overflow-hidden border-b border-line">
            {stage >= 1 && stage < 4 && <div className="card-scanline" />}
            {photoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src="/founder.jpg"
                alt="Ghassan Adil, founder of Corehold"
                className="block aspect-[4/4.4] w-full object-cover object-top"
                onError={() => setPhotoOk(false)}
              />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center bg-ink-800">
                <LogoMark size={72} className="text-ember" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
            <div className={`card-stage absolute inset-x-0 bottom-0 flex items-end justify-between p-5 ${stage >= 2 ? 'on' : ''}`}>
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-bone">Ghassan Adil</h1>
                <p className="mono-label mono-label--ember mt-2">Founder — Corehold · Dubai</p>
              </div>
            </div>
          </div>

          {/* status line */}
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="mono-label whitespace-nowrap">
              <span className="text-ember" aria-hidden="true">▪ </span>
              {clock ? `${clock} in Dubai` : 'Dubai'}
            </p>
            <p className="mono-label truncate">
              <span className="min-[420px]:hidden">Own it.</span>
              <span className="hidden min-[420px]:inline">Own it. Don&apos;t rent it.</span>
            </p>
          </div>

          {/* channels */}
          <div className={`card-stage p-5 ${stage >= 3 ? 'on' : ''}`}>
            <a href="/ghassan-adil.vcf" download className="btn-core w-full justify-center">
              Save contact <span aria-hidden="true">↓</span>
            </a>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex-col !gap-1.5 !px-2 !py-3 text-center"
                aria-label="Message Ghassan on WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mx-auto text-ember">
                  <rect x="3.2" y="3.2" width="17.6" height="14.6" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 17.8 V21.5 L11 17.8" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="8" y="8.5" width="8" height="1.8" fill="currentColor" />
                  <rect x="8" y="12" width="5" height="1.8" fill="currentColor" />
                </svg>
                <span className="text-[0.6rem]">WhatsApp</span>
              </a>
              <a
                href="tel:+971503953988"
                className="btn-ghost flex-col !gap-1.5 !px-2 !py-3 text-center"
                aria-label={`Call Ghassan on ${PHONE_DISPLAY}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mx-auto text-ember">
                  <path d="M5 4h4l1.8 4.4-2.2 2.2a13.5 13.5 0 0 0 4.8 4.8l2.2-2.2L20 15v4a1.6 1.6 0 0 1-1.7 1.6C10 20 4 14 3.4 5.7A1.6 1.6 0 0 1 5 4Z" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span className="text-[0.6rem]">Call</span>
              </a>
              <a
                href="mailto:audit@corehold.systems"
                className="btn-ghost flex-col !gap-1.5 !px-2 !py-3 text-center"
                aria-label="Email audit@corehold.systems"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mx-auto text-ember">
                  <rect x="3" y="5" width="18" height="14" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3.5 6 12 13 20.5 6" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span className="text-[0.6rem]">Email</span>
              </a>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="mono-label shrink-0">Mobile</dt>
                <dd className="font-mono text-[0.75rem] tracking-[0.08em] text-bone">{PHONE_DISPLAY}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="mono-label shrink-0">Email</dt>
                <dd className="font-mono text-[0.75rem] tracking-[0.08em] text-bone">audit@corehold.systems</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="mono-label shrink-0">Studio</dt>
                <dd className="font-mono text-[0.75rem] tracking-[0.08em] text-bone">corehold.systems</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* under-card actions */}
      <div className="mt-7 flex w-full max-w-sm items-center justify-between">
        <a href="/" className="mono-label transition-colors hover:text-bone">
          See what Corehold builds →
        </a>
        <button type="button" onClick={share} className="mono-label mono-label--ember transition-colors hover:text-ember-bright">
          {shared ? 'Link copied ✓' : 'Share this card'}
        </button>
      </div>

      <p className="mono-label mt-10 text-center">
        Corehold — intelligent systems studio · 25.2048° N, 55.2708° E
      </p>
    </main>
  );
}
