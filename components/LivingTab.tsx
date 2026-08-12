'use client';

import { useEffect } from 'react';

/**
 * The living tab. Leave, and the title quietly becomes
 * "[ still held ]" while the favicon's core keeps glowing.
 * The system doesn't stop when you look away.
 */
export default function LivingTab() {
  useEffect(() => {
    const original = document.title;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    const originalHref = link?.href ?? null;

    const drawFavicon = (glow: boolean) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0c0c0a';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#d9632b';
      const k = 64 / 1024;
      // brackets
      ctx.beginPath();
      ctx.moveTo(145 * k, 133 * k); ctx.lineTo(498 * k, 133 * k); ctx.lineTo(498 * k, 223 * k);
      ctx.lineTo(235 * k, 223 * k); ctx.lineTo(235 * k, 486 * k); ctx.lineTo(145 * k, 486 * k);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(879 * k, 891 * k); ctx.lineTo(526 * k, 891 * k); ctx.lineTo(526 * k, 801 * k);
      ctx.lineTo(789 * k, 801 * k); ctx.lineTo(789 * k, 538 * k); ctx.lineTo(879 * k, 538 * k);
      ctx.closePath(); ctx.fill();
      // core, glowing when away
      if (glow) {
        ctx.shadowColor = 'rgba(240,124,62,0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f07c3e';
      }
      const s = glow ? 285 : 260;
      ctx.fillRect((512 - s / 2) * k, (512 - s / 2) * k, s * k, s * k);
      return c.toDataURL('image/png');
    };

    let interval = 0;
    let frame = false;

    const onVisibility = () => {
      if (document.hidden) {
        document.title = '[ still held ] — Corehold';
        if (link) {
          // slow heartbeat while away (browsers throttle, so keep it gentle)
          link.href = drawFavicon(true);
          interval = window.setInterval(() => {
            frame = !frame;
            link.href = drawFavicon(frame);
          }, 1600);
        }
      } else {
        document.title = original;
        window.clearInterval(interval);
        if (link && originalHref) link.href = originalHref;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
      document.title = original;
      if (link && originalHref) link.href = originalHref;
    };
  }, []);

  return null;
}
