import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

export type ToggleThemeEvent =
  | React.MouseEvent
  | HTMLElement
  | { clientX: number; clientY: number; currentTarget?: EventTarget | null }
  | undefined;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: ToggleThemeEvent) => void;
  setTheme: (theme: Theme, event?: ToggleThemeEvent) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Direct DOM synchronization for theme classes & attributes
const applyThemeDirect = (newTheme: Theme) => {
  const root = document.documentElement;
  if (newTheme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('clipforge_theme', newTheme);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check localStorage first
    const saved = localStorage.getItem('clipforge_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 2. Check system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // 3. Default to light with purple ambience
    return 'light';
  });

  const isTransitioningRef = useRef(false);

  // Sync on initial mount without animation
  useEffect(() => {
    applyThemeDirect(theme);
  }, []);

  const switchThemeWithRadialReveal = (nextTheme: Theme, event?: ToggleThemeEvent) => {
    if (nextTheme === theme) return;
    if (isTransitioningRef.current) return;

    // 1. Respect prefers-reduced-motion: if enabled, switch immediately without animation
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const doc = document as any;
    const isViewTransitionSupported = typeof doc !== 'undefined' && typeof doc.startViewTransition === 'function';

    if (prefersReducedMotion) {
      setThemeState(nextTheme);
      applyThemeDirect(nextTheme);
      return;
    }

    // 2. Detect the exact physical position of the theme toggle button
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event) {
      if ('currentTarget' in event && event.currentTarget instanceof HTMLElement) {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (event instanceof HTMLElement) {
        const rect = event.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if ('clientX' in event && typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
        x = event.clientX;
        y = event.clientY;
      }
    }

    // Fallback: look for the active toggle button in the DOM if event had no target coordinates
    if (x === window.innerWidth / 2 && y === window.innerHeight / 2) {
      const toggleEl =
        document.querySelector<HTMLElement>('[data-theme-toggle="true"]') ||
        document.querySelector<HTMLElement>('button[aria-label*="Mode"]');
      if (toggleEl) {
        const rect = toggleEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // 3. Dynamically calculate the radius required to reach all 4 corners of the viewport
    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
    ) + 5;

    isTransitioningRef.current = true;

    // 4. Inject coordinates as CSS custom properties
    document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-toggle-radius', `${endRadius}px`);

    if (isViewTransitionSupported) {
      // Modern View Transitions API approach
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          setThemeState(nextTheme);
        });
        applyThemeDirect(nextTheme);
      });

      if (transition.ready) {
        transition.ready
          .then(() => {
            try {
              (document.documentElement.animate as any)(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 620,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            } catch {
              // Managed by CSS animation fallback
            }
          })
          .catch(() => {});
      }

      const cleanup = () => {
        isTransitioningRef.current = false;
        document.documentElement.style.removeProperty('--theme-toggle-x');
        document.documentElement.style.removeProperty('--theme-toggle-y');
        document.documentElement.style.removeProperty('--theme-toggle-radius');
      };

      if (transition.finished) {
        transition.finished.finally(cleanup);
      } else {
        setTimeout(cleanup, 650);
      }
    } else {
      // Graceful fallback for browsers without View Transitions API
      const overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.className = 'theme-radial-fallback-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        pointer-events: none;
        background-color: ${nextTheme === 'dark' ? '#090514' : '#ffffff'};
        clip-path: circle(0px at ${x}px ${y}px);
        transition: clip-path 580ms cubic-bezier(0.22, 1, 0.36, 1);
      `;
      document.body.appendChild(overlay);

      // Force reflow
      overlay.getBoundingClientRect();

      overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;

      setTimeout(() => {
        setThemeState(nextTheme);
        applyThemeDirect(nextTheme);
        overlay.remove();
        isTransitioningRef.current = false;
        document.documentElement.style.removeProperty('--theme-toggle-x');
        document.documentElement.style.removeProperty('--theme-toggle-y');
        document.documentElement.style.removeProperty('--theme-toggle-radius');
      }, 580);
    }
  };

  const toggleTheme = (event?: ToggleThemeEvent) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    switchThemeWithRadialReveal(next, event);
  };

  const setTheme = (newTheme: Theme, event?: ToggleThemeEvent) => {
    switchThemeWithRadialReveal(newTheme, event);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
