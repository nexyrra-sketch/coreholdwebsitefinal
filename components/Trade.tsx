'use client';

import { useState } from 'react';
import { LogoMark } from './Logo';

const RENTED = [
  { name: 'WEBSITE BUILDER', terms: 'renews monthly' },
  { name: 'CRM', terms: 'per seat · per month' },
  { name: 'AUTOMATION TOOL', terms: 'billed by usage' },
  { name: 'AI ASSISTANT', terms: 'subscription' },
  { name: 'LIVE CHAT', terms: 'per agent · per month' },
];

/**
 * The second set piece: a physical switch labelled with the only
 * question that matters. Flip it, and watch which side survives.
 */
export default function Trade() {
  const [paying, setPaying] = useState(true);

  return (
    <section id="trade" aria-labelledby="trade-heading" className="hairline-t">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          The trade
        </p>
        <h2 id="trade-heading" className="display-lg max-w-3xl lockin" data-hold>
          Software you rent is a cost.{' '}
          <span className="text-ember">A system you own is a position.</span>
        </h2>

        {/* Simulation panel */}
        <div className="held lockin mt-16 sm:mt-20" data-hold>
          <div className="border border-line bg-ink-900/40">
            {/* Panel header */}
            <div className="flex flex-col gap-5 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="mono-label">
                Simulation — what happens when the paying stops?
              </p>
              <div className="flex items-center gap-4">
                <span
                  className={`mono-label transition-colors ${paying ? 'text-bone' : ''}`}
                  aria-hidden="true"
                >
                  Paying
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={paying}
                  aria-label="Simulation: keep paying for software"
                  className="hold-switch"
                  onClick={() => setPaying((v) => !v)}
                >
                  <span className="thumb" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                      className={paying ? 'text-ink' : 'text-mute'}>
                      <path d="M12 3v8" strokeLinecap="square" />
                      <path d="M6.3 7a8 8 0 1 0 11.4 0" strokeLinecap="square" />
                    </svg>
                  </span>
                </button>
                <span
                  className={`mono-label transition-colors ${!paying ? 'text-ember' : ''}`}
                  aria-hidden="true"
                >
                  Stopped
                </span>
              </div>
            </div>

            {/* Two fates */}
            <div className="grid gap-px bg-line md:grid-cols-2">
              {/* Rented */}
              <div className="bg-ink p-5 sm:p-8">
                <p className="mono-label mb-6">The rented stack</p>
                <ul className={`space-y-3 ${paying ? '' : 'powered-off'}`}>
                  {RENTED.map((tool) => (
                    <li
                      key={tool.name}
                      className="chip-rented flex items-center justify-between border border-line bg-ink-900/60 px-4 py-3.5"
                    >
                      <span className="flex items-center gap-3">
                        <span className="chip-dot" aria-hidden="true" />
                        <span className="font-mono text-[0.72rem] tracking-[0.14em] text-bone">
                          {tool.name}
                        </span>
                      </span>
                      <span className="font-mono text-[0.62rem] tracking-[0.1em] text-mute uppercase">
                        {tool.terms}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 font-mono text-[0.72rem] tracking-[0.12em] uppercase" aria-live="polite">
                  {paying ? (
                    <span className="text-bone-dim">Five invoices. Zero ownership.</span>
                  ) : (
                    <span className="text-ember">Payment stops. The business goes dark.</span>
                  )}
                </p>
              </div>

              {/* Owned */}
              <div className="bg-ink p-5 sm:p-8">
                <p className="mono-label mb-6">An owned core</p>
                <div
                  className={`flex flex-col items-center justify-center gap-4 border border-ember-deep bg-ink-900/60 px-4 py-10 text-center ${
                    paying ? '' : 'core-alive'
                  }`}
                >
                  <LogoMark size={44} className="text-ember" />
                  <p className="font-mono text-[0.72rem] tracking-[0.18em] text-bone uppercase">
                    Your system
                  </p>
                  <p className="font-mono text-[0.62rem] tracking-[0.1em] text-mute uppercase">
                    automation · AI · platform · assistant
                  </p>
                </div>
                <p className="mt-6 font-mono text-[0.72rem] tracking-[0.12em] uppercase" aria-live="polite">
                  {paying ? (
                    <span className="text-bone-dim">One build. Yours outright.</span>
                  ) : (
                    <span className="text-ember-soft">Still running. It doesn&apos;t ask permission.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-2xl text-base leading-relaxed text-bone-dim lockin" data-hold>
          Stop paying your vendors and everything you rent switches off. Stop
          paying Corehold and nothing happens — the system was yours the day we
          handed it over. That is the entire trade.
        </p>
      </div>
    </section>
  );
}
