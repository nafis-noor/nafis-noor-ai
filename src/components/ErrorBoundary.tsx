import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NOOR ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    // Reload freshly from server
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080A0E] text-[#F5EFE6] flex items-center justify-center p-4 selection:bg-[#C9A063]/30">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#10141D] border border-[#C9A063]/40 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#DFBA7F] to-[#A67C38] text-[#090C11] flex items-center justify-center shadow-lg shadow-[#C9A063]/25">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-[#DFBA7F]">
                NOOR Islamic Companion
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                A browser display update is ready. Please tap below to refresh NOOR and view the latest features.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-stone-400">
                {this.state.error.message || 'Unknown display error'}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh NOOR</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Browser Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
