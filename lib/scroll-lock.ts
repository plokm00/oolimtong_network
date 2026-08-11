/**
 * Freezing the page behind a modal means putting `overflow: hidden` on the
 * body, and that takes the scrollbar away — so the page underneath jumps
 * sideways by the scrollbar's width. `scrollbar-gutter: stable` in
 * globals.css covers the ordinary case, but the spec only reserves a gutter
 * for `auto`/`scroll` overflow, so a locked body loses it again. We measure
 * the gutter before locking and hold the width open with padding instead.
 *
 * Counted, because modals stack: opening a word's detail and then a kraft
 * image means two locks, and the first one to close must not unfreeze the
 * page while the other is still open.
 */

let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

export const lockBodyScroll = () => {
    if (typeof document === 'undefined') return;

    lockCount += 1;
    if (lockCount > 1) return;

    const body = document.body;
    const gutter =
        window.innerWidth - document.documentElement.clientWidth;

    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
};

export const unlockBodyScroll = () => {
    if (typeof document === 'undefined' || lockCount === 0) return;

    lockCount -= 1;
    if (lockCount > 0) return;

    const body = document.body;
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
};
