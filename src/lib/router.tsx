import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

export interface Location {
  pathname: string;
  search: string;
}

interface RouterContextValue {
  location: Location;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function currentLocation(): Location {
  return { pathname: window.location.pathname, search: window.location.search };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(currentLocation);

  useEffect(() => {
    const onPop = () => setLocation(currentLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    const next = { pathname: url.pathname, search: url.search };
    const changed = next.pathname !== window.location.pathname || next.search !== window.location.search;
    if (options?.replace) {
      window.history.replaceState(null, '', `${next.pathname}${next.search}`);
    } else if (changed) {
      window.history.pushState(null, '', `${next.pathname}${next.search}`);
    }
    setLocation(next);
    if (next.pathname !== location.pathname) window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
}

export function useSearchParams(): [URLSearchParams, (next: Record<string, string | null>) => void] {
  const { location, navigate } = useRouter();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const merged = new URLSearchParams(window.location.search);
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === '') merged.delete(key);
        else merged.set(key, value);
      });
      const query = merged.toString();
      navigate(`${window.location.pathname}${query ? `?${query}` : ''}`, { replace: true });
    },
    [navigate],
  );

  return [params, update];
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export function Link({ to, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === '_blank'
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };

  return <a href={to} onClick={handleClick} {...rest} />;
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    const actual = pathParts[index];
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(actual);
    } else if (part !== actual) {
      return null;
    }
  }
  return params;
}
