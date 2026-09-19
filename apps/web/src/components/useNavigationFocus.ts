import { useEffect, type RefObject } from 'react';

export function useNavigationFocus(
  open: boolean,
  panel: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open || !panel.current) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select',
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0);
    elements()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab') return;
      const nodes = elements();
      const first = nodes[0];
      const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 821px)');
    const resized = () => {
      if (desktop.matches) close();
    };
    document.addEventListener('keydown', keydown);
    desktop.addEventListener('change', resized);
    return () => {
      document.removeEventListener('keydown', keydown);
      desktop.removeEventListener('change', resized);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, panel, close]);
}
