import { useEffect, useRef } from 'react';
import { NavTab } from '../components/Navigation';

export interface BackAction {
  id: string;
  name: string;
  handler: () => void;
}

// Global stack of active overlays, modals, and subviews
const actionStack: BackAction[] = [];

// Tab navigation history stack
const tabHistory: NavTab[] = ['home'];

// Flag to prevent recursion between browser popstate and programmatic history.back()
let isProcessingPopstate = false;

// Counter for programmatic history.back() calls (e.g. closing modals via UI)
let programmaticBackCount = 0;

// Application load timestamp to enforce startup grace period
let appStartTime = typeof window !== 'undefined' ? Date.now() : 0;

// Track if user has genuinely interacted with the page
let hasUserInteracted = false;

if (typeof window !== 'undefined') {
  const markUserInteracted = () => {
    hasUserInteracted = true;
    window.removeEventListener('pointerdown', markUserInteracted);
    window.removeEventListener('touchstart', markUserInteracted);
    window.removeEventListener('keydown', markUserInteracted);
    window.removeEventListener('click', markUserInteracted);
  };
  window.addEventListener('pointerdown', markUserInteracted, { passive: true });
  window.addEventListener('touchstart', markUserInteracted, { passive: true });
  window.addEventListener('keydown', markUserInteracted, { passive: true });
  window.addEventListener('click', markUserInteracted, { passive: true });
}

// Active listener for tab changes
type TabChangeListener = (tab: NavTab) => void;
const tabChangeListeners: Set<TabChangeListener> = new Set();

// Active listener for toast/feedback notifications
type FeedbackListener = (message: string) => void;
const feedbackListeners: Set<FeedbackListener> = new Set();

// Active listener for application exit confirmation request
type ExitRequestListener = () => void;
const exitRequestListeners: Set<ExitRequestListener> = new Set();

/**
 * Subscribes to application exit requests (triggered when back button is clicked at root)
 */
export function onExitRequested(listener: ExitRequestListener): () => void {
  exitRequestListeners.add(listener);
  return () => {
    exitRequestListeners.delete(listener);
  };
}

function notifyExitRequest() {
  exitRequestListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in exit request listener:', err);
    }
  });
}

/**
 * Subscribes to tab change events triggered by browser history back/forward
 */
export function onTabHistoryChange(listener: TabChangeListener): () => void {
  tabChangeListeners.add(listener);
  return () => {
    tabChangeListeners.delete(listener);
  };
}

/**
 * Subscribes to back navigation feedback alerts
 */
export function onHistoryFeedback(listener: FeedbackListener): () => void {
  feedbackListeners.add(listener);
  return () => {
    feedbackListeners.delete(listener);
  };
}

function notifyTabChange(tab: NavTab) {
  tabChangeListeners.forEach((listener) => {
    try {
      listener(tab);
    } catch (err) {
      console.error('Error in tab change listener:', err);
    }
  });
}

function notifyFeedback(message: string) {
  feedbackListeners.forEach((listener) => {
    try {
      listener(message);
    } catch (err) {
      console.error('Error in history feedback listener:', err);
    }
  });
}

/**
 * Initializes the browser history state on application startup
 */
export function initHistory(initialTab: NavTab = 'home'): void {
  if (typeof window === 'undefined') return;

  appStartTime = Date.now();
  tabHistory.length = 0;
  tabHistory.push(initialTab);
  actionStack.length = 0;
  programmaticBackCount = 0;

  try {
    // Set up root baseline history entry
    window.history.replaceState(
      {
        noorApp: true,
        tab: initialTab,
        isRoot: true,
        stackDepth: 0,
      },
      ''
    );

    // Push an anchor entry so the first back click stays inside Noor
    window.history.pushState(
      {
        noorApp: true,
        tab: initialTab,
        isRoot: false,
        stackDepth: 1,
      },
      ''
    );
  } catch (e) {
    console.warn('History initialization note:', e);
  }

  // Bind popstate listener once
  window.removeEventListener('popstate', handlePopState);
  window.addEventListener('popstate', handlePopState);
}

/**
 * Central browser popstate handler triggered when the user clicks the browser Back or Forward button
 */
