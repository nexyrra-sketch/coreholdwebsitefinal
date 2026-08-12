/**
 * COREHOLD — Demo stage engine.
 *
 * The visitor's own stack, live on canvas. Three modes:
 *
 *   scatter   — their chosen tools drift, badly tethered (with a
 *               powered-off state: the stack dies chip by chip)
 *   converge  — a time-driven replay of the signature convergence,
 *               performed on THEIR tools
 *   held      — the mark, gripped and beating
 *
 * Self-contained on purpose: the hero engine (convergence.ts) is
 * untouched. Same visual language, different driver (time, not scroll).
 */

export interface DemoTool { label: string; price: number }

const EMBER = '#d9632b';
const BONE = '#ede7dc';
const BONE_DIM = '#a9a294';
const MUTE = '#776f61';
const LINE = '#33302a';

const U = 674;
const CORE = { s: 232 };
const ARM = 313;
const THICK = 70;
const TL_PATH: [number, number][] = [[ARM, THICK / 2], [THICK / 2, THICK / 2], [THICK / 2, ARM + 2]];
const BR_PATH: [number, number][] = [[U - ARM, U - THICK / 2], [U - THICK / 2, U - THICK / 2], [U - THICK / 2, U - ARM - 2]];

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

interface DNode {
  label: string;
  sx: number; sy: number;
  rx: number; ry: number;
  stag: number;
  phase: number;
  spoke: boolean;
  x: number; y: number;
  a: number; c: number;
}

type Mode = 'scatter' | 'converge' | 'held';

