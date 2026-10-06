import React, { useEffect } from 'react';
import { Onboarding } from './features/onboarding/Onboarding';
import { Planner } from './features/planner/Planner';
import { useRoute } from './router';
import { useUIStore } from './state/ui';

export const App: React.FC = () => {
  const route = useRoute();
  const { activeToast, hideToast, theme } = useUIStore();

  // Toast auto-dismiss after 4 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeToast, hideToast]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-ground text-ink selection:bg-ink selection:text-ground">
      {route.type === 'home' && <Onboarding />}
      {route.type === 'planner' && <Planner semesterId={route.semesterId} />}
      {route.type === 'share' && (
        <Planner semesterId={route.semesterId} shareHash={route.hash} />
      )}

      {/* Single persistent bottom-center toast notification */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-ink text-ground text-xs font-medium rounded shadow-lg border border-rule/20 pointer-events-none transition-all"
        >
          {activeToast}
        </div>
      )}
    </div>
  );
};
