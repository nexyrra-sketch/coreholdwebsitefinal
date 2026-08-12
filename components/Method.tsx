'use client';

import { useEffect, useRef, useState } from 'react';

const STAGES = [
  {
    n: '01',
    name: 'Audit',
    copy: 'We map how the business actually operates. Every tool, every handoff, every place the truth is duplicated.',
  },
  {
    n: '02',
    name: 'Diagnose',
    copy: 'We find exactly where money and time leak — and put a number on what each leak costs you.',
  },
  {
    n: '03',
    name: 'Architect',
    copy: 'We design the smallest system that changes the most. Nothing speculative survives this stage.',
  },
  {
    n: '04',
    name: 'Build',
    copy: 'We build it to be kept: documented, tested, boring where it should be — engineered for a decade of service.',
  },
  {
    n: '05',
    name: 'Hand over',
    copy: 'Code, keys, documentation, data — everything transfers to you. Nothing requires Corehold ever again.',
  },
];

// Diagram geometry: twelve operations, five that matter, one core.
const DOTS: [number, number][] = [
  [52, 68], [140, 44], [258, 60], [348, 92], [60, 168], [338, 190],
  [46, 282], [128, 348], [232, 338], [352, 320], [200, 120], [288, 262],
];
const CHOSEN = [1, 4, 5, 8, 11];
const LEAKS = [2, 6, 9];
const CORE = { x: 150, y: 150, s: 100 };

function edgePoint(x: number, y: number): [number, number] {
  const cx = 200, cy = 200, h = CORE.s / 2;
  const dx = x - cx, dy = y - cy;
  const m = Math.max(Math.abs(dx), Math.abs(dy)) / h;
  return [cx + dx / m, cy + dy / m];
}

function MethodFigure({ active }: { active: number }) {
  return (
    <svg viewBox="0 0 400 400" className="method-fig relative w-full">
      {/* the operation, as found */}
      <g>
        {DOTS.map(([x, y], i) => (
          <rect key={i} x={x - 2.5} y={y - 2.5} width="5" height="5"
            fill={CHOSEN.includes(i) && active >= 2 ? '#d9632b' : '#776f61'}
            opacity={active >= 2 && !CHOSEN.includes(i) ? 0.25 : 0.85}
            style={{ transition: 'fill 0.5s ease, opacity 0.5s ease' }}
          />
        ))}
      </g>

      {/* 01 — audit sweep */}
      <g data-stage="1" className={active === 0 ? 'on' : ''}>
        <path d="M8 40 V8 H40" stroke="#d9632b" strokeWidth="2" fill="none" />
        <path d="M392 360 V392 H360" stroke="#d9632b" strokeWidth="2" fill="none" />
        <rect className="scanline" x="8" y="20" width="384" height="1.5" fill="#d9632b" opacity="0.7" />
      </g>

      {/* 02 — leaks */}
      <g data-stage="2" className={active === 1 ? 'on' : ''}>
        {LEAKS.map((i, k) => {
          const [x, y] = DOTS[i];
          return (
            <g key={i}>
              <rect x={x - 3} y={y - 3} width="6" height="6" fill="#f07c3e" />
              <circle className={`leak ${k === 1 ? 'd2' : k === 2 ? 'd3' : ''}`}
                cx={x} cy={y} r="6" fill="none" stroke="#d9632b" strokeWidth="1" />
            </g>
          );
        })}
      </g>

      {/* 03 — the smallest system */}
      <g data-stage="3" className={active === 2 ? 'on' : ''}>
        <rect x={CORE.x} y={CORE.y} width={CORE.s} height={CORE.s}
          fill="none" stroke="#d9632b" strokeWidth="1.5" strokeDasharray="7 7" />
        {CHOSEN.map((i) => {
          const [x, y] = DOTS[i];
          return <rect key={i} x={x - 7} y={y - 7} width="14" height="14"
            fill="none" stroke="#d9632b" strokeWidth="1" />;
        })}
      </g>

      {/* 04 — build the connections */}
      <g data-stage="4" className={active === 3 ? 'on' : ''}>
        {CHOSEN.map((i) => {
          const [x, y] = DOTS[i];
          const [ex, ey] = edgePoint(x, y);
          return <line key={i} className="drawline" x1={x} y1={y} x2={ex} y2={ey}
            stroke="#d9632b" strokeWidth="1.5" />;
        })}
        <rect className="corefill" x={CORE.x} y={CORE.y} width={CORE.s} height={CORE.s} fill="#d9632b" />
      </g>

      {/* 05 — held, and handed over */}
      <g data-stage="5" className={active === 4 ? 'on' : ''}>
        <rect x={CORE.x} y={CORE.y} width={CORE.s} height={CORE.s} fill="#d9632b" />
        <path d="M118 118h84v18h-66v66h-18z" fill="#d9632b" />
        <path d="M282 282h-84v-18h66v-66h18z" fill="#d9632b" />
        <text x="200" y="330" textAnchor="middle" fill="#a9a294"
          style={{ font: '10px "IBM Plex Mono", monospace', letterSpacing: '0.2em' }}>
          DOCUMENTED · TRANSFERRED · YOURS
        </text>
      </g>
    </svg>
  );
}

export default function Method() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.stage);
            setActive(idx);
          }
        }
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="method" aria-labelledby="method-heading" className="hairline-t">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          The Corehold Method
        </p>
        <h2 id="method-heading" className="display-lg max-w-3xl lockin" data-hold>
          Five stages. Run in order. Every time.
        </h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Sticky diagram */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="sticky top-28">
              <div className="relative border border-line bg-ink-900/40 p-6">
                <span className="pointer-events-none absolute right-4 top-2 select-none font-display text-[7rem] font-medium leading-none text-ink-700">
                  {STAGES[active].n}
                </span>
                <MethodFigure active={active} />
              </div>
            </div>
          </div>

          {/* the same living diagram, riding along on smaller screens */}
          <div className="lg:hidden" aria-hidden="true">
            <div className="sticky top-16 z-20 -mx-5 border-y border-line bg-ink px-5 py-3 sm:-mx-8 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="w-[96px] shrink-0 border border-line bg-ink-900/40 p-1.5">
                  <MethodFigure active={active} />
                </div>
                <div>
                  <p className="mono-label mono-label--ember">Stage {STAGES[active].n} / 05</p>
                  <p className="mt-1 text-lg font-medium tracking-tight text-bone">
                    {STAGES[active].name}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Stages */}
          <ol className="space-y-4">
            {STAGES.map((stage, i) => (
              <li
                key={stage.n}
                data-stage={i}
                ref={(el) => { refs.current[i] = el; }}
                className={`border px-6 py-8 transition-colors duration-500 sm:px-8 sm:py-10 lg:min-h-[38vh] lg:flex lg:flex-col lg:justify-center ${
                  active === i ? 'border-ember-deep bg-ink-900/50' : 'border-line'
                }`}
              >
                <p className={`mono-label transition-colors ${active === i ? 'text-ember' : ''}`}>
                  Stage {stage.n}
                </p>
                <h3 className="mt-4 text-2xl font-medium tracking-tight text-bone sm:text-3xl">
                  {stage.name}
                </h3>
                <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-bone-dim">
                  {stage.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* The honesty clause */}
        <figure className="held lockin mx-auto mt-20 max-w-2xl px-2 py-2 text-center" data-hold>
          <blockquote className="text-xl leading-relaxed text-bone sm:text-2xl">
            If the audit finds you need nothing new, we tell you exactly that.
            The engagement ends there — and you keep the map.
          </blockquote>
          <figcaption className="mono-label mt-5">
            The clause every proposal includes
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
