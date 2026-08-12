'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hold anything.
 *
 * Select any sentence on the page and the brackets grip your
 * selection — with a tag to copy a link that reopens the site
 * with that exact line held and spotlighted.
 */
export default function HoldSelection() {
  const tlRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const textRef = useRef('');

  useEffect(() => {
    const tl = tlRef.current!, br = brRef.current!, tag = tagRef.current!;
    let hideTimer = 0;

    const hide = () => {
      tl.style.opacity = br.style.opacity = '0';
      tag.style.display = 'none';
      setCopied(false);
    };

    const update = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!sel || sel.isCollapsed || text.length < 8 || text.length > 400) { hide(); return; }
      // don't fight form fields or the demo controls
      const anchor = sel.anchorNode?.parentElement;
      if (anchor?.closest('input, textarea, button, [role="switch"], .tool-chip')) { hide(); return; }
      if (!anchor?.closest('main, footer')) { hide(); return; }

      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width < 4) { hide(); return; }
      textRef.current = text;

      tl.style.opacity = br.style.opacity = '1';
      tl.style.transform = `translate3d(${rect.left - 8}px, ${rect.top - 8}px, 0)`;
      br.style.transform = `translate3d(${rect.right - 4}px, ${rect.bottom - 4}px, 0)`;
      tag.style.display = 'block';
      const tagX = Math.min(rect.right + 10, window.innerWidth - 150);
      tag.style.transform = `translate3d(${tagX}px, ${rect.bottom + 10}px, 0)`;
    };

    const onUp = () => { window.clearTimeout(hideTimer); hideTimer = window.setTimeout(update, 10); };
    const onSelChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) hide();
    };
    const onScroll = () => hide();

    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    document.addEventListener('selectionchange', onSelChange);
    window.addEventListener('scroll', onScroll, { passive: true });

    /* arriving via a held link: find the sentence, grip it */
    const hash = window.location.hash;
    if (hash.startsWith('#held=')) {
      const target = decodeURIComponent(hash.slice(6)).trim().toLowerCase().replace(/\s+/g, ' ');
      if (target.length >= 8) {
        window.setTimeout(() => {
          const walker = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            const hay = (node.textContent ?? '').toLowerCase().replace(/\s+/g, ' ');
            const idx = hay.indexOf(target.slice(0, 80));
            if (idx === -1) continue;
            const range = document.createRange();
            try {
              range.setStart(node, idx);
              range.setEnd(node, Math.min(idx + target.length, node.textContent!.length));
            } catch { continue; }
            const el = node.parentElement;
            el?.scrollIntoView({ block: 'center' });
            window.setTimeout(() => {
              const rect = range.getBoundingClientRect();
              tl.style.opacity = br.style.opacity = '1';
              tl.style.transform = `translate3d(${rect.left - 8}px, ${rect.top - 8}px, 0)`;
              br.style.transform = `translate3d(${rect.right - 4}px, ${rect.bottom - 4}px, 0)`;
              el?.classList.add('held-spot');
              window.setTimeout(() => {
                tl.style.opacity = br.style.opacity = '0';
                el?.classList.remove('held-spot');
              }, 3400);
            }, 350);
            break;
          }
        }, 600);
      }
    }

    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('selectionchange', onSelChange);
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#held=${encodeURIComponent(
      textRef.current.slice(0, 160)
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div aria-hidden={false}>
      <div ref={tlRef} className="hold-corner hold-corner-tl" style={{ top: 0, left: 0, opacity: 0 }} aria-hidden="true" />
      <div ref={brRef} className="hold-corner hold-corner-br" style={{ top: 0, left: 0, opacity: 0 }} aria-hidden="true" />
      <button
        ref={tagRef}
        type="button"
        className="hold-tag"
        style={{ top: 0, left: 0, display: 'none' }}
        onClick={copyLink}
        aria-label="Copy a link that opens this page with the selected text held"
      >
        {copied ? 'Link copied ✓' : '⌐ Hold — copy link'}
      </button>
    </div>
  );
}
