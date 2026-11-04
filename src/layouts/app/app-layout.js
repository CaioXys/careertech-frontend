import html from './app-layout.html?raw';
import './app-layout.css';
import { auth } from '../../core/auth.js';
import { menuByRole } from '../../core/menu.js';
import { navigate } from '../../core/navigate.js';

export default {
  html,

  mount(root) {
    const user = auth.getUser();

    // Nome do usuário no cabeçalho (textContent = seguro contra XSS).
    root.querySelector('[data-user-name]').textContent = user?.name ?? '';

    // Menu conforme o profile. Criado com DOM API, sem innerHTML.
    const nav = root.querySelector('[data-nav]');
    for (const item of menuByRole[user?.role] ?? []) {
      const link = document.createElement('a');
      link.href = `#${item.path}`;
      link.textContent = item.label;
      link.dataset.path = item.path;
      nav.append(link);
    }

    // Marca o link da tela atual (acessibilidade: aria-current).
    const updateActive = () => {
      const current = location.hash.slice(1).split('?')[0];
      nav.querySelectorAll('a').forEach((a) => {
        if (a.dataset.path === current) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    };
    updateActive();
    window.addEventListener('hashchange', updateActive);

    // Logout (RF031 / RF067 / RF018-ADM).
    root.querySelector('[data-logout]').addEventListener('click', () => {
      auth.signOut();
      navigate('/login', { replace: true });
    });

    return {
      outlet: root.querySelector('[data-outlet]'),
      destroy: () => window.removeEventListener('hashchange', updateActive),
    };
  },
};
