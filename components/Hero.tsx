'use client';

import { useEffect, useRef, useState } from 'react';
import { ConvergenceEngine } from '@/lib/convergence';

const CAPTIONS = [
  'A rented tool for everything. None of it yours.',
  'We wire them into one system.',
  'One core. Everything inside.',
  'Held. Yours. Forever.',
];
const STATES = ['SCATTERED', 'LINKING', 'RESOLVING', 'HELD'];

export default function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [clock, setClock] = useState<string | null>(null);

  /* the site knows what time it is in Dubai */
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date());
      const hour = parseInt(parts.split(':')[0], 10);
      const night = hour >= 21 || hour < 7;
      setClock(
        night
          ? `${parts} in Dubai — a held system would be working right now.`
          : `${parts} in Dubai — somewhere, a renewal just cleared.`
      );
    };
    tick();
    const iv = window.setInterval(tick, 30_000);
    return () => window.clearInterval(iv);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const sticky = stickyRef.current!;

    const engine = new ConvergenceEngine(
      canvas,
      { reduced: mq.matches, mobile },
      {
        onPhase: setPhase,
        onProgress: (pct) => {
          if (pctRef.current) pctRef.current.textContent = String(pct).padStart(3, '0');
          if (stateRef.current) {
            const s = pct < 44 ? 0 : pct < 70 ? 1 : pct < 88 ? 2 : 3;
            stateRef.current.textContent = STATES[s];
          }
        },
        onDock: (docked) => {
          window.dispatchEvent(new CustomEvent('corehold:dock', { detail: { docked } }));
        },
      }
    );

    const setNavTarget = () => {
      const slot = document.getElementById('nav-logo-slot');
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      engine.setNavTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width });
    };
    setNavTarget();

    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const range = rect.height - vh;
      const p = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 1;
      engine.setProgress(p);
      // Headline recedes as the system starts moving
      if (headRef.current && !mq.matches) {
        const fade = Math.min(1, p / 0.13);
        headRef.current.style.opacity = String(1 - fade);
        headRef.current.style.transform = `translateY(${fade * -26}px)`;
        headRef.current.style.pointerEvents = fade > 0.6 ? 'none' : '';
      }
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; raf = requestAnimationFrame(update); }
    };
    const onResize = () => { engine.resize(); setNavTarget(); update(); };
    let dragging = false;
    const onPointer = (e: PointerEvent) => {
      const r = sticky.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      engine.setPointer(x, y, true);
      if (dragging) engine.coreDragTo(x, y);
    };
    const onPointerLeave = () => engine.setPointer(-9999, -9999, false);
    // the grip test: try to pull the held core away
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return; // touch keeps scrolling the story
      const r = sticky.getBoundingClientRect();
      if (engine.coreHit(e.clientX - r.left, e.clientY - r.top)) {
        dragging = true;
        engine.beginCoreDrag();
        sticky.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      engine.endCoreDrag();
      try { sticky.releasePointerCapture(e.pointerId); } catch { /* released */ }
    };

    const io = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? engine.start() : engine.stop(); },
      { threshold: 0 }
    );
    io.observe(wrap);

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    sticky.addEventListener('pointermove', onPointer, { passive: true });
    sticky.addEventListener('pointerleave', onPointerLeave);
    sticky.addEventListener('pointerdown', onPointerDown);
    sticky.addEventListener('pointerup', onPointerUp);
    sticky.addEventListener('pointercancel', onPointerUp);

    return () => {
      io.disconnect();
      engine.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      sticky.removeEventListener('pointermove', onPointer);
      sticky.removeEventListener('pointerleave', onPointerLeave);
      sticky.removeEventListener('pointerdown', onPointerDown);
      sticky.removeEventListener('pointerup', onPointerUp);
      sticky.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <section id="top" aria-label="Corehold — own the system your business runs on">
      <div ref={wrapRef} className={reduced ? 'h-auto' : 'h-[260vh] md:h-[320vh]'}>
        <div
          ref={stickyRef}
          className={`${reduced ? 'relative' : 'sticky top-0'} flex h-dvh flex-col overflow-hidden`}
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(237,231,220,0.05) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

          {/* Headline */}
          <div
            ref={headRef}
            className="relative z-10 mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-5 text-center"
          >
            <p className="mono-label mono-label--ember mb-6">
              Intelligent systems studio — Dubai · worldwide
            </p>
            <h1 className="display-xl">
              Own the system your business runs on.{' '}
              <span className="block text-ember">Stop renting it.</span>
            </h1>
            <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-bone-dim sm:text-lg">
              We replace your stack of subscriptions with one connected system —
              automation, AI and software your business owns outright.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#audit" className="btn-core">
                Request an audit
                <span aria-hidden="true">↘</span>
              </a>
              <a href="#method" className="btn-ghost">
                The method
              </a>
            </div>
            <div className="mt-8 h-4">
              {clock && (
                <p className="mono-label">
                  {clock}
                </p>
              )}
            </div>
          </div>

          {/* Choreography captions */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-1.5 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-6">
            <div className="relative h-6 w-full min-w-0 sm:w-auto sm:flex-1">
              {CAPTIONS.map((c, i) => (
                <p
                  key={c}
                  className={`hero-caption absolute bottom-0 left-0 max-w-[92vw] truncate font-mono text-[0.72rem] tracking-[0.14em] text-bone-dim uppercase sm:max-w-[62vw] ${
                    (reduced ? i === 3 : phase === i) ? 'on' : ''
                  }`}
                >
                  <span className="text-ember" aria-hidden="true">▪ </span>
                  {c}
                </p>
              ))}
            </div>
            <p className="mono-label shrink-0 sm:pl-4" aria-hidden="true">
              SYS <span ref={pctRef}>{reduced ? '100' : '000'}</span>%
              {' — '}
              <span ref={stateRef} className="text-ember">{reduced ? 'HELD' : 'SCATTERED'}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
