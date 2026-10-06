import { useEffect, useState } from 'react';

export type Route =
  | { type: 'home' }
  | { type: 'planner'; semesterId: string }
  | { type: 'share'; semesterId: string; hash: string };

export function parsePath(rawPath: string): Route {
  // Normalize path removing trailing slash and hash prefixes if present
  let clean = rawPath;
  if (clean.startsWith('#')) {
    clean = clean.slice(1);
  }
  clean = clean.replace(/\/+$/, '') || '/';

  const parts = clean.split('/').filter(Boolean);

  // /s/:semesterId/share/:hash
  if (parts.length >= 4 && parts[0] === 's' && parts[2] === 'share') {
    return {
      type: 'share',
      semesterId: parts[1],
      hash: parts[3],
    };
  }

  // /s/:semesterId
  if (parts.length >= 2 && parts[0] === 's') {
    return {
      type: 'planner',
      semesterId: parts[1],
    };
  }

  return { type: 'home' };
}

export function getCurrentRoute(): Route {
  // Check hash first (for static sites compatibility), then pathname
  if (window.location.hash && window.location.hash.length > 1) {
    return parsePath(window.location.hash.slice(1));
  }
  return parsePath(window.location.pathname);
}

export function navigate(to: string): void {
  // Support hash navigation cleanly for zero-server hosts
  if (to.startsWith('#')) {
    window.location.hash = to;
    return;
  }
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(getCurrentRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return route;
}
