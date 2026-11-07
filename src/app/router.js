import { routes } from './routes.js';
import { layouts } from '../layouts/index.js';
import { auth } from '../core/auth.js';
import { checkAccess, getHomePath } from '../core/guards.js';
import { navigate } from '../core/navigate.js';

// Transforma '/courses/:id' em uma expressão regular + lista de names de parâmetros.
const compiled = routes.map((route) => {
  const keys = [];
  const source = route.path
    .replace(/:([A-Za-z_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  const pattern = route.path === '*' ? /^.*$/ : new RegExp(`^${source}/?$`);
  return { route, pattern, keys };
});

function matchRoute(pathname) {
  for (const { route, pattern, keys } of compiled) {
    const result = pathname.match(pattern);
    if (result) {
      const params = Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(result[i + 1])]));
      return { route, params };
    }
  }
  return null;
}

function parseLocation() {
  const [pathname, queryString = ''] = (location.hash.slice(1) || '/').split('?');
  return { pathname, query: new URLSearchParams(queryString) };
}

// Estado do que está na tela agora.
const state = {
  layoutKey: null, // ex.: 'app:student' (muda quando muda o layout OU o profile)
  layoutInstance: null,
  pageCleanup: null,
  navigationId: 0, // evita "corrida" quando o usuário clica rápido em várias telas
};

async function resolve() {
  const navigationId = ++state.navigationId;
  const { pathname, query } = parseLocation();
  const user = auth.getUser();

  // Raiz: manda para a tela certa conforme o usuário esteja logado ou não.
  if (pathname === '/') {
    navigate(user ? getHomePath(user) : '/login', { replace: true });
    return;
  }

  try {
    const { route, params } = matchRoute(pathname);

    // Guard: pode abrir esta rota?
    const access = checkAccess(route, user);
    if (!access.allowed) {
      navigate(access.redirectTo, { replace: true });
      return;
    }

    const [pageModule, layoutModule] = await Promise.all([route.load(), layouts[route.layout]()]);

    // Se o usuário já clicou em outra tela enquanto esta carregava, descarta.
    if (navigationId !== state.navigationId) return;

    const page = pageModule.default;
    const layout = layoutModule.default;
    const root = document.getElementById('app');
    if (!root) {
      throw new Error('Outlet principal da aplicação não foi encontrado.');
    }

    // Só recria o layout se ele mudou (assim o menu não "pisca" a cada tela).
    const layoutKey = `${route.layout}:${user?.role ?? 'guest'}`;
    if (state.layoutKey !== layoutKey) {
      state.layoutInstance?.destroy();
      root.innerHTML = layout.html;
      state.layoutInstance = layout.mount(root);
      state.layoutKey = layoutKey;
    }

    // Limpa a tela anterior (listeners, timers...) e depassword a nova.
    state.pageCleanup?.();
    const { outlet } = state.layoutInstance;
    outlet.innerHTML = page.html; // HTML estático nosso. Dados de usuário: use textContent!
    document.title = page.title ? `${page.title} | CareerTech` : 'CareerTech';
    state.pageCleanup = page.mount?.(outlet, { params, query }) ?? null;

    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Erro ao abrir a tela:', error);
    const root = document.getElementById('app');
    if (root) {
      root.textContent = 'Não foi possível carregar esta tela. Tente recarregar a página.';
    }
    state.layoutKey = null;
  }
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
