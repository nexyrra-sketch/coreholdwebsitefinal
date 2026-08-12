/**
 * COREHOLD — Convergence engine.
 *
 * The signature moment. A fully deterministic, scroll-scrubbed canvas
 * timeline in five movements:
 *
 *   I    SCATTERED  — rented tools drift, loosely and badly tethered
 *   II   CONVERGE   — nodes migrate onto a square ring, tangle dies
 *   III  CONNECT    — the ring closes, spokes reach the centre
 *   IV   RESOLVE    — everything collapses into one solid core
 *   V    HELD       — the two brackets grip the core: the logo itself,
 *                     which then docks into the navigation slot.
 *
 * Every frame is a pure function of (scrollProgress, time, pointer),
 * so scrubbing backwards is flawless and nothing ever desyncs.
 */

export interface ConvergenceCallbacks {
  onPhase?: (phase: number) => void;      // 0..3 for captions
  onProgress?: (pct: number) => void;     // 0..100 readout
  onDock?: (docked: boolean) => void;     // mark reached the nav slot
  onSnap?: () => void;                    // the grip closes
}

export interface NavTarget { x: number; y: number; size: number }

const EMBER = '#d9632b';
const EMBER_BRIGHT = '#f07c3e';
const EMBER_SOFT = '#f2a06b';
const BONE = '#ede7dc';
const BONE_DIM = '#a9a294';
const MUTE = '#776f61';
const LINE = '#33302a';

/** Logo geometry in a normalized 674-unit box (vectorized from the mark). */
const U = 674;
const CORE = { x: 221, y: 221, s: 232 };
const ARM = 313;
const THICK = 70;
// Bracket centerline polylines (stroke width = THICK reproduces the exact shapes)
const TL_PATH: [number, number][] = [[ARM, THICK / 2], [THICK / 2, THICK / 2], [THICK / 2, ARM + 2]];
const BR_PATH: [number, number][] = [[U - ARM, U - THICK / 2], [U - THICK / 2, U - THICK / 2], [U - THICK / 2, U - ARM - 2]];

