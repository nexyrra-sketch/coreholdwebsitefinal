import { LogoMark } from './Logo';

export default function Footer() {
  return (
    <footer className="hairline-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="#top" className="flex items-center gap-3" aria-label="Back to top">
            <LogoMark size={24} className="text-ember" />
            <span className="font-display text-sm font-medium tracking-[0.22em] text-bone">
              COREHOLD
            </span>
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
            Intelligent systems studio in Dubai — automation, AI agents,
            custom platforms and conversational AI for businesses in the UAE
            and worldwide.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3">
          <a href="#trade" className="mono-label transition-colors hover:text-bone">The trade</a>
          <a href="#demo" className="mono-label transition-colors hover:text-bone">The demo</a>
          <a href="#position" className="mono-label transition-colors hover:text-bone">The position</a>
          <a href="#capabilities" className="mono-label transition-colors hover:text-bone">What we build</a>
          <a href="#method" className="mono-label transition-colors hover:text-bone">The method</a>
          <a href="#audit" className="mono-label mono-label--ember transition-colors hover:text-ember-bright">Request an audit</a>
        </nav>
        <div className="text-left md:text-right">
          <p className="mono-label">
            <a href="tel:+971503953988" className="transition-colors hover:text-bone">+971 50 395 3988</a>
            {' · '}
            <a
              href={'https://wa.me/971503953988?text=' + encodeURIComponent('Hi Corehold — I want to own the system my business runs on. Can we talk?')}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label--ember transition-colors hover:text-ember-bright"
            >
              WhatsApp ↗
            </a>
          </p>
          <p className="mono-label mt-3">25.2048° N · 55.2708° E</p>
          <p className="mono-label mt-3">
            © {new Date().getFullYear()} Corehold — built once, owned forever.
          </p>
        </div>
      </div>
    </footer>
  );
}
