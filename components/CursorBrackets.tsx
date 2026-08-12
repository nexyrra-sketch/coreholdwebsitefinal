'use client';

import { useEffect, useRef } from 'react';

/**
 * The cursor is the core; the brackets never stop holding it.
 *
 * Two corner brackets (top-left / bottom-right — the logo's exact
 * diagonal) trail the pointer on a spring. Over anything interactive
 * they expand and lock onto the element's bounding box. On press,
 * the core square appears at the pointer.
 */
const INTERACTIVE = 'a, button, [role="switch"], [data-cursor], summary';
const TEXT_FIELDS = 'input, textarea, select';

export default function CursorBrackets() {
  const tlRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const tl = tlRef.current!, br = brRef.current!, core = coreRef.current!;
    let px = -100, py = -100;
    let target: Element | null = null;
    let overText = false;
    let down = false;
    let visible = false;
    let raf = 0;

    // sprung rect: centre + half-extents
    const s = { x: -100, y: -100, hw: 15, hh: 15 };

    document.body.classList.add('cursor-held');

    const onMove = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      if (!visible) {
        visible = true;
        tl.style.opacity = br.style.opacity = core.style.opacity = '1';
      }
    };
    const onOver = (e: Event) => {
      const el = (e.target as Element).closest?.(INTERACTIVE) ?? null;
      const txt = (e.target as Element).closest?.(TEXT_FIELDS) ?? null;
      overText = !!txt && !el;
      target = el;
    };
    const onDown = () => { down = true; };
    const onUp = () => { down = false; };
    const onLeave = () => {
      visible = false;
      tl.style.opacity = br.style.opacity = core.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, true);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);

    const loop = () => {
      let tx = px, ty = py, thw = 15, thh = 15;
      let k = 0.22;
      if (target && target.isConnected) {
        const r = (target as HTMLElement).getBoundingClientRect();
        if (r.width > 0) {
          tx = r.left + r.width / 2;
          ty = r.top + r.height / 2;
          thw = r.width / 2 + 7;
          thh = r.height / 2 + 7;
          k = 0.3;
        }
      } else if (target) {
        target = null;
      }
      if (down) { thw *= 0.86; thh *= 0.86; }

      s.x += (tx - s.x) * k;
      s.y += (ty - s.y) * k;
      s.hw += (thw - s.hw) * k;
      s.hh += (thh - s.hh) * k;

      const hidden = overText || !visible;
      const op = hidden ? '0' : '1';
      tl.style.opacity = op; br.style.opacity = op;
      core.style.opacity = hidden ? '0' : down || target ? '1' : '0.6';

      tl.style.transform = `translate3d(${s.x - s.hw}px, ${s.y - s.hh}px, 0)`;
      br.style.transform = `translate3d(${s.x + s.hw - 10}px, ${s.y + s.hh - 10}px, 0)`;
      const cs = down ? 8 : 4;
      core.style.transform = `translate3d(${px - cs / 2}px, ${py - cs / 2}px, 0)`;
      core.style.width = core.style.height = `${cs}px`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove('cursor-held');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver, true);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const corner: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 10,
    height: 10,
    pointerEvents: 'none',
    zIndex: 9999,
    opacity: 0,
    willChange: 'transform',
  };

  return (
    <div aria-hidden="true">
      <div
        ref={tlRef}
        style={{ ...corner, borderTop: '2px solid #d9632b', borderLeft: '2px solid #d9632b' }}
      />
      <div
        ref={brRef}
        style={{ ...corner, borderBottom: '2px solid #d9632b', borderRight: '2px solid #d9632b' }}
      />
      <div
        ref={coreRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 4, height: 4,
          background: '#d9632b', pointerEvents: 'none', zIndex: 9999,
          opacity: 0, willChange: 'transform',
        }}
      />
    </div>
  );
}
