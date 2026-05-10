export type PageRenderer = (root: HTMLElement) => void | (() => void) | Promise<void | (() => void)>;

interface Route {
  path: string;
  render: PageRenderer;
}

let currentCleanup: (() => void) | null = null;
const routes: Route[] = [];
let root: HTMLElement | null = null;
let fallback: PageRenderer | null = null;

export function registerRoute(path: string, render: PageRenderer): void {
  routes.push({ path, render });
}

export function setFallback(render: PageRenderer): void {
  fallback = render;
}

export function startRouter(rootEl: HTMLElement): void {
  root = rootEl;
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function navigate(hash: string): void {
  if (window.location.hash === hash) resolve();
  else window.location.hash = hash;
}

function resolve(): void {
  if (!root) return;
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  root.innerHTML = '';

  const hash = window.location.hash || '#/home';
  for (const r of routes) {
    const params = match(r.path, hash);
    if (params) {
      root.dataset.params = JSON.stringify(params);
      const result = r.render(root);
      Promise.resolve(result).then((cleanup) => {
        if (typeof cleanup === 'function') currentCleanup = cleanup;
      });
      return;
    }
  }
  if (fallback) fallback(root);
}

function match(pattern: string, hash: string): Record<string, string> | null {
  const pa = pattern.split('/');
  const ha = hash.split('/');
  if (pa.length !== ha.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < pa.length; i++) {
    if (pa[i].startsWith(':')) out[pa[i].slice(1)] = decodeURIComponent(ha[i]);
    else if (pa[i] !== ha[i]) return null;
  }
  return out;
}

export function getRouteParams(): Record<string, string> {
  if (!root?.dataset.params) return {};
  return JSON.parse(root.dataset.params);
}
