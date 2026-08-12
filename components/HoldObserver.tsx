'use client';

import { useEffect } from 'react';

/**
 * Global reveal system: anything with [data-hold] gets `.is-held`
 * when it enters view — content is gripped into place, not faded in.
 */
export default function HoldObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-hold]'));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-held');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
