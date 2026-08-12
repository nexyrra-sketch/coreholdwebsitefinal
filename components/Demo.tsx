'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DemoStage, DemoTool } from '@/lib/demoEngine';
import { generateBlueprint } from '@/lib/blueprint';

/* ————— data ————— */

interface Tool { id: string; label: string; cat: string; price: number; selected: boolean }

const PRESETS: Omit<Tool, 'selected'>[] = [
  { id: 'website', label: 'Website builder', cat: 'website', price: 45 },
  { id: 'crm', label: 'CRM', cat: 'crm', price: 149 },
  { id: 'chat', label: 'WhatsApp / live chat', cat: 'chat', price: 99 },
  { id: 'sheets', label: 'Sheets / Excel', cat: 'sheets', price: 30 },
  { id: 'ai', label: 'AI assistant', cat: 'ai', price: 80 },
  { id: 'automation', label: 'Automation tool', cat: 'automation', price: 73 },
  { id: 'invoicing', label: 'Invoicing', cat: 'invoicing', price: 55 },
  { id: 'email', label: 'Email marketing', cat: 'email', price: 60 },
  { id: 'bookings', label: 'Bookings / calendar', cat: 'bookings', price: 40 },
  { id: 'support', label: 'Support desk', cat: 'support', price: 95 },
  { id: 'storage', label: 'Cloud storage', cat: 'storage', price: 20 },
  { id: 'ads', label: 'Ads manager', cat: 'ads', price: 50 },
];
const DEFAULT_ON = new Set(['website', 'crm', 'sheets', 'ai']);

const INDUSTRIES = [
  { id: 'realestate', label: 'Real estate' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'retail', label: 'Retail / e-com' },
  { id: 'services', label: 'Agency / services' },
] as const;
type IndustryId = (typeof INDUSTRIES)[number]['id'];

interface Line { t: string; text: string; via: string }

const SCRIPTS: Record<IndustryId, Line[]> = {
  realestate: [
    { t: '23:41', text: 'New enquiry — 2-bed, Dubai Marina', via: 'chat' },
    { t: '23:41', text: 'Replied in 6 seconds. Budget qualified', via: 'ai' },
    { t: '23:42', text: 'Viewing booked — Saturday 11:00', via: 'bookings' },
    { t: '23:42', text: 'Lead created, source tagged', via: 'crm' },
    { t: '23:42', text: 'Owner dashboard updated', via: 'sheets' },
    { t: '07:30', text: 'One summary on your phone. You slept.', via: 'system' },
  ],
  clinic: [
    { t: '22:18', text: 'Patient asks to move an appointment', via: 'chat' },
    { t: '22:18', text: 'Answered. Insurance verified', via: 'ai' },
    { t: '22:19', text: 'Rebooked + reminder scheduled', via: 'bookings' },
    { t: '22:19', text: 'Record updated, no-show risk flagged', via: 'crm' },
    { t: '22:19', text: "Front desk's day list rebuilt", via: 'sheets' },
    { t: '07:30', text: 'One summary. Zero calls missed.', via: 'system' },
  ],
  retail: [
    { t: '21:03', text: 'Order #1042 — cash on delivery, Deira', via: 'website' },
    { t: '21:03', text: 'Stock checked, payment link sent', via: 'ai' },
    { t: '21:04', text: 'Courier booked, label printed', via: 'automation' },
    { t: '21:04', text: 'Invoice issued and filed', via: 'invoicing' },
    { t: '21:04', text: 'Inventory + sales sheet updated', via: 'sheets' },
    { t: '07:30', text: 'One summary. Nothing touched by hand.', via: 'system' },
  ],
  services: [
    { t: '19:47', text: 'Brief lands from a new client', via: 'email' },
    { t: '19:47', text: 'Proposal drafted from your templates', via: 'ai' },
    { t: '19:48', text: 'Follow-up scheduled for Thursday', via: 'automation' },
    { t: '19:48', text: 'Deal stage moved, value logged', via: 'crm' },
    { t: '19:48', text: 'Deposit invoice sent', via: 'invoicing' },
    { t: '07:30', text: 'One summary. The pipeline moved itself.', via: 'system' },
  ],
};

