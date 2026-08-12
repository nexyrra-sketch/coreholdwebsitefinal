const CAPABILITIES = [
  {
    n: '01',
    name: 'Automation',
    line: 'Your tools finally talk to each other. Work moves without being pushed.',
  },
  {
    n: '02',
    name: 'AI in operations',
    line: 'Models and agents inside the daily work — not bolted on beside it.',
  },
  {
    n: '03',
    name: 'Custom platforms',
    line: 'Software shaped to the business, engineered to be kept for a decade.',
  },
  {
    n: '04',
    name: 'Conversational AI',
    line: 'One interface that can speak for everything underneath it.',
  },
];

export default function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="cap-heading" className="hairline-t">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          What goes in
        </p>
        <h2 id="cap-heading" className="display-lg lockin" data-hold>
          Four capabilities. One core.
        </h2>

        <div className="held lockin-stagger mt-14 sm:mt-16" data-hold>
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <li key={cap.n} className="group relative bg-ink" data-cursor>
                <div className="relative h-full overflow-hidden p-6 transition-colors duration-300 group-hover:bg-ink-900 sm:p-9">
                  <span
                    className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-ember transition-transform duration-300 group-hover:scale-y-100"
                    aria-hidden="true"
                  />
                  <p className="mono-label mb-8">{cap.n}</p>
                  <h3 className="text-xl font-medium tracking-tight text-bone sm:text-2xl">
                    {cap.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-bone-dim">
                    {cap.line}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mono-label mt-8 lockin" data-hold>
          Every engagement ships as one connected system — not four products.
        </p>
      </div>
    </section>
  );
}