export class DemoStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private reduced: boolean;

  private w = 0; private h = 0; private dpr = 1;
  private nodes: DNode[] = [];
  private tangle: [number, number][] = [];
  private mode: Mode = 'scatter';
  private convergeStart = 0;
  private convergeDur = 4600;
  private powered = true;
  private powerAt = 0;
  private snapAt = -1;
  private heldAt = 0;
  private onHeld: (() => void) | null = null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private watermark: string[] | null = null;

  // grip test
  private dragOn = false;
  private dragTX = 0; private dragTY = 0;
  private dragX = 0; private dragY = 0;
  private dragVX = 0; private dragVY = 0;

  constructor(canvas: HTMLCanvasElement, reduced: boolean) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.reduced = reduced;
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
    if (!this.running) this.frame(performance.now());
  }

  setTools(tools: DemoTool[]) {
    const labels = tools.map((t) => t.label.toUpperCase().slice(0, 18));
    this.buildNodes(labels);
    if (this.mode !== 'scatter') { this.mode = 'scatter'; this.snapAt = -1; }
    if (!this.running) this.frame(performance.now());
  }

  setPowered(on: boolean) {
    if (this.powered === on) return;
    this.powered = on;
    this.powerAt = performance.now();
  }

  reset() {
    this.mode = 'scatter';
    this.powered = true;
    this.snapAt = -1;
  }

  setWatermark(lines: string[] | null) { this.watermark = lines; }

  private center(): [number, number] {
    return [this.w / 2, this.h < 430 || this.w < 640 ? this.h * 0.36 : this.h / 2];
  }

  coreHit(x: number, y: number): boolean {
    if (this.mode !== 'held' || this.reduced) return false;
    const [cx, cy] = this.center();
    const M = Math.min(Math.min(this.w, this.h) * 0.52, 340);
    const half = (CORE.s / U) * M * 0.5 + 14;
    return Math.abs(x - cx) < half && Math.abs(y - cy) < half;
  }
  beginCoreDrag() { this.dragOn = true; }
  coreDragTo(x: number, y: number) {
    if (!this.dragOn) return;
    const [cx, cy] = this.center();
    const dx = x - cx, dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const give = Math.min(len * 0.45, 56);
    this.dragTX = (dx / len) * give;
    this.dragTY = (dy / len) * give;
  }
  endCoreDrag() {
    this.dragOn = false;
    this.dragTX = 0; this.dragTY = 0;
    if (Math.hypot(this.dragX, this.dragY) > 24) this.snapAt = performance.now();
  }

  playConverge(onHeld: () => void) {
    if (this.mode !== 'scatter') return;
    this.onHeld = onHeld;
    if (this.reduced) {
      this.mode = 'held';
      this.heldAt = performance.now();
      onHeld();
      return;
    }
    this.mode = 'converge';
    this.powered = true;
    this.convergeStart = performance.now();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (t: number) => {
      if (!this.running) return;
      this.frame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); }

  /* ————— layout ————— */

  private buildNodes(labels: string[]) {
    const rng = mulberry32(474747 + labels.length * 7);
    const { w, h } = this;
    const cx = w / 2, cy = h < 430 || w < 640 ? h * 0.36 : h / 2;
    const R = Math.min(w, h) * 0.335;
    const n = Math.max(labels.length, 1);

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
      const sx = lerp(w * 0.1, w * 0.9, rng());
      const sy = lerp(h * 0.1, h * 0.88, rng());
      const u = (i / n + 0.02 * (rng() - 0.5) + 1) % 1;
      const [rx, ry] = ringPoint(u);
      const nearCornerX = Math.abs(Math.abs(rx - cx) - R) < R * 0.24;
      const nearCornerY = Math.abs(Math.abs(ry - cy) - R) < R * 0.24;
      return {
        label, sx, sy, rx, ry,
        stag: rng(), phase: rng() * Math.PI * 2,
        spoke: !(nearCornerX && nearCornerY),
        x: sx, y: sy, a: 0, c: 0,
      };
    });

    this.tangle = [];
    for (let i = 0; i < Math.floor(n * 0.8); i++) {
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * n);
      if (b === a) b = (b + 1) % n;
      this.tangle.push([a, b]);
    }
  }

  private layout() {
    if (this.nodes.length) this.buildNodes(this.nodes.map((n) => n.label));
  }

  /* ————— frame ————— */

  private frame(now: number) {
    const { ctx, w, h, dpr } = this;
    const t = (now - this.t0) / 1000;
    const cx = w / 2, cy = h < 430 || w < 640 ? h * 0.36 : h / 2;
    const M = Math.min(Math.min(w, h) * 0.52, 340);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    let p = 0;
    if (this.mode === 'converge') {
      const raw = (now - this.convergeStart) / this.convergeDur;
      if (raw >= 1) {
        this.mode = 'held';
        this.heldAt = now;
        this.snapAt = now;
        this.onHeld?.();
      }
      p = ease(clamp01(raw));
    } else if (this.mode === 'held') {
      p = 1;
    }

    // power dim (scatter only): the stack dying, chip by chip
    const sincePower = (now - this.powerAt) / 1000;

    const pArr = win(p, 0.02, 0.42);
    const pRingDraw = win(p, 0.38, 0.56);
    const pSpoke = win(p, 0.48, 0.64);
    const pCollapse = win(p, 0.64, 0.84);
    const pGrip = win(p, 0.85, 0.96);
    const R = Math.min(w, h) * 0.335;

    for (const nd of this.nodes) {
      const a = ease(win(pArr, nd.stag * 0.45, nd.stag * 0.45 + 0.55));
      const c = ease(win(pCollapse, nd.stag * 0.25, nd.stag * 0.25 + 0.75));
      const drift = (1 - a) * 7;
      let x = lerp(nd.sx, nd.rx, a) + Math.sin(t * 0.6 + nd.phase) * drift;
      let y = lerp(nd.sy, nd.ry, a) + Math.cos(t * 0.47 + nd.phase * 1.7) * drift;
      if (c > 0) {
        const coreHalf = (CORE.s / U) * M * 0.5;
        const tx = cx + Math.sign(nd.rx - cx) * Math.min(Math.abs(nd.rx - cx), coreHalf);
        const ty = cy + Math.sign(nd.ry - cy) * Math.min(Math.abs(nd.ry - cy), coreHalf);
        x = lerp(x, tx, c); y = lerp(y, ty, c);
      }
      nd.x = x; nd.y = y; nd.a = a; nd.c = c;
    }

    // tangle
    const tangleAlpha = (1 - win(p, 0.25, 0.5)) * 0.5;
    if (tangleAlpha > 0.01) {
      ctx.lineWidth = 1;
      for (let i = 0; i < this.tangle.length; i++) {
        const [ai, bi] = this.tangle[i];
        const A = this.nodes[ai], B = this.nodes[bi];
        if (!A || !B) continue;
        const dim = this.nodeDim(ai, sincePower, now);
        const flick = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.9);
        const al = tangleAlpha * (0.1 + 0.15 * flick) * (1 - Math.max(A.a, B.a)) * dim;
        if (al < 0.008) continue;
        const mx = (A.x + B.x) / 2 + Math.sin(t * 0.5 + i) * 26;
        const my = (A.y + B.y) / 2 + Math.cos(t * 0.4 + i * 1.3) * 26;
        ctx.strokeStyle = `rgba(169,162,148,${al.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(mx, my, B.x, B.y);
        ctx.stroke();
      }
    }

    // ring
    const ringR = lerp(R, (CORE.s / U) * M * 0.5, ease(pCollapse));
    const ringAlpha = pRingDraw * (1 - win(pCollapse, 0.75, 1));
    if (ringAlpha > 0.01) {
      const per = 8 * ringR;
      ctx.strokeStyle = `rgba(217,99,43,${(0.85 * ringAlpha).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(217,99,43,0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      this.traceSquare(cx, cy, ringR, per * ease(pRingDraw));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // spokes
    if (pSpoke > 0 && pCollapse < 1) {
      const coreHalf = (CORE.s / U) * M * 0.5;
      ctx.lineWidth = 1;
      for (const nd of this.nodes) {
        if (!nd.spoke || nd.a < 1) continue;
        const dirx = cx - nd.rx, diry = cy - nd.ry;
        const len = Math.hypot(dirx, diry) || 1;
        const q = ease(win(pSpoke, nd.stag * 0.3, nd.stag * 0.3 + 0.7));
        const al = q * (1 - pCollapse) * 0.55;
        if (al < 0.01) continue;
        ctx.strokeStyle = `rgba(240,124,62,${al.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(nd.x, nd.y);
        ctx.lineTo(
          lerp(nd.x, cx - (dirx / len) * coreHalf * 1.42, q),
          lerp(nd.y, cy - (diry / len) * coreHalf * 1.42, q)
        );
        ctx.stroke();
      }
    }

    // chips
    if (pCollapse < 1) {
      for (let i = 0; i < this.nodes.length; i++) {
        const nd = this.nodes[i];
        const dim = this.mode === 'scatter' ? this.nodeDim(i, sincePower, now) : 1;
        const alpha = (1 - nd.c) * lerp(0.16, 1, dim);
        if (alpha < 0.02) continue;
        this.drawChip(nd.x, nd.y, nd.label, nd.a >= 1, alpha, dim < 0.6);
      }
    }

    // core + grip
    const coreA = win(pCollapse, 0.25, 1);
    const gripA = ease(pGrip);
    if (this.mode === 'held' || coreA > 0) {
      let snapScale = 1;
      if (this.snapAt > 0) {
        const st = (now - this.snapAt) / 1000;
        if (st < 0.6) snapScale = 1 + 0.028 * Math.exp(-st * 9) * Math.cos(st * 26);
      }
      // held: slow heartbeat
      let beat = 0;
      if (this.mode === 'held') beat = 0.5 + 0.5 * Math.sin((now - this.heldAt) / 1000 * 1.6);

      // grip-test spring
      const spring = this.dragOn ? 0.3 : 0.14;
      const damp = this.dragOn ? 0.58 : 0.8;
      this.dragVX = (this.dragVX + (this.dragTX - this.dragX) * spring) * damp;
      this.dragVY = (this.dragVY + (this.dragTY - this.dragY) * spring) * damp;
      this.dragX += this.dragVX; this.dragY += this.dragVY;

      this.drawMark(cx, cy, M * snapScale, this.mode === 'held' ? 1 : coreA, this.mode === 'held' ? 1 : gripA, beat, this.dragX, this.dragY);

      if (this.snapAt > 0) {
        const st = (now - this.snapAt) / 1000;
        if (st < 0.7) {
          const q = st / 0.7;
          const rr = (M * 0.5) * (1 + q * 0.9);
          ctx.strokeStyle = `rgba(217,99,43,${(0.4 * (1 - q)).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - rr, cy - rr, rr * 2, rr * 2);
        }
      }
    }

    // watermark (used while recording the shareable video)
    if (this.watermark) {
      ctx.fillStyle = 'rgba(11,11,9,0.6)';
      ctx.fillRect(0, 0, w, 46);
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = BONE;
      ctx.fillText(this.watermark[0] ?? '', 14, 18);
      ctx.fillStyle = EMBER;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText(this.watermark[1] ?? '', 14, 34);
      ctx.textAlign = 'right';
      ctx.fillStyle = BONE_DIM;
      ctx.fillText('COREHOLD — DUBAI', w - 14, 26);
      ctx.textAlign = 'left';
    }
  }

  /** Per-node power dim: staggered flicker-out / relight. */
  private nodeDim(i: number, since: number, now: number) {
    if (this.mode !== 'scatter') return 1;
    const delay = i * 0.14;
    const q = clamp01((since - delay) / 0.55);
    if (this.powered) return q; // relight, staggered
    if (q <= 0) return 1;
    if (q >= 1) return 0;
    // flicker while dying
    const flick = Math.sin(now / 28 + i * 9) > -0.2 ? 1 : 0.15;
    return (1 - q) * flick;
  }

  private drawChip(x: number, y: number, label: string, live: boolean, alpha: number, dead = false) {
    const { ctx } = this;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'middle';
    const liw = ctx.measureText(label).width;
    const pad = 7, bh = 20;
    const bw = liw + pad * 2 + 10;
    const bx = x - bw / 2, by = y - bh / 2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(11,11,9,0.72)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = dead ? LINE : live ? 'rgba(217,99,43,0.9)' : LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = dead ? MUTE : live ? EMBER : MUTE;
    ctx.fillRect(bx + pad - 2, y - 1.5, 3, 3);
    ctx.fillStyle = dead ? MUTE : live ? BONE : BONE_DIM;
    ctx.fillText(label, bx + pad + 6, y + 0.5);
    ctx.globalAlpha = 1;
  }

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

  private drawMark(
    cx: number, cy: number, size: number, coreA: number, grip: number, beat: number,
    pullX = 0, pullY = 0
  ) {
    const { ctx } = this;
    const k = size / U;
    const ox = cx - (U / 2) * k;
    const oy = cy - (U / 2) * k;
    const P = (pt: [number, number], dx = 0, dy = 0): [number, number] =>
      [ox + (pt[0] + dx) * k, oy + (pt[1] + dy) * k];

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

    if (coreA > 0.01) {
      ctx.globalAlpha = coreA;
      ctx.fillStyle = EMBER;
      ctx.shadowColor = 'rgba(217,99,43,0.45)';
      ctx.shadowBlur = 18 + 16 * beat;
      const s = CORE.s * k * (0.7 + 0.3 * coreA);
      ctx.fillRect(cx + pullX - s / 2, cy + pullY - s / 2, s, s);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (grip > 0.01) {
      const off = 120 * (1 - grip);
      ctx.globalAlpha = grip;
      ctx.strokeStyle = EMBER;
      ctx.lineWidth = THICK * k;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      for (const path of [
        TL_PATH.map((pt) => P(pt, -off, -off)),
        BR_PATH.map((pt) => P(pt, off, off)),
      ]) {
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        ctx.lineTo(path[1][0], path[1][1]);
        ctx.lineTo(path[2][0], path[2][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}