const VIA_FALLBACK: Record<string, string> = {
  chat: 'WHATSAPP', ai: 'AI AGENT', bookings: 'CALENDAR', crm: 'CRM',
  sheets: 'SHEETS', website: 'YOUR SITE', automation: 'AUTOMATION',
  invoicing: 'INVOICING', email: 'EMAIL', support: 'SUPPORT',
  storage: 'STORAGE', ads: 'ADS', system: 'YOUR SYSTEM',
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const dubaiNow = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());

const addMin = (hhmm: string, m: number) => {
  const [h, mi] = hhmm.split(':').map(Number);
  const t = (h * 60 + mi + m + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

type Step = 'build' | 'cost' | 'system';
type VideoState = 'idle' | 'recording' | 'done' | 'unsupported';

/* ————— component ————— */

export default function Demo() {
  const [tools, setTools] = useState<Tool[]>(
    PRESETS.map((p) => ({ ...p, selected: DEFAULT_ON.has(p.id) }))
  );
  const [industry, setIndustry] = useState<IndustryId>('realestate');
  const [step, setStep] = useState<Step>('build');
  const [paying, setPaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [company, setCompany] = useState('');
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [refCode] = useState(() => `CH-2026-D${String(Math.floor(Math.random() * 900) + 100)}`);
  const [liveTimes, setLiveTimes] = useState<string[] | null>(null);
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<Step | null>(null);
  const stageRef = useRef<DemoStage | null>(null);
  const burnRef = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reducedRef = useRef(false);
  const startRef = useRef(0);

  const selected = useMemo(() => tools.filter((t) => t.selected), [tools]);
  const monthly = useMemo(() => selected.reduce((s, t) => s + t.price, 0), [selected]);
  const script = SCRIPTS[industry];
  const runDone = held && lineCount >= script.length;

  const viaLabel = (cat: string) => {
    const match = selected.find((t) => t.cat === cat);
    return (match ? match.label : VIA_FALLBACK[cat] ?? cat).toUpperCase();
  };

  /* engine lifecycle */
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = new DemoStage(canvasRef.current!, reducedRef.current);
    stageRef.current = stage;
    startRef.current = performance.now();

    const io = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? stage.start() : stage.stop(); },
      { threshold: 0 }
    );
    io.observe(sectionRef.current!);
    const onResize = () => stage.resize();
    window.addEventListener('resize', onResize);
    // The stage box changes height between steps on mobile — track it.
    const ro = new ResizeObserver(() => {
      stage.resize();
      const b = canvasRef.current?.parentElement;
      if (b) setBoxSize({ w: b.clientWidth, h: b.clientHeight });
    });
    const box = canvasRef.current?.parentElement;
    if (box) {
      ro.observe(box);
      setBoxSize({ w: box.clientWidth, h: box.clientHeight });
    }

    // the grip test, on their own system
    let dragging = false;
    const pos = (e: PointerEvent) => {
      const r = box!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onDown = (e: PointerEvent) => {
      if (!box) return;
      const [x, y] = pos(e);
      if (stage.coreHit(x, y)) {
        dragging = true;
        stage.beginCoreDrag();
        box.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const [x, y] = pos(e);
      stage.coreDragTo(x, y);
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      stage.endCoreDrag();
      try { box?.releasePointerCapture(e.pointerId); } catch { /* released */ }
    };
    box?.addEventListener('pointerdown', onDown);
    box?.addEventListener('pointermove', onMove);
    box?.addEventListener('pointerup', onUp);
    box?.addEventListener('pointercancel', onUp);

    return () => {
      io.disconnect();
      ro.disconnect();
      stage.destroy();
      window.removeEventListener('resize', onResize);
      box?.removeEventListener('pointerdown', onDown);
      box?.removeEventListener('pointermove', onMove);
      box?.removeEventListener('pointerup', onUp);
      box?.removeEventListener('pointercancel', onUp);
    };
  }, []);

  /* keep the stage in sync with the chosen stack (before convergence) */
  useEffect(() => {
    if (step !== 'system') {
      stageRef.current?.setTools(selected.map(({ label, price }): DemoTool => ({ label, price })));
    }
  }, [selected, step]);

  /* keep the stage on screen when the step (and panel height) changes */
  useEffect(() => {
    if (prevStepRef.current === null) { prevStepRef.current = step; return; }
    if (prevStepRef.current === step) return;
    prevStepRef.current = step;
    gridRef.current?.scrollIntoView({
      behavior: reducedRef.current ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [step]);

  /* the burn counter: their money, ticking, from their own numbers */
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (!burnRef.current) return;
      const secs = (performance.now() - startRef.current) / 1000;
      const rate = (monthly * 12) / 365 / 86400;
      burnRef.current.textContent = (secs * rate).toFixed(4);
    }, reducedRef.current ? 1000 : 200);
    return () => window.clearInterval(iv);
  }, [monthly]);

  /* scenario reveal after the system is held — at the actual Dubai time */
  useEffect(() => {
    if (!held) return;
    const t0 = dubaiNow();
    const t1 = addMin(t0, 1);
    setLiveTimes([t0, t0, t1, t1, t1]);
    if (reducedRef.current) { setLineCount(script.length); return; }
    setLineCount(0);
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      setLineCount(i);
      if (i >= script.length) window.clearInterval(iv);
    }, 850);
    return () => window.clearInterval(iv);
  }, [held, script.length]);

  /* blueprint once the run finishes */
  useEffect(() => {
    if (!runDone) return;
    let alive = true;
    generateBlueprint({
      company,
      industry: INDUSTRIES.find((i) => i.id === industry)?.label ?? '',
      tools: selected.map(({ label, price }) => ({ label, price })),
      monthly,
      ref: refCode,
    }).then((url) => { if (alive) setBlueprint(url); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDone, company]);

  /* actions */
  const toggleTool = (id: string) =>
    setTools((ts) => ts.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  const setPrice = (id: string, d: number) =>
    setTools((ts) => ts.map((t) => (t.id === id ? { ...t, price: Math.min(5000, Math.max(0, t.price + d)) } : t)));
  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    const id = `custom-${label.toLowerCase().replace(/\W+/g, '-')}`;
    setTools((ts) =>
      ts.some((t) => t.id === id)
        ? ts
        : [...ts, { id, label, cat: 'custom', price: 50, selected: true }]
    );
    setCustom('');
  };
  const togglePaying = () => {
    const next = !paying;
    setPaying(next);
    stageRef.current?.setPowered(next);
  };
  const buildSystem = () => {
    setStep('system');
    setHeld(false);
    setLineCount(0);
    setBlueprint(null);
    stageRef.current?.playConverge(() => setHeld(true));
  };
  const startOver = () => {
    setStep('build');
    setPaying(true);
    setHeld(false);
    setLineCount(0);
    setBlueprint(null);
    stageRef.current?.reset();
    stageRef.current?.setPowered(true);
    stageRef.current?.setTools(selected.map(({ label, price }) => ({ label, price })));
  };
  const sendToAudit = () => {
    const stackText =
      `Our stack today: ${selected.map((t) => `${t.label} (AED ${t.price}/mo)`).join(', ')}. ` +
      `Total ≈ AED ${fmt(monthly)}/month. Industry: ${INDUSTRIES.find((i) => i.id === industry)?.label}. ` +
      `Demo blueprint ref: ${refCode}.`;
    window.dispatchEvent(
      new CustomEvent('corehold:prefill', { detail: { stack: stackText, company } })
    );
    document.getElementById('audit')?.scrollIntoView({
      behavior: reducedRef.current ? 'auto' : 'smooth',
    });
  };

  /* the website hands you a video: re-run the convergence, recorded */
  const recordVideo = () => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || videoState === 'recording' || reducedRef.current) return;
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t));
    if (!mime) { setVideoState('unsupported'); return; }

    setVideoState('recording');
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    stage.setWatermark([
      (company || 'YOUR BUSINESS').toUpperCase().slice(0, 30),
      'SCATTERED → CONNECTED → HELD',
    ]);
    stage.reset();
    stage.setTools(selected.map(({ label, price }) => ({ label, price })));
    stage.start();

    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      stage.setWatermark(null);
      const blob = new Blob(chunks, { type: mime });
      setVideoUrl(URL.createObjectURL(blob));
      setVideoState('done');
    };
    rec.start();
    // one breath of scatter, the convergence, then a held beat
    window.setTimeout(() => stage.playConverge(() => undefined), 900);
    window.setTimeout(() => { try { rec.stop(); } catch { /* stopped */ } }, 900 + 4600 + 2000);
  };

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const statusLine =
    videoState === 'recording'
      ? 'RECORDING YOUR SYSTEM FILM — HOLD ON…'
      : step === 'system'
      ? held
        ? runDone
          ? 'HELD — SYSTEM RUNNING · TRY DRAGGING THE CORE'
          : 'HELD — RUNNING YOUR NIGHT SHIFT'
        : 'CONNECTING YOUR STACK…'
      : paying
        ? `${selected.length} TOOLS · SCATTERED · RENTED`
        : 'PAYMENT STOPPED — YOUR STACK IS DARK';

  return (
    <section id="demo" aria-labelledby="demo-heading" className="hairline-t" ref={sectionRef}>
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono-label mono-label--ember mb-5" data-hold>
          The demo — bring your own business
        </p>
        <h2 id="demo-heading" className="display-lg max-w-3xl lockin" data-hold>
          Watch your business <span className="text-ember">become a system.</span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-bone-dim lockin" data-hold>
          Pick what you run on today. See what it costs. Then watch us connect
          it — live, right here.
        </p>

        <div ref={gridRef} className="lockin mt-14 scroll-mt-24 grid gap-6 lg:grid-cols-[1.05fr_1fr]" data-hold>
          {/* ————— stage ————— */}
          <div className="held is-held relative">
            <div
              className={`relative overflow-hidden border border-line bg-ink-900/40 sm:h-[500px] ${
                step === 'system' ? 'h-[560px]' : 'h-[380px]'
              }`}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

              {/* touch handle for the grip test: sits exactly on the held core */}
              {step === 'system' && held && boxSize && (() => {
                const M = Math.min(Math.min(boxSize.w, boxSize.h) * 0.52, 340);
                const half = (232 / 674) * M * 0.5 + 14;
                const cy = boxSize.h < 430 || boxSize.w < 640 ? boxSize.h * 0.36 : boxSize.h / 2;
                return (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: boxSize.w / 2 - half,
                      top: cy - half,
                      width: half * 2,
                      height: half * 2,
                      touchAction: 'none',
                      cursor: 'grab',
                    }}
                  />
                );
              })()}

              {/* night-shift log */}
              {step === 'system' && held && videoState !== 'recording' && (
                <div
                  role="log"
                  aria-live="polite"
                  className="absolute inset-x-0 bottom-0 border-t border-line bg-ink/85 px-4 py-3 backdrop-blur-sm sm:px-5"
                >
                  {script.slice(0, lineCount).map((line, i) => (
                    <p
                      key={i}
                      className={`log-line font-mono text-[0.68rem] leading-[1.7] tracking-[0.06em] ${
                        i === script.length - 1 ? 'text-ember-soft' : 'text-bone-dim'
                      }`}
                    >
                      <span className="text-mute">{i < 5 && liveTimes ? liveTimes[i] : line.t}</span>{' '}
                      {line.text}{' '}
                      <span className="text-ember">[{viaLabel(line.via)}]</span>
                    </p>
                  ))}
                  {runDone && (
                    <p className="log-line font-mono text-[0.68rem] leading-[1.9] tracking-[0.1em] text-ember">
                      SYSTEM IDLE — 0 SUBSCRIPTIONS BILLED ✓
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="mono-label mt-3" aria-live="polite">
              <span className="text-ember" aria-hidden="true">▪ </span>
              {statusLine}
            </p>
          </div>

          {/* ————— controls ————— */}
          <div className="border border-line bg-ink-900/40 p-5 sm:p-7">
            {/* stepper */}
            <div className="mb-7 flex items-center gap-4" aria-hidden="true">
              {(['build', 'cost', 'system'] as Step[]).map((s, i) => (
                <span
                  key={s}
                  className={`mono-label ${step === s ? 'text-ember' : ''}`}
                >
                  {String(i + 1).padStart(2, '0')} {s === 'build' ? 'Stack' : s === 'cost' ? 'Rent' : 'System'}
                </span>
              ))}
            </div>

            {step === 'build' && (
              <div>
                <p className="mono-label mb-3">Your business</p>
                <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Business type">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      aria-pressed={industry === ind.id}
                      onClick={() => setIndustry(ind.id)}
                      className="tool-chip font-mono text-[0.7rem] tracking-[0.1em] uppercase"
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>

                <p className="mono-label mb-3">What do you run on today? Tap it.</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Your current tools">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      aria-pressed={tool.selected}
                      onClick={() => toggleTool(tool.id)}
                      className="tool-chip text-left"
                    >
                      <span className="block font-mono text-[0.7rem] tracking-[0.06em] uppercase">
                        {tool.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.6rem] text-mute">
                        ~AED {tool.price}/mo
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
                    placeholder="Something else? Type it"
                    aria-label="Add another tool"
                    className="min-w-0 flex-1 border border-line bg-transparent px-3 py-2.5 font-mono text-[0.75rem] text-bone placeholder:text-mute focus:border-line-strong focus:outline-none"
                  />
                  <button type="button" onClick={addCustom} className="btn-ghost !px-4 !py-2.5">
                    Add
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-core mt-7 w-full justify-center"
                  disabled={selected.length === 0}
                  onClick={() => setStep('cost')}
                >
                  See what this costs you <span aria-hidden="true">↘</span>
                </button>
              </div>
            )}

            {step === 'cost' && (
              <div>
                <p className="mono-label mb-3">Your estimates — adjust them</p>
                <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {selected.map((tool) => (
                    <li key={tool.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2">
                      <span className="min-w-0 truncate font-mono text-[0.7rem] tracking-[0.06em] text-bone uppercase">
                        {tool.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => setPrice(tool.id, -25)}
                          aria-label={`Lower ${tool.label} cost`}
                          className="grid h-7 w-7 place-items-center border border-line text-bone-dim hover:border-ember hover:text-ember">−</button>
                        <span className="w-24 text-center font-mono text-[0.7rem] text-bone">
                          AED {tool.price}<span className="text-mute">/mo</span>
                        </span>
                        <button type="button" onClick={() => setPrice(tool.id, 25)}
                          aria-label={`Raise ${tool.label} cost`}
                          className="grid h-7 w-7 place-items-center border border-line text-bone-dim hover:border-ember hover:text-ember">+</button>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid grid-cols-3 gap-px border border-line bg-line">
                  {([
                    ['/ month', monthly],
                    ['/ year', monthly * 12],
                    ['/ 5 years', monthly * 60],
                  ] as const).map(([label, val]) => (
                    <div key={label} className="bg-ink px-3 py-4 text-center">
                      <p className="font-mono text-[1.05rem] font-medium text-ember sm:text-[1.3rem]">
                        {fmt(val)}
                      </p>
                      <p className="mono-label mt-1">AED {label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-mute">
                  BURNED WHILE YOU&apos;VE BEEN ON THIS PAGE: AED{' '}
                  <span className="text-ember-soft" ref={burnRef}>0.0000</span>
                </p>

                <div className="mt-7 flex items-center justify-between gap-4 border border-line px-4 py-4">
                  <span className="mono-label">Now flip it:</span>
                  <div className="flex items-center gap-3">
                    <span className={`mono-label ${paying ? 'text-bone' : ''}`} aria-hidden="true">Paying</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={paying}
                      aria-label="Simulation: keep paying for your stack"
                      className="hold-switch"
                      onClick={togglePaying}
                    >
                      <span className="thumb" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                          className={paying ? 'text-ink' : 'text-mute'}>
                          <path d="M12 3v8" strokeLinecap="square" />
                          <path d="M6.3 7a8 8 0 1 0 11.4 0" strokeLinecap="square" />
                        </svg>
                      </span>
                    </button>
                    <span className={`mono-label ${!paying ? 'text-ember' : ''}`} aria-hidden="true">Stopped</span>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] uppercase" aria-live="polite">
                  {paying
                    ? <span className="text-bone-dim">That&apos;s your stack while the invoices clear.</span>
                    : <span className="text-ember">That&apos;s your business the month you stop. Now watch the fix —</span>}
                </p>

                <button type="button" className="btn-core mt-6 w-full justify-center" onClick={buildSystem}>
                  Build my system <span aria-hidden="true">↘</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('build'); setPaying(true); stageRef.current?.setPowered(true); }}
                  className="mono-label mt-4 block transition-colors hover:text-bone"
                >
                  ← Edit the stack
                </button>
              </div>
            )}

            {step === 'system' && (
              <div>
                {!runDone ? (
                  <div>
                    <p className="text-lg leading-relaxed text-bone">
                      {held
                        ? 'Connected. Now it works a night shift for you —'
                        : 'Watch the stage: your tools are being wired into one core.'}
                    </p>
                    <p className="mono-label mt-4">
                      {held ? 'Live run — your industry, your tools' : 'No subscriptions survive this'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="mono-label mb-3 mono-label--ember">Keep it — it&apos;s yours</p>
                    <p className="text-base leading-relaxed text-bone">
                      That system now exists as a drawing. Put your name on it
                      and take it with you.
                    </p>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your company name (optional)"
                      aria-label="Company name for the blueprint"
                      className="mt-5 w-full border border-line bg-transparent px-3 py-2.5 font-mono text-[0.78rem] text-bone placeholder:text-mute focus:border-line-strong focus:outline-none"
                    />
                    {blueprint && (
                      <a
                        href={blueprint}
                        download={`corehold-blueprint-${refCode}.png`}
                        className="mt-4 block border border-line transition-colors hover:border-ember"
                        aria-label="Download your system blueprint as an image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={blueprint} alt={`System blueprint for ${company || 'your business'}: your tools connected into one owned core, reference ${refCode}`} className="block w-full" />
                      </a>
                    )}
                    <div className="mt-5 flex flex-col gap-3">
                      <a
                        href={blueprint ?? '#'}
                        download={`corehold-blueprint-${refCode}.png`}
                        className={`btn-core justify-center ${blueprint ? '' : 'pointer-events-none opacity-50'}`}
                      >
                        Download the blueprint <span aria-hidden="true">↓</span>
                      </a>
                      <button type="button" className="btn-ghost justify-center" onClick={sendToAudit}>
                        Send it with my audit request →
                      </button>
                      {videoState !== 'unsupported' && !reducedRef.current && (
                        videoUrl ? (
                          <a
                            href={videoUrl}
                            download={`corehold-system-${refCode}.webm`}
                            className="btn-ghost justify-center border-ember-deep text-ember-soft"
                          >
                            Download your system film ↓
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn-ghost justify-center"
                            onClick={recordVideo}
                            disabled={videoState === 'recording'}
                          >
                            {videoState === 'recording' ? 'Filming — watch the stage…' : 'Get it as a video ▸'}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={startOver}
                        className="mono-label mt-1 text-left transition-colors hover:text-bone"
                      >
                        ← Start over
                      </button>
                    </div>
                    <p className="mono-label mt-5">
                      Ref {refCode} · drawn from your inputs · not a quote
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