const LABELS_DESKTOP = [
  'CRM', 'SHEETS', 'INVOICING', 'EMAIL', 'RENTED AI', 'CHAT WIDGET',
  'ADS', 'STORAGE', 'FORMS', 'PAYROLL', 'BOOKINGS', 'SUPPORT',
  'ANALYTICS', 'INVENTORY', 'DOCS', 'LEADS',
];
const LABELS_MOBILE = [
  'CRM', 'SHEETS', 'INVOICING', 'EMAIL', 'RENTED AI',
  'CHAT WIDGET', 'FORMS', 'SUPPORT', 'ANALYTICS', 'LEADS',
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

interface Node {
  label: string;
  sx: number; sy: number;        // scatter home
  rx: number; ry: number;        // ring target
  stag: number;                  // arrival stagger 0..1
  phase: number;                 // personal noise phase
  spoke: boolean;                // draws a spoke to the core
  x: number; y: number;          // resolved position this frame
  a: number;                     // arrival amount this frame
  c: number;                     // collapse amount this frame
}

export class ConvergenceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: ConvergenceCallbacks;
  private reduced: boolean;
  private mobile: boolean;

  private w = 0; private h = 0; private dpr = 1;
  private nodes: Node[] = [];
  private tangle: [number, number][] = [];
  private progress = 0;
  private px = -9999; private py = -9999; private pActive = false;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private navTarget: NavTarget | null = null;
  private dock = 0;
  private dockedFired = false;
  private snapFired = false;
  private snapAt = -1;
  private lastPhase = -1;
  private lastPct = -1;

  // grip test: the core can be pulled — the brackets pull it back
  private dragOn = false;
  private dragTX = 0; private dragTY = 0;   // target offset
  private dragX = 0; private dragY = 0;     // sprung offset
  private dragVX = 0; private dragVY = 0;

  constructor(canvas: HTMLCanvasElement, opts: { reduced: boolean; mobile: boolean }, cb: ConvergenceCallbacks = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.cb = cb;
    this.reduced = opts.reduced;
    this.mobile = opts.mobile;
    this.t0 = performance.now();
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = rect.width; this.h = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.layout();
    if (!this.running) this.drawFrame(performance.now());
  }

  private layout() {
    const rng = mulberry32(20260811);
    const labels = this.mobile ? LABELS_MOBILE : LABELS_DESKTOP;
    const n = labels.length;
    const { w, h } = this;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * (this.mobile ? 0.34 : 0.3);

    // Ring targets: evenly spaced along a square ring (clockwise from top-left)
    const ringPoint = (u: number): [number, number] => {
      const per = 8 * R;
      let s = (u * per) % per;
      if (s < 2 * R) return [cx - R + s, cy - R];
      s -= 2 * R;
      if (s < 2 * R) return [cx + R, cy - R + s];
      s -= 2 * R;
      if (s < 2 * R) return [cx + R - s, cy + R];
      s -= 2 * R;
      return [cx - R, cy + R - s];
    };

    this.nodes = labels.map((label, i) => {
      // Scatter: around the headline, never over it.
      let sx = 0, sy = 0;
      if (this.mobile) {
        // Narrow screens: scatter in thin bands above and below the content.
        const top = i % 2 === 0;
        sx = lerp(w * 0.12, w * 0.88, (i / (n - 1) + 0.3 * (rng() - 0.5) + 1) % 1);
        sy = top ? lerp(h * 0.095, h * 0.145, rng()) : lerp(h * 0.855, h * 0.92, rng());
      } else {
        for (let k = 0; k < 60; k++) {
          sx = lerp(w * 0.05, w * 0.95, rng());
          sy = lerp(h * 0.1, h * 0.92, rng());
          const inHeadline = Math.abs(sx - cx) < w * 0.365 && Math.abs(sy - cy) < h * 0.395;
          if (!inHeadline) break;
        }
      }
      const u = (i / n + 0.02 * (rng() - 0.5)) % 1;
      const [rx, ry] = ringPoint(u);
      // No spoke if the ring position sits in a corner region
      const nearCornerX = Math.abs(Math.abs(rx - cx) - R) < R * 0.24;
      const nearCornerY = Math.abs(Math.abs(ry - cy) - R) < R * 0.24;
      return {
        label, sx, sy, rx, ry,
        stag: rng(),
        phase: rng() * Math.PI * 2,
        spoke: !(nearCornerX && nearCornerY),
        x: sx, y: sy, a: 0, c: 0,
      };
    });

    // Bad tethering: a handful of arbitrary connections between rented tools
    this.tangle = [];
    const pairs = Math.floor(n * 0.9);
    for (let i = 0; i < pairs; i++) {
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * n);
      if (b === a) b = (b + 3) % n;
      this.tangle.push([a, b]);
    }
  }

  setProgress(p: number) { this.progress = clamp01(p); }

  /** Is (x, y) on the held core (drag is only offered while gripped, pre-dock)? */
  coreHit(x: number, y: number): boolean {
    if (this.reduced) return false;
    const p = this.progress;
    if (p < 0.945 || p > 0.994 || this.dock > 0.02) return false;
    const M = Math.min(Math.min(this.w, this.h) * 0.46, 430);
    const half = (CORE.s / U) * M * 0.5 + 14;
    return Math.abs(x - this.w / 2) < half && Math.abs(y - this.h / 2) < half;
  }

  beginCoreDrag() { this.dragOn = true; }
  coreDragTo(x: number, y: number) {
    if (!this.dragOn) return;
    const dx = x - this.w / 2, dy = y - this.h / 2;
    const len = Math.hypot(dx, dy) || 1;
    // the further you pull, the harder it resists
    const give = Math.min(len * 0.45, 64);
    this.dragTX = (dx / len) * give;
    this.dragTY = (dy / len) * give;
  }
  endCoreDrag() {
    this.dragOn = false;
    this.dragTX = 0; this.dragTY = 0;
    if (Math.hypot(this.dragX, this.dragY) > 26) this.snapAt = performance.now();
  }
  setPointer(x: number, y: number, active: boolean) { this.px = x; this.py = y; this.pActive = active; }
  setNavTarget(t: NavTarget | null) { this.navTarget = t; }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (t: number) => {
      if (!this.running) return;
      this.drawFrame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); }

  /* ————————————————— frame ————————————————— */

  private drawFrame(now: number) {
    const { ctx, w, h, dpr } = this;
    const t = (now - this.t0) / 1000;
    const p = this.reduced ? 1 : this.progress;
    const cx = w / 2, cy = h / 2;
    const M = Math.min(Math.min(w, h) * 0.46, 430);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Reduced motion: a still image of the resolved system — no choreography.
    if (this.reduced) {
      const R = Math.min(w, h) * (this.mobile ? 0.34 : 0.3);
      ctx.strokeStyle = 'rgba(217,99,43,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - R, cy - R, R * 2, R * 2);
      for (const nd of this.nodes) {
        if (nd.spoke) {
          const dirx = cx - nd.rx, diry = cy - nd.ry;
          const len = Math.hypot(dirx, diry) || 1;
          ctx.strokeStyle = 'rgba(217,99,43,0.14)';
          ctx.beginPath();
          ctx.moveTo(nd.rx, nd.ry);
          ctx.lineTo(cx - (dirx / len) * R * 0.42, cy - (diry / len) * R * 0.42);
          ctx.stroke();
        }
        // keep the headline readable: no chips over the centre content
        const overContent =
          Math.abs(nd.rx - cx) < w * (this.mobile ? 0.44 : 0.365) &&
          Math.abs(nd.ry - cy) < h * (this.mobile ? 0.42 : 0.345);
        if (!overContent) this.drawChip(nd.rx, nd.ry, nd.label, true, 0.8);
      }
      if (this.lastPhase !== 3) { this.lastPhase = 3; this.cb.onPhase?.(3); }
      if (this.lastPct !== 100) { this.lastPct = 100; this.cb.onProgress?.(100); }
      return;
    }

    // ——— timeline windows ———
    const pRing = win(p, 0.05, 0.5);        // scatter → ring
    const pRingDraw = win(p, 0.48, 0.64);   // ring outline closes
    const pSpoke = win(p, 0.56, 0.7);       // spokes reach in
    const pCollapse = win(p, 0.7, 0.87);    // everything → core
    const pGrip = win(p, 0.875, 0.94);      // brackets close; then the mark HOLDS
    const R = Math.min(w, h) * (this.mobile ? 0.34 : 0.3);

    // dock spring (the finished mark travels to the nav slot)
    const dockTarget = !this.reduced && this.navTarget && p > 0.996 ? 1 : 0;
    this.dock += (dockTarget - this.dock) * 0.14;
    if (this.dock > 0.92 && !this.dockedFired) { this.dockedFired = true; this.cb.onDock?.(true); }
    if (this.dock < 0.5 && this.dockedFired) { this.dockedFired = false; this.cb.onDock?.(false); }

    // snap event when the grip completes
    if (!this.reduced) {
      if (pGrip >= 1 && !this.snapFired) { this.snapFired = true; this.snapAt = now; this.cb.onSnap?.(); }
      if (pGrip < 0.9 && this.snapFired) this.snapFired = false;
    }

    // ——— nodes: resolve positions (pure function of p, t, pointer) ———
    for (const nd of this.nodes) {
      const a = ease(win(pRing, nd.stag * 0.45, nd.stag * 0.45 + 0.55));
      const c = ease(win(pCollapse, nd.stag * 0.25, nd.stag * 0.25 + 0.75));
      const drift = (1 - a) * (this.mobile ? 6 : 9);
      let x = lerp(nd.sx, nd.rx, a) + Math.sin(t * 0.6 + nd.phase) * drift;
      let y = lerp(nd.sy, nd.ry, a) + Math.cos(t * 0.47 + nd.phase * 1.7) * drift;
      // cursor repulsion while still scattered
      if (this.pActive && a < 1) {
        const dx = x - this.px, dy = y - this.py;
        const d = Math.hypot(dx, dy);
        if (d < 200 && d > 0.01) {
          const f = (1 - d / 200) * 44 * (1 - a);
          x += (dx / d) * f; y += (dy / d) * f;
        }
      }
      // collapse: toward the nearest point on the core square edge, then in
      if (c > 0) {
        const coreHalf = (CORE.s / U) * M * 0.5;
        const tx = cx + Math.sign(nd.rx - cx) * Math.min(Math.abs(nd.rx - cx), coreHalf);
        const ty = cy + Math.sign(nd.ry - cy) * Math.min(Math.abs(nd.ry - cy), coreHalf);
        x = lerp(x, tx, c); y = lerp(y, ty, c);
      }
      nd.x = x; nd.y = y; nd.a = a; nd.c = c;
    }

    // ——— I. tangle (the mess) ———
    const tangleAlpha = (1 - win(p, 0.3, 0.55)) * 0.5;
    if (tangleAlpha > 0.01) {
      ctx.lineWidth = 1;
      for (let i = 0; i < this.tangle.length; i++) {
        const [ai, bi] = this.tangle[i];
        const A = this.nodes[ai], B = this.nodes[bi];
        const flick = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.9);
        const al = tangleAlpha * (0.1 + 0.16 * flick) * (1 - Math.max(A.a, B.a));
        if (al < 0.008) continue;
        const mx = (A.x + B.x) / 2 + Math.sin(t * 0.5 + i) * 36;
        const my = (A.y + B.y) / 2 + Math.cos(t * 0.4 + i * 1.3) * 36;
        ctx.strokeStyle = `rgba(169,162,148,${al.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(mx, my, B.x, B.y);
        ctx.stroke();
      }
    }

    // ——— III. the ring closes (a glowing square circuit) ———
    const ringShrink = pCollapse;
    const ringR = lerp(R, (CORE.s / U) * M * 0.5, ease(ringShrink));
    const ringAlpha = pRingDraw * (1 - win(pCollapse, 0.75, 1));
    if (ringAlpha > 0.01) {
      const per = 8 * ringR;
      const drawLen = per * ease(pRingDraw);
      ctx.strokeStyle = `rgba(217,99,43,${(0.85 * ringAlpha).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(217,99,43,0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      this.traceSquare(cx, cy, ringR, drawLen);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // spokes reaching inward
    if (pSpoke > 0 && pCollapse < 1) {
      const coreHalf = (CORE.s / U) * M * 0.5;
      ctx.lineWidth = 1;
      for (const nd of this.nodes) {
        if (!nd.spoke || nd.a < 1) continue;
        const dirx = cx - nd.rx, diry = cy - nd.ry;
        const len = Math.hypot(dirx, diry);
        const inx = cx - (dirx / len) * coreHalf * 1.42;
        const iny = cy - (diry / len) * coreHalf * 1.42;
        const q = ease(win(pSpoke, nd.stag * 0.3, nd.stag * 0.3 + 0.7));
        const al = q * (1 - pCollapse) * 0.55;
        if (al < 0.01) continue;
        ctx.strokeStyle = `rgba(240,124,62,${al.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(nd.x, nd.y);
        ctx.lineTo(lerp(nd.x, inx, q), lerp(nd.y, iny, q));
        ctx.stroke();
      }
    }

    // ——— node chips ———
    if (pCollapse < 1) {
      for (const nd of this.nodes) {
        const alpha = 1 - nd.c;
        if (alpha < 0.02) continue;
        this.drawChip(nd.x, nd.y, nd.label, nd.a >= 1, alpha);
      }
    }

    // ——— IV + V. the core, the grip, the dock ———
    const coreA = this.reduced ? 1 : win(pCollapse, 0.25, 1);
    const gripA = this.reduced ? 1 : ease(pGrip);
    if (coreA > 0 || this.reduced) {
      // snap: tiny damped overshoot when the grip lands
      let snapScale = 1;
      if (this.snapAt > 0 && !this.reduced) {
        const st = (now - this.snapAt) / 1000;
        if (st < 0.6) snapScale = 1 + 0.028 * Math.exp(-st * 9) * Math.cos(st * 26);
      }
      const d = ease(this.dock);
      let mcx = cx, mcy = cy, ms = M * snapScale;
      if (this.navTarget && d > 0.001) {
        mcx = lerp(cx, this.navTarget.x, d);
        mcy = lerp(cy, this.navTarget.y, d);
        ms = lerp(M * snapScale, this.navTarget.size, d);
      }
      // grip-test spring: pull resisted, release snaps back with a wobble
      const spring = this.dragOn ? 0.3 : 0.14;
      const damp = this.dragOn ? 0.58 : 0.8;
      this.dragVX = (this.dragVX + (this.dragTX - this.dragX) * spring) * damp;
      this.dragVY = (this.dragVY + (this.dragTY - this.dragY) * spring) * damp;
      this.dragX += this.dragVX; this.dragY += this.dragVY;

      const markAlpha = this.dockedFired ? 0 : 1;
      if (markAlpha > 0) this.drawMark(mcx, mcy, ms, coreA, gripA, markAlpha, this.dragX, this.dragY);

      // pulse ring on snap
      if (this.snapAt > 0 && !this.reduced) {
        const st = (now - this.snapAt) / 1000;
        if (st < 0.7 && this.dock < 0.05) {
          const q = st / 0.7;
          const rr = (M * 0.5) * (1 + q * 0.9);
          ctx.strokeStyle = `rgba(217,99,43,${(0.4 * (1 - q)).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - rr, cy - rr, rr * 2, rr * 2);
        }
      }
    }

    // callbacks (throttled to change)
    const phase = p < 0.44 ? 0 : p < 0.7 ? 1 : p < 0.875 ? 2 : 3;
    if (phase !== this.lastPhase) { this.lastPhase = phase; this.cb.onPhase?.(phase); }
    const pct = Math.round(p * 100);
    if (pct !== this.lastPct) { this.lastPct = pct; this.cb.onProgress?.(pct); }
  }

  private drawChip(x: number, y: number, label: string, live: boolean, alpha: number) {
    const { ctx } = this;
    ctx.font = `${this.mobile ? 9 : 10}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = 'middle';
    const liw = ctx.measureText(label).width;
    const pad = 7, bh = 20;
    const bw = liw + pad * 2 + 10;
    const bx = x - bw / 2, by = y - bh / 2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(11,11,9,0.72)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = live ? 'rgba(217,99,43,0.9)' : LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = live ? EMBER : MUTE;
    ctx.fillRect(bx + pad - 2, y - 1.5, 3, 3);
    ctx.fillStyle = live ? BONE : BONE_DIM;
    ctx.fillText(label, bx + pad + 6, y + 0.5);
    ctx.globalAlpha = 1;
  }

  /** Trace up to drawLen of a square ring's perimeter, clockwise from top-left. */
  private traceSquare(cx: number, cy: number, r: number, drawLen: number) {
    const { ctx } = this;
    const corners: [number, number][] = [
      [cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r],
    ];
    ctx.moveTo(corners[0][0], corners[0][1]);
    let remaining = drawLen;
    for (let i = 0; i < 4 && remaining > 0; i++) {
      const [x1, y1] = corners[i];
      const [x2, y2] = corners[(i + 1) % 4];
      const seg = Math.hypot(x2 - x1, y2 - y1);
      const take = Math.min(seg, remaining);
      ctx.lineTo(lerp(x1, x2, take / seg), lerp(y1, y2, take / seg));
      remaining -= take;
    }
  }

  /** Draw the exact logo mark. grip: 0 = brackets apart+invisible, 1 = locked. */
  private drawMark(
    cx: number, cy: number, size: number, coreA: number, grip: number, alpha: number,
    pullX = 0, pullY = 0
  ) {
    const { ctx } = this;
    const k = size / U;
    const ox = cx - (U / 2) * k;
    const oy = cy - (U / 2) * k;
    const P = (pt: [number, number], dx = 0, dy = 0): [number, number] =>
      [ox + (pt[0] + dx) * k, oy + (pt[1] + dy) * k];

    // tension: the brackets holding on while the core is pulled
    const pull = Math.hypot(pullX, pullY);
    if (pull > 3 && grip > 0.9) {
      const coreHalf = (CORE.s / U) * size * 0.5;
      const pairs: [[number, number], [number, number]][] = [
        [P([THICK / 2, THICK / 2]), [cx + pullX - coreHalf, cy + pullY - coreHalf]],
        [P([U - THICK / 2, U - THICK / 2]), [cx + pullX + coreHalf, cy + pullY + coreHalf]],
      ];
      ctx.strokeStyle = `rgba(240,124,62,${Math.min(0.7, 0.25 + pull / 90).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      for (const [a, b] of pairs) {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    }

    // core
    if (coreA > 0.01) {
      ctx.globalAlpha = alpha * coreA;
      ctx.fillStyle = EMBER;
      ctx.shadowColor = 'rgba(217,99,43,0.45)';
      ctx.shadowBlur = 26 * coreA;
      const s = CORE.s * k * (0.7 + 0.3 * coreA);
      ctx.fillRect(cx + pullX - s / 2, cy + pullY - s / 2, s, s);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // brackets slide in along the diagonal and grip
    if (grip > 0.01) {
      const off = 120 * (1 - grip);
      ctx.globalAlpha = alpha * grip;
      ctx.strokeStyle = EMBER;
      ctx.lineWidth = THICK * k;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      ctx.beginPath();
      const tl = TL_PATH.map((pt) => P(pt, -off, -off));
      ctx.moveTo(tl[0][0], tl[0][1]);
      ctx.lineTo(tl[1][0], tl[1][1]);
      ctx.lineTo(tl[2][0], tl[2][1]);
      ctx.stroke();
      ctx.beginPath();
      const br = BR_PATH.map((pt) => P(pt, off, off));
      ctx.moveTo(br[0][0], br[0][1]);
      ctx.lineTo(br[1][0], br[1][1]);
      ctx.lineTo(br[2][0], br[2][1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