function handlePopState(e: PopStateEvent) {
  // 0. If this popstate was triggered programmatically (e.g. closing an overlay via UI), consume and ignore
  if (programmaticBackCount > 0) {
    programmaticBackCount--;
    return;
  }

  // 1. Never trigger exit requests on startup, during initial grace period (2.5s), or before user interaction
  const isStartupGracePeriod = Date.now() - appStartTime < 2500;
  if (!hasUserInteracted || isStartupGracePeriod) {
    // Keep history safely anchored without displaying exit confirmation
    try {
      window.history.pushState(
        {
          noorApp: true,
          tab: tabHistory[0] || 'home',
          isRoot: false,
          stackDepth: 1,
        },
        ''
      );
    } catch {
      // ignore
    }
    return;
  }

  isProcessingPopstate = true;

  try {
    // 2. Priority 1: If any modal, drawer, or subview is open, close the topmost one
    if (actionStack.length > 0) {
      const topAction = actionStack.pop();
      if (topAction) {
        topAction.handler();
      }
      return;
    }

    // 3. Priority 2: Navigate back to previous tab in application history
    if (tabHistory.length > 1) {
      tabHistory.pop(); // Remove current tab
      const previousTab = tabHistory[tabHistory.length - 1];
      notifyTabChange(previousTab);
      return;
    }

    // 4. Priority 3: Root reached (already on home screen with no overlays)
    // User accidentally clicked the back button at root to leave the site
    // Re-anchor to keep Noor active and prompt user with Exit Confirmation
    window.history.pushState(
      {
        noorApp: true,
        tab: tabHistory[0] || 'home',
        isRoot: false,
        stackDepth: 1,
      },
      ''
    );
    notifyExitRequest();
  } finally {
    // Release flag after synchronous dispatch has completed
    setTimeout(() => {
      isProcessingPopstate = false;
    }, 60);
  }
}

/**
 * Gracefully navigates the user out of Noor to their browser's home / previous site
 */
export function exitToBrowserHome(): void {
  try {
    // Try to close window if opened as PWA or popup
    window.close();
  } catch {
    // ignore
  }

  try {
    if (document.referrer && !document.referrer.includes(window.location.hostname)) {
      window.location.href = document.referrer;
      return;
    }

    if (window.history.length > 2) {
      window.history.go(-window.history.length);
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 250);
    } else {
      window.location.href = 'about:blank';
    }
  } catch {
    window.location.href = 'about:blank';
  }
}

/**
 * Records a tab change into the browser history stack
 */
export function pushTabNavigation(newTab: NavTab): void {
  if (typeof window === 'undefined') return;

  const currentTab = tabHistory[tabHistory.length - 1];
  if (currentTab === newTab) return; // No duplicate push

  tabHistory.push(newTab);

  // Push new history state
  window.history.pushState(
    {
      noorApp: true,
      tab: newTab,
      isRoot: false,
      stackDepth: tabHistory.length,
    },
    ''
  );
}

/**
 * Registers an action (modal close, subview exit) that should be executed when the browser Back button is pressed.
 * Returns an unregister cleanup function.
 */
export function pushBackAction(name: string, handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const actionId = `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const action: BackAction = { id: actionId, name, handler };

  actionStack.push(action);

  // Push a state into browser history so Back button emits a popstate
  window.history.pushState(
    {
      noorApp: true,
      actionId,
      actionName: name,
      stackDepth: tabHistory.length + actionStack.length,
    },
    ''
  );

  let isCleanedUp = false;

  return () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    const index = actionStack.findIndex((a) => a.id === actionId);
    if (index !== -1) {
      actionStack.splice(index, 1);
      // If modal was closed via UI (e.g. "X" button or backdrop) and NOT via browser back button,
      // step back in browser history to keep history stack in sync
      if (!isProcessingPopstate) {
        programmaticBackCount++;
        try {
          window.history.back();
        } catch {
          programmaticBackCount = Math.max(0, programmaticBackCount - 1);
        }
      }
    }
  };
}

/**
 * React hook that connects any open overlay/modal/subview to the browser Back button.
 * When open, pressing the browser Back button will call onClose() instead of leaving the app.
 */
export function useBackHandler(
  isOpen: boolean,
  onClose: () => void,
  name: string
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const cleanup = pushBackAction(name, () => {
      onCloseRef.current();
    });

    return cleanup;
  }, [isOpen, name]);
}
