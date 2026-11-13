import html from './app-layout.html?raw';
import './app-layout.css';
import { auth } from '../../core/auth.js';
import { menuByRole } from '../../core/menu.js';
import { navigate } from '../../core/navigate.js';
import { userInitials } from '../../utils/user-initials.js';

const sidebarAssets = [
  '/assets/sidebar/nav-dashboard.svg',
  '/assets/sidebar/nav-products.svg',
  '/assets/sidebar/nav-calendar.svg',
  '/assets/sidebar/nav-suppliers.svg',
  '/assets/sidebar/nav-reports.svg',
  '/assets/sidebar/nav-notifications.svg',
  '/assets/sidebar/nav-settings.svg',
  '/assets/sidebar/nav-support.svg',
  '/assets/sidebar/nav-truck.svg',
];

const iconByPath = {
  '/home': 0,
  '/teacher/dashboard': 0,
  '/courses': 1,
  '/classrooms': 2,
  '/teacher/classes': 2,
  '/teacher/lessons': 2,
  '/teacher/assignments-assessments': 4,
  '/career-quiz': 4,
  '/career-map': 3,
  '/teacher/students': 1,
  '/games': 8,
  '/ai-chat': 7,
  '/social-network': 5,
  '/certifications': 4,
  '/profile': 6,
  '/admin/users': 6,
};

const collapsedStorageKey = 'careertech-sidebar-collapsed';

function createNavLink(item) {
  const link = document.createElement('a');
  const icon = document.createElement('img');
  const label = document.createElement('span');

  link.className = 'app-sidebar__link';
  link.href = `#${item.path}`;
  link.dataset.path = item.path;
  link.title = item.label;

  icon.src = sidebarAssets[iconByPath[item.path] ?? 0];
  icon.width = 20;
  icon.height = 20;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');

  label.textContent = item.label;
  label.className = 'app-sidebar__label';

  link.append(icon, label);
  return link;
}

export default {
  html,

  mount(root) {
    const user = auth.getUser();
    const appLayout = root.querySelector('.app-layout');
    const nav = root.querySelector('[data-nav]');
    const items = menuByRole[user?.role] ?? [];
    const primaryItems = items.slice(0, 5);
    const secondaryItems = items.slice(5);
    const profileLink = root.querySelector('[data-profile-link]');
    const profileToggle = root.querySelector('[data-profile-toggle]');
    const profileMenu = root.querySelector('[data-profile-menu]');
    const sidebarToggle = root.querySelector('[data-sidebar-toggle]');
    const userMenuItems = menuByRole[user?.role] ?? [];
    const profileItem = userMenuItems.find((item) => item.path === '/profile');

    root.querySelector('[data-user-name]').textContent = user?.name ?? '';
    root.querySelector('[data-user-initials]').textContent = userInitials(user?.name ?? user?.nome);

    const primaryGroup = document.createElement('div');
    primaryGroup.className = 'app-sidebar__group';
    primaryGroup.setAttribute('aria-label', 'Navegação principal');
    primaryItems.forEach((item) => primaryGroup.append(createNavLink(item)));
    nav.append(primaryGroup);

    if (secondaryItems.length) {
      const divider = document.createElement('img');
      divider.className = 'app-sidebar__divider';
      divider.src = '/assets/sidebar/divider-expanded.svg';
      divider.width = 280;
      divider.height = 1;
      divider.alt = '';
      divider.setAttribute('aria-hidden', 'true');
      const collapsedDivider = document.createElement('img');
      collapsedDivider.className = 'app-sidebar__divider app-sidebar__divider--collapsed';
      collapsedDivider.src = '/assets/sidebar/divider-collapsed.svg';
      collapsedDivider.width = 76;
      collapsedDivider.height = 1;
      collapsedDivider.alt = '';
      collapsedDivider.setAttribute('aria-hidden', 'true');
      nav.append(divider, collapsedDivider);

      const secondaryGroup = document.createElement('div');
      secondaryGroup.className = 'app-sidebar__group';
      secondaryGroup.setAttribute('aria-label', 'Mais opções');
      secondaryItems.forEach((item) => secondaryGroup.append(createNavLink(item)));
      nav.append(secondaryGroup);
    }

    if (profileItem) {
      profileLink.href = `#${profileItem.path}`;
    } else {
      profileLink.hidden = true;
    }

    const setCollapsed = (collapsed, persist = true) => {
      appLayout.dataset.collapsed = String(collapsed);
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu');
      sidebarToggle.title = collapsed ? 'Expandir menu' : 'Recolher menu';
      if (persist) localStorage.setItem(collapsedStorageKey, String(collapsed));
    };

    const storedCollapsed = localStorage.getItem(collapsedStorageKey);
    const defaultCollapsed = storedCollapsed === null
      ? window.matchMedia('(max-width: 767px)').matches
      : storedCollapsed === 'true';
    setCollapsed(defaultCollapsed, false);

    const updateActive = () => {
      const current = location.hash.slice(1).split('?')[0];
      nav.querySelectorAll('a[data-path]').forEach((link) => {
        if (link.dataset.path === current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    const closeProfileMenu = () => {
      profileMenu.hidden = true;
      profileToggle.setAttribute('aria-expanded', 'false');
    };

    const toggleProfileMenu = () => {
      const willOpen = profileMenu.hidden;
      profileMenu.hidden = !willOpen;
      profileToggle.setAttribute('aria-expanded', String(willOpen));
    };

    updateActive();
    window.addEventListener('hashchange', updateActive);
    sidebarToggle.addEventListener('click', () => {
      setCollapsed(appLayout.dataset.collapsed !== 'true');
    });
    profileToggle.addEventListener('click', toggleProfileMenu);
    profileLink.addEventListener('click', closeProfileMenu);
    root.querySelector('[data-logout]').addEventListener('click', () => {
      auth.signOut();
      navigate('/login', { replace: true });
    });
    nav.addEventListener('click', closeProfileMenu);

    return {
      outlet: root.querySelector('[data-outlet]'),
      destroy: () => {
        window.removeEventListener('hashchange', updateActive);
      },
    };
  },
};
