import { Platform } from "obsidian";

// Prevents iOS WebView from scrolling the window when an input inside a
// Chronicle view is focused. Without this, iOS auto-scrolls the focused
// element into view — which, when our outer container is position: static
// inside Obsidian's workspace, looks like the page being pushed up / blanked.
//
// Strategy: while any input/textarea/select inside a .chronicle-app /
// .chronicle-cal-app / .chronicle-form-page is focused, lock body scroll
// and pin the window at y=0. Restore on blur.

const CHRONICLE_CONTAINER_SEL =
  ".chronicle-app, .chronicle-cal-app, .chronicle-form-page";

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

let savedScrollY = 0;
let locked       = false;

function isInChronicle(el: Element | null): boolean {
  return !!(el && (el as HTMLElement).closest(CHRONICLE_CONTAINER_SEL));
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  if (el.isContentEditable) return true;
  return false;
}

function lockBody() {
  if (locked) return;
  savedScrollY = window.scrollY;
  const body   = document.body;
  body.style.position = "fixed";
  body.style.top      = `-${savedScrollY}px`;
  body.style.left     = "0";
  body.style.right    = "0";
  body.style.width    = "100%";
  body.classList.add("chronicle-mobile-kb-lock");
  locked = true;
}

function unlockBody() {
  if (!locked) return;
  const body = document.body;
  body.style.position = "";
  body.style.top      = "";
  body.style.left     = "";
  body.style.right    = "";
  body.style.width    = "";
  body.classList.remove("chronicle-mobile-kb-lock");
  window.scrollTo(0, savedScrollY);
  locked = false;
}

export function installMobileKeyboardLock(): () => void {
  if (!Platform.isMobile) return () => {};

  const onFocusIn = (e: FocusEvent) => {
    if (!isEditable(e.target)) return;
    if (!isInChronicle(e.target as Element)) return;
    lockBody();
  };

  const onFocusOut = (e: FocusEvent) => {
    if (!isEditable(e.target)) return;
    if (!isInChronicle(e.target as Element)) return;
    // Delay so that focus moving to another input in the same view doesn't
    // cause a lock/unlock flicker.
    window.setTimeout(() => {
      const active = document.activeElement;
      if (isEditable(active) && isInChronicle(active)) return;
      unlockBody();
    }, 50);
  };

  document.addEventListener("focusin",  onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    document.removeEventListener("focusin",  onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    unlockBody();
  };
}
