'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LogoMark } from './Logo';

type Status = 'idle' | 'sending' | 'held';

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');

  // The demo can hand its result straight into this form.
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const { stack, company } = (e as CustomEvent<{ stack?: string; company?: string }>).detail ?? {};
      const stackEl = document.querySelector<HTMLTextAreaElement>('textarea[name="stack"]');
      const companyEl = document.querySelector<HTMLInputElement>('input[name="company"]');
      if (stackEl && stack) stackEl.value = stack;
      if (companyEl && company) companyEl.value = company;
    };
    window.addEventListener('corehold:prefill', onPrefill);
    return () => window.removeEventListener('corehold:prefill', onPrefill);
  }, []);
  const [ref] = useState(() => `CH-${new Date().getFullYear()}-A${String(Math.floor(Math.random() * 900) + 100)}`);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== 'idle') return;
    setStatus('sending');
    window.setTimeout(() => setStatus('held'), 1100);
  };

  return (
    <section id="audit" aria-labelledby="audit-heading" className="hairline-t">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mono-label mono-label--ember mb-5" data-hold>
            Start with the audit
          </p>
          <h2 id="audit-heading" className="display-lg lockin" data-hold>
            Tell us what your business runs on.
          </h2>
          <p className="mt-7 max-w-md text-base leading-relaxed text-bone-dim lockin" data-hold>
            We map it, put a price on the leaks, and tell you the truth about
            what to build — including <em className="not-italic text-bone">&ldquo;nothing&rdquo;</em>,
            if that&apos;s what the audit finds.
          </p>
          <dl className="mt-12 space-y-5 lockin-stagger" data-hold>
            <div className="flex items-baseline gap-4">
              <dt className="mono-label w-24 shrink-0">Studio</dt>
              <dd className="font-mono text-[0.78rem] tracking-[0.1em] text-bone">
                DUBAI, UAE — WORKING WORLDWIDE
              </dd>
            </div>
            <div className="flex items-baseline gap-4">
              <dt className="mono-label w-24 shrink-0">Capacity</dt>
              <dd className="font-mono text-[0.78rem] tracking-[0.1em] text-bone">
                A SMALL NUMBER OF ENGAGEMENTS AT A TIME
              </dd>
            </div>
            <div className="flex items-baseline gap-4">
              <dt className="mono-label w-24 shrink-0">Terms</dt>
              <dd className="font-mono text-[0.78rem] tracking-[0.1em] text-bone">
                YOU OWN EVERYTHING WE BUILD. FULLY DOCUMENTED.
              </dd>
            </div>
            <div className="flex items-baseline gap-4">
              <dt className="mono-label w-24 shrink-0">Direct</dt>
              <dd className="font-mono text-[0.78rem] tracking-[0.1em] text-bone">
                <a href="tel:+971503953988" className="transition-colors hover:text-ember-soft">
                  +971 50 395 3988
                </a>
                {' · '}
                <a
                  href={'https://wa.me/971503953988?text=' + encodeURIComponent('Hi Corehold — I want to own the system my business runs on. Can we talk?')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ember transition-colors hover:text-ember-bright"
                >
                  WHATSAPP ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="held lockin" data-hold>
          {status === 'held' ? (
            <div
              className="flex h-full min-h-[26rem] flex-col items-center justify-center border border-ember-deep bg-ink-900/50 px-8 text-center"
              role="status"
            >
              <LogoMark size={40} className="text-ember" />
              <p className="mt-8 text-2xl font-medium text-bone">Received. Held.</p>
              <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-bone-dim">
                We read every request personally and reply within two working
                days — with a straight answer either way.
              </p>
              <p className="mono-label mt-8">
                Audit request · <span className="text-ember">{ref}</span>
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-5 border border-line bg-ink-900/40 p-6 sm:p-8"
              aria-label="Audit request form"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="field">
                  <span className="mono-label mb-2 block">Name *</span>
                  <span className="corner corner-tl" aria-hidden="true" />
                  <input type="text" name="name" required autoComplete="name" placeholder="Your name" />
                  <span className="corner corner-br" aria-hidden="true" />
                </label>
                <label className="field">
                  <span className="mono-label mb-2 block">Company</span>
                  <span className="corner corner-tl" aria-hidden="true" />
                  <input type="text" name="company" autoComplete="organization" placeholder="Company" />
                  <span className="corner corner-br" aria-hidden="true" />
                </label>
              </div>
              <label className="field">
                <span className="mono-label mb-2 block">Email *</span>
                <span className="corner corner-tl" aria-hidden="true" />
                <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
                <span className="corner corner-br" aria-hidden="true" />
              </label>
              <label className="field">
                <span className="mono-label mb-2 block">What does the business run on today? *</span>
                <span className="corner corner-tl" aria-hidden="true" />
                <textarea
                  name="stack"
                  required
                  rows={4}
                  placeholder="The tools, the subscriptions, the spreadsheets holding it together."
                />
                <span className="corner corner-br" aria-hidden="true" />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button type="submit" className="btn-core" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Locking in…' : 'Send the request'}
                  <span aria-hidden="true">{status === 'sending' ? '' : '↘'}</span>
                </button>
                <p className="mono-label">No mailing list. No retainer pitch.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
