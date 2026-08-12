'use client';

import { useEffect, useState } from 'react';

/**
 * What we build — six shapes of intelligent system, each drawn as a
 * small machine that actually runs: signals move, decisions leave,
 * markets light up, structures assemble. All ember-on-ink, all cheap
 * to render, all paused until they enter view.
 */

const EMBER = '#d9632b';
const EMBER_SOFT = '#f2a06b';
const MUTE = '#776f61';
const LINE = '#33302a';

function Packet({ path, dur, begin, r = 2.6 }: { path: string; dur: string; begin: string; r?: number }) {
  return (
    <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={EMBER}>
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur={dur} begin={begin} repeatCount="indefinite" />
    </rect>
  );
}

export default function Systems() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const SYSTEMS: { n: string; name: string; line: string; fig: React.ReactNode }[] = [
    {
      n: '01',
      name: 'Operations intelligence',
      line: 'AI inside the daily work — it reads, decides, routes and does. On your terms, inside your walls.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          {[25, 65, 105].map((y) => (
            <path key={y} d={`M10 ${y} H84 L96 65`} fill="none" stroke={LINE} strokeWidth="1" />
          ))}
          <path d="M124 65 H210" fill="none" stroke={LINE} strokeWidth="1" />
          <rect x="96" y="51" width="28" height="28" fill="none" stroke={EMBER} strokeWidth="1.5" />
          <rect className="d-anim sys-corepulse" x="104" y="59" width="12" height="12" fill={EMBER} />
          {motion && (
            <>
              <Packet path="M10 25 L84 25 L96 63" dur="2.6s" begin="0s" />
              <Packet path="M10 65 H94" dur="2.6s" begin="0.9s" />
              <Packet path="M10 105 L84 105 L96 67" dur="2.6s" begin="1.7s" />
              <Packet path="M124 65 H210" dur="1.8s" begin="0.5s" r={3.2} />
              <Packet path="M124 65 H210" dur="1.8s" begin="1.5s" r={3.2} />
            </>
          )}
          <text x="10" y="18" className="sysfig-label">SIGNALS IN</text>
          <text x="210" y="58" textAnchor="end" className="sysfig-label sysfig-label--ember">DECISIONS OUT</text>
        </svg>
      ),
    },
    {
      n: '02',
      name: 'Flow systems',
      line: 'Work that moves itself. Information arrives where it’s needed before anyone has to ask.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          <path d="M12 104 H60 V30 H150 V86 H208" fill="none" stroke={LINE} strokeWidth="1.2" />
          {[[60, 104], [60, 30], [150, 30], [150, 86]].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x - 5} y={y - 5} width="10" height="10" fill="#0b0b09" stroke={MUTE} strokeWidth="1" />
          ))}
          <rect x="203" y="81" width="10" height="10" fill={EMBER} className="d-anim sys-corepulse" />
          {motion && (
            <>
              <Packet path="M12 104 H60 V30 H150 V86 H208" dur="3.4s" begin="0s" r={3} />
              <Packet path="M12 104 H60 V30 H150 V86 H208" dur="3.4s" begin="1.7s" r={3} />
            </>
          )}
          <text x="12" y="122" className="sysfig-label">NO HANDS</text>
        </svg>
      ),
    },
    {
      n: '03',
      name: 'Conversational systems',
      line: 'A voice for the business that answers in seconds, every hour of the year — and never asks for a seat licence.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          <g className="d-anim sys-ask">
            <rect x="14" y="24" width="92" height="30" fill="rgba(18,18,16,0.9)" stroke="#3a362e" strokeWidth="1" />
            {[36, 50, 64].map((x, i) => (
              <circle key={x} className={`d-anim sys-typing sys-typing-${i}`} cx={x} cy="39" r="2.6" fill={MUTE} />
            ))}
            <text x="14" y="18" className="sysfig-label">CUSTOMER · 02:47</text>
          </g>
          <g className="d-anim sys-reply">
            <rect x="114" y="72" width="92" height="30" fill="rgba(217,99,43,0.07)" stroke={EMBER} strokeWidth="1.2" />
            <path d="M128 87 l5 5 l10 -11" fill="none" stroke={EMBER_SOFT} strokeWidth="2" />
            <text x="150" y="91" className="sysfig-label sysfig-label--ember">ANSWERED · 02:47</text>
          </g>
        </svg>
      ),
    },
    {
      n: '04',
      name: 'Owned platforms',
      line: 'The software you always needed but could never rent — shaped to the business, deed included.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          <rect className="d-anim sys-block sys-block-1" x="86" y="86" width="48" height="16" fill="none" stroke={EMBER} strokeWidth="1.4" />
          <rect className="d-anim sys-block sys-block-2" x="86" y="66" width="48" height="16" fill="none" stroke={EMBER} strokeWidth="1.4" />
          <rect className="d-anim sys-block sys-block-3" x="86" y="46" width="48" height="16" fill="rgba(217,99,43,0.25)" stroke={EMBER} strokeWidth="1.4" />
          <path className="d-anim sys-grip sys-grip-tl" d="M70 52 V34 H96" fill="none" stroke={EMBER} strokeWidth="3" />
          <path className="d-anim sys-grip sys-grip-br" d="M150 96 V114 H124" fill="none" stroke={EMBER} strokeWidth="3" />
          <text x="110" y="126" textAnchor="middle" className="sysfig-label">BUILT · HELD · DEEDED</text>
        </svg>
      ),
    },
    {
      n: '05',
      name: 'Growth systems',
      line: 'Marketing as a machine: it finds your market, learns which message lands, and scales the ones that do.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          <rect x="30" y="59" width="14" height="14" fill={EMBER} />
          <circle className="d-anim sys-ring sys-ring-1" cx="37" cy="66" r="10" fill="none" stroke={EMBER} strokeWidth="1" />
          <circle className="d-anim sys-ring sys-ring-2" cx="37" cy="66" r="10" fill="none" stroke={EMBER} strokeWidth="1" />
          {[[104, 26], [140, 44], [176, 30], [120, 68], [168, 74], [104, 100], [148, 106], [190, 98]].map(([x, y], i) => (
            <rect
              key={i}
              className={`d-anim sys-market sys-market-${i % 4}`}
              x={x - 3} y={y - 3} width="6" height="6" fill={MUTE}
            />
          ))}
          {motion && (
            <>
              <Packet path="M140 44 C 110 50, 80 58, 44 64" dur="2.8s" begin="1.2s" />
              <Packet path="M148 106 C 115 100, 80 84, 44 70" dur="2.8s" begin="2.1s" />
            </>
          )}
          <text x="30" y="122" className="sysfig-label">SIGNAL OUT</text>
          <text x="190" y="122" textAnchor="end" className="sysfig-label sysfig-label--ember">DEMAND BACK</text>
        </svg>
      ),
    },
    {
      n: '06',
      name: 'Decision systems',
      line: 'One memory across the whole business. The numbers assemble themselves into answers.',
      fig: (
        <svg viewBox="0 0 220 130" className="sysfig" aria-hidden="true">
          {[
            { x: 46, h: 18, dx: -26, dy: -52 },
            { x: 78, h: 30, dx: 30, dy: -60 },
            { x: 110, h: 24, dx: -44, dy: -30 },
            { x: 142, h: 42, dx: 40, dy: -44 },
            { x: 174, h: 34, dx: 12, dy: -66 },
          ].map((b, i) => (
            <rect
              key={b.x}
              className="d-anim sys-bar"
              style={{ ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, animationDelay: `${i * 0.14}s` }}
              x={b.x} y={104 - b.h} width="14" height={b.h}
              fill={i === 3 ? 'rgba(217,99,43,0.55)' : 'rgba(119,111,97,0.45)'}
              stroke={i === 3 ? EMBER : MUTE} strokeWidth="1"
            />
          ))}
          <line x1="36" y1="104" x2="198" y2="104" stroke={LINE} strokeWidth="1.2" />
          <rect className="d-anim sys-readout" x="36" y="24" width="162" height="2" fill={EMBER} />
          <text x="36" y="18" className="sysfig-label sysfig-label--ember">THE ANSWER, ASSEMBLING</text>
        </svg>
      ),
    },
  ];

  return (
    <section id="capabilities" aria-labelledby="cap-heading" className="hairline-t">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          What we build
        </p>
        <h2 id="cap-heading" className="display-lg max-w-3xl lockin" data-hold>
          Intelligent systems, in every shape a business can need.
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-bone-dim lockin" data-hold>
          A system is anything that thinks, moves or decides for you. These are
          the shapes we build most — each one delivered whole, documented, and
          owned outright.
        </p>

        <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((sys) => (
            <li key={sys.n} className="syscard lockin group relative bg-ink" data-hold data-cursor>
              <div className="relative h-full overflow-hidden p-6 transition-colors duration-300 group-hover:bg-ink-900 sm:p-7">
                <span
                  className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-ember transition-transform duration-300 group-hover:scale-y-100"
                  aria-hidden="true"
                />
                <div className="mb-5 border border-line/60 bg-ink-900/30">{sys.fig}</div>
                <p className="mono-label mb-3">{sys.n}</p>
                <h3 className="text-lg font-medium tracking-tight text-bone sm:text-xl">
                  {sys.name}
                </h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-bone-dim">
                  {sys.line}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mono-label mt-8 lockin" data-hold>
          Six shapes. One rule: if it runs your business, you should own it.
        </p>
      </div>
    </section>
  );
}
