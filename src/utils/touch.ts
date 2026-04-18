// Bind a context-menu handler that works on both desktop (right-click)
// and touch devices (long-press). Handler receives clientX/clientY.
export function bindContextMenu(
  el: HTMLElement,
  handler: (x: number, y: number) => void,
): void {
  el.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
    handler(e.clientX, e.clientY);
  });

  let timer: number | null = null;
  let startX = 0, startY = 0;
  const MOVE_THRESHOLD = 10;
  const DELAY = 500;

  const clear = () => {
    if (timer !== null) { window.clearTimeout(timer); timer = null; }
  };

  el.addEventListener("touchstart", (e: TouchEvent) => {
    if (e.touches.length !== 1) { clear(); return; }
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    clear();
    timer = window.setTimeout(() => {
      timer = null;
      handler(startX, startY);
    }, DELAY);
  }, { passive: true });

  el.addEventListener("touchmove", (e: TouchEvent) => {
    if (timer === null) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD ||
        Math.abs(t.clientY - startY) > MOVE_THRESHOLD) {
      clear();
    }
  }, { passive: true });

  el.addEventListener("touchend",   clear, { passive: true });
  el.addEventListener("touchcancel", clear, { passive: true });
}
