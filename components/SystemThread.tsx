'use client';

import { useEffect, useRef } from 'react';

/**
 * The system thread.
 *
 * One continuous circuit line that starts under the hero and travels
 * the entire page as you scroll — drawing itself live, ticking a
 * checkpoint node at every section it wires in, and plugging into
 * the audit form at the end. The page stops being sections and
 * becomes one connected machine.
 */
const STOPS = [
  { id: 'trade', label: 'TRADE' },
  { id: 'position', label: 'POSITION' },
  { id: 'demo', label: 'DEMO' },
  { id: 'capabilities', label: 'SYSTEMS' },
  { id: 'method', label: 'METHOD' },
  { id: 'audit', label: 'AUDIT' },
];

export default function SystemThread() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const nodesRef = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const host = hostRef.current!;
    const main = host.parentElement!; // <main>
    let total = 0;
    let startY = 0;
    let nodeLens: number[] = [];
    let raf = 0;

    const measure = () => {
      const mainRect = main.getBoundingClientRect();
      const mainTop = mainRect.top + window.scrollY;
      const x = window.innerWidth >= 640 ? 26 : 10;

      const ys = STOPS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY - mainTop + 2;
      }).filter((v): v is number => v !== null);
      if (ys.length < 2) return;

      startY = ys[0] - Math.min(220, window.innerHeight * 0.3);
      const endY = ys[ys.length - 1] + 120;

      // vertical run with a small circuit jog at each checkpoint
      let d = `M ${x} ${startY}`;
      const lens: number[] = [];
      let acc = 0;
      let prevY = startY;
      ys.forEach((y) => {
        const preY = y - 26;
        d += ` L ${x} ${preY} L ${x + 9} ${preY + 9} L ${x + 9} ${y + 4}`;
        acc += (preY - prevY) + Math.hypot(9, 9) + (y + 4 - (preY + 9));
        lens.push(acc);
        d += ` L ${x} ${y + 13}`;
        acc += Math.hypot(9, 9);
        prevY = y + 13;
      });
      d += ` L ${x} ${endY}`;

      const svg = host.querySelector('svg')!;
      svg.setAttribute('height', String(main.scrollHeight));
      svg.setAttribute('viewBox', `0 0 60 ${main.scrollHeight}`);
      pathRef.current!.setAttribute('d', d);
      glowRef.current!.setAttribute('d', d);
      total = pathRef.current!.getTotalLength();
      nodeLens = lens;

      // position node markers
      nodesRef.current.forEach((g, i) => {
        if (!g || ys[i] === undefined) return;
        g.setAttribute('transform', `translate(${x + 9}, ${ys[i]})`);
      });

      for (const p of [pathRef.current!, glowRef.current!]) {
        p.style.strokeDasharray = String(total);
      }
      draw();
    };

    const draw = () => {
      if (!total) return;
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      const cursor = window.scrollY + window.innerHeight * 0.62 - mainTop;
      const drawn = reduced
        ? total
        : Math.max(0, Math.min(total, cursor - startY));
      for (const p of [pathRef.current!, glowRef.current!]) {
        p.style.strokeDashoffset = String(total - drawn);
      }
      nodesRef.current.forEach((g, i) => {
        if (!g) return;
        const on = reduced || drawn >= (nodeLens[i] ?? Infinity);
        g.classList.toggle('thread-on', on);
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    measure();
    // layout settles late (fonts, demo panels): re-measure on any main resize
    const ro = new ResizeObserver(() => measure());
    ro.observe(main);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-16"
      style={{ zIndex: -1 }}
    >
      <svg width="60" preserveAspectRatio="none" className="absolute left-0 top-0 overflow-visible">
        <path ref={glowRef} fill="none" stroke="rgba(217,99,43,0.18)" strokeWidth="5" />
        <path ref={pathRef} fill="none" stroke="rgba(217,99,43,0.85)" strokeWidth="1.5" />
        {STOPS.map((s, i) => (
          <g key={s.id} ref={(el) => { nodesRef.current[i] = el; }} className="thread-node">
            <rect x="-3.5" y="-3.5" width="7" height="7" />
            <text x="14" y="3.5">{s.label} ✓</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
