/**
 * The Position — the ownership argument, made in full.
 * No tool names, no categories. Just the case, and the curve.
 */

const STATEMENTS = [
  {
    n: '01',
    text: 'Rent is a treadmill. Every month you pay to stand exactly where you already are.',
  },
  {
    n: '02',
    text: 'Every tool you rent is also renting you — your data, your habits and your margins are feeding someone else’s asset.',
  },
  {
    n: '03',
    text: 'Ownership compounds. Year one it works. Year three it knows your business. Year five it’s the reason competitors can’t catch you.',
  },
  {
    n: '04',
    text: 'Renting buys you access. Owning buys you advantage. They have never been the same product.',
  },
];

export default function Doctrine() {
  return (
    <section id="position" aria-labelledby="position-heading" className="hairline-t">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          The position
        </p>
        <h2 id="position-heading" className="display-lg max-w-3xl lockin" data-hold>
          Every business is becoming a system.{' '}
          <span className="text-ember">The only question is who owns yours.</span>
        </h2>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          {/* the argument */}
          <ol className="space-y-10">
            {STATEMENTS.map((s) => (
              <li key={s.n} className="lockin flex gap-5" data-hold>
                <span className="mono-label mt-2 shrink-0">{s.n}</span>
                <p className="text-xl leading-snug text-bone sm:text-2xl">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>

          {/* the curve: what renting resets, owning compounds */}
          <div className="lg:pt-2">
            <div className="held lockin curve-draw" data-hold>
              <figure className="border border-line bg-ink-900/40 p-6 sm:p-8" aria-label="Conceptual figure: rented value resets every billing cycle, owned value compounds every year">
                <svg viewBox="0 0 560 260" className="w-full" aria-hidden="true">
                  {/* year grid */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <line x1={40 + i * 120} y1="20" x2={40 + i * 120} y2="218" stroke="#26241f" strokeWidth="1" />
                      <text x={40 + i * 120} y="242" textAnchor="middle"
                        style={{ font: '10px "IBM Plex Mono", monospace', letterSpacing: '0.12em' }} fill="#776f61">
                        YR {i + 1}
                      </text>
                    </g>
                  ))}
                  {/* renting: pays, resets, pays, resets */}
                  <path
                    className="curve curve-rent"
                    d="M40 200 L100 190 L104 201 L160 191 L164 202 L220 192 L224 202 L280 191 L284 202 L340 192 L344 202 L400 191 L404 202 L460 192 L464 202 L520 193"
                    fill="none" stroke="#776f61" strokeWidth="1.6"
                  />
                  {/* owning: compounds */}
                  <path
                    className="curve curve-own"
                    d="M40 202 C 140 200, 220 190, 300 160 C 380 130, 460 80, 520 38"
                    fill="none" stroke="#d9632b" strokeWidth="2.2"
                  />
                  <g className="curve-endpulse">
                    <rect x="514" y="32" width="12" height="12" fill="#d9632b" />
                  </g>
                  <text x="520" y="20" textAnchor="end" fill="#f2a06b"
                    style={{ font: '11px "IBM Plex Mono", monospace', letterSpacing: '0.14em' }}>
                    OWNED — COMPOUNDS
                  </text>
                  <text x="520" y="180" textAnchor="end" fill="#776f61"
                    style={{ font: '11px "IBM Plex Mono", monospace', letterSpacing: '0.14em' }}>
                    RENTED — RESETS
                  </text>
                </svg>
                <figcaption className="mono-label mt-4">
                  Same money. Two different futures.
                </figcaption>
              </figure>
            </div>

            <p className="lockin mt-10 max-w-md text-base leading-relaxed text-bone-dim" data-hold>
              This is the whole argument. What you rent works the same on the
              last day as the first — and vanishes the day you stop. What you
              own gets sharper every year it runs, and it never sends another
              invoice. The next decade won&apos;t be won by whoever has the most
              tools.{' '}
              <span className="text-bone">
                It will be won by whoever owns the system underneath.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
