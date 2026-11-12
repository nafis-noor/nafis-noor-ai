import { useEffect, useRef } from 'react';

// Global counter for active modals to support stacked or nested modals gracefully
let activeModalCount = 0;
let initialBodyStyles: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflowY: string;
} | null = null;
let savedGlobalScrollY = 0;
let savedGlobalScrollX = 0;

/**
 * Universal hook that:
 * 1. Freezes the background page at the exact current scroll coordinates without jumping to the top.
 * 2. The modal appears full and centered over the exact spot the user was viewing (e.g. Prayer Notifications / About).
 * 3. When the user exits via X (or Close / backdrop), smoothly unlocks and leaves the user in the exact same spot they were.
 */
export function useModalScrollLock(isOpen: boolean, modalId?: string) {
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const scrollCoordinatesRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture the exact element that was clicked
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      triggerElementRef.current = document.activeElement;
    }

    // 2. Capture exact window scroll coordinates at the moment of opening
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || window.scrollX || 0;
    
    scrollCoordinatesRef.current = { x: scrollX, y: scrollY };
    savedGlobalScrollY = scrollY;
    savedGlobalScrollX = scrollX;

    // 3. Lock background scroll using the zero-jump fixed body technique
    activeModalCount++;
    if (activeModalCount === 1) {
      const body = document.body;

      initialBodyStyles = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflowY: body.style.overflowY,
      };

      // Freeze body in-place at the exact scroll position without resetting to top
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = `-${scrollX}px`;
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflowY = 'scroll'; // Retain scrollbar to prevent horizontal layout shift
    }

    // 4. Cleanup when the modal is closed
    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0 && initialBodyStyles) {
        const body = document.body;
        body.style.position = initialBodyStyles.position;
        body.style.top = initialBodyStyles.top;
        body.style.left = initialBodyStyles.left;
        body.style.right = initialBodyStyles.right;
        body.style.width = initialBodyStyles.width;
        body.style.overflowY = initialBodyStyles.overflowY;
        initialBodyStyles = null;

        // Restore exact place where the user was when they clicked
        const targetY = scrollCoordinatesRef.current.y || savedGlobalScrollY;
        const targetX = scrollCoordinatesRef.current.x || savedGlobalScrollX;
        const triggerEl = triggerElementRef.current;

        // Restore scroll position instantly
        window.scrollTo({
          top: targetY,
          left: targetX,
          behavior: 'instant' as ScrollBehavior,
        });

        // Re-focus the trigger button smoothly without disturbing view
        if (triggerEl && typeof triggerEl.focus === 'function') {
          try {
            triggerEl.focus({ preventScroll: true });
          } catch {
            // ignore
          }
        }
      }
    };
  }, [isOpen]);
}
