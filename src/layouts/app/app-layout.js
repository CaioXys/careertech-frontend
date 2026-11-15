import html from './app-layout.html?raw';
import './app-layout.css';
import { auth } from '../../core/auth.js';
import { menuByRole } from '../../core/menu.js';
import { navigate } from '../../core/navigate.js';
import { getTheme, setTheme, THEME_EVENT } from '../../core/theme.js';
import { getUnreadCount, MESSAGES_UNREAD_EVENT } from '../../services/messages.service.js';
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
  '/messages': 5,
  '/profile': 6,
  '/admin/home': 0,
  '/admin/users': 6,
  '/admin/approvals': 4,
  '/admin/management': 1,
};

const collapsedStorageKey = 'careertech-sidebar-collapsed';

const sunIcon = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
  </svg>
`;

const moonIcon = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
  </svg>
`;

function createNavLink(item) {
  const link = document.createElement('a');
  const iconWrap = document.createElement('span');
  const icon = document.createElement('img');
  const label = document.createElement('span');

  link.className = 'app-sidebar__link';
  link.href = `#${item.path}`;
  link.dataset.path = item.path;
  link.dataset.label = item.label;
  link.title = item.label;

  iconWrap.className = 'app-sidebar__icon';
  icon.src = sidebarAssets[iconByPath[item.path] ?? 0];
  icon.width = 20;
  icon.height = 20;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  iconWrap.append(icon);

  if (item.path === '/messages') {
    const badge = document.createElement('span');
    badge.className = 'app-nav-badge';
    badge.dataset.unreadBadge = '';
    badge.hidden = true;
    badge.setAttribute('aria-hidden', 'true');
    iconWrap.append(badge);
  }

  label.textContent = item.label;
  label.className = 'app-sidebar__label';

  link.append(iconWrap, label);
  return link;
}

function createMobileNavLink(item) {
  const link = createNavLink(item);
  link.classList.add('app-mobile-nav__link');
  return link;
}

function createMoreButton() {
  const button = document.createElement('button');
  const icon = document.createElement('span');
  const label = document.createElement('span');

  button.className = 'app-mobile-nav__link app-mobile-nav__more';
  button.type = 'button';
  button.dataset.mobileMoreToggle = '';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'mobile-more-dialog');
  button.title = 'Mais opções';

  icon.className = 'app-mobile-nav__more-icon';
  icon.textContent = '•••';
  icon.setAttribute('aria-hidden', 'true');
  label.className = 'app-sidebar__label';
  label.textContent = 'Mais';

  button.append(icon, label);
  return button;
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
    const mobilePrimaryItems = items.length > 5 ? items.slice(0, 4) : items;
    const mobileSecondaryItems = items.length > 5 ? items.slice(4) : [];
    const profileLink = root.querySelector('[data-profile-link]');
    const profileToggle = root.querySelector('[data-profile-toggle]');
    const profileMenu = root.querySelector('[data-profile-menu]');
    const sidebarToggle = root.querySelector('[data-sidebar-toggle]');
    const mobileNav = root.querySelector('[data-mobile-nav]');
    const moreDialog = root.querySelector('[data-mobile-more-dialog]');
    const moreList = root.querySelector('[data-mobile-more-list]');
    const moreClose = root.querySelector('[data-mobile-more-close]');
    const userMenuItems = menuByRole[user?.role] ?? [];
    const profileItem = userMenuItems.find((item) => item.path === '/profile');

    root.querySelector('[data-user-name]').textContent = user?.name ?? '';
    root.querySelector('[data-user-initials]').textContent = userInitials(user?.name ?? user?.nome);

    const sidebarTheme = root.querySelector('[data-sidebar-theme]');
    const mobileTheme = root.querySelector('[data-mobile-theme]');

    const createIcon = (markup) => {
      const template = document.createElement('template');
      template.innerHTML = markup.trim();
      return template.content.firstElementChild;
    };

    const syncThemeControls = () => {
      const theme = getTheme();
      root.querySelectorAll('[data-theme-option]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme));
      });
      const currentLabel = theme === 'dark' ? 'Modo escuro' : 'Modo claro';
      root.querySelectorAll('[data-theme-compact]').forEach((button) => {
        button.title = currentLabel;
        button.setAttribute('aria-label', `${currentLabel} ativo. Alternar tema`);
      });
    };

    const selectTheme = (theme) => {
      setTheme(theme);
      syncThemeControls();
    };

    const createThemeOption = (theme) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-theme__option';
      button.dataset.themeOption = theme;
      button.title = theme === 'light' ? 'Modo claro' : 'Modo escuro';

      const label = document.createElement('span');
      label.className = 'app-theme__label';
      label.textContent = theme === 'light' ? 'Claro' : 'Escuro';

      button.append(createIcon(theme === 'light' ? sunIcon : moonIcon), label);
      button.addEventListener('click', () => selectTheme(theme));
      return button;
    };

    const createThemeOptions = () => {
      const group = document.createElement('div');
      group.className = 'app-theme__options';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Escolher tema');
      group.append(createThemeOption('light'), createThemeOption('dark'));
      return group;
    };

    const createThemeCompact = () => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-theme__compact';
      button.dataset.themeCompact = '';

      const lightIcon = createIcon(sunIcon);
      const darkIcon = createIcon(moonIcon);
      lightIcon.classList.add('app-theme__icon', 'app-theme__icon--light');
      darkIcon.classList.add('app-theme__icon', 'app-theme__icon--dark');
      lightIcon.setAttribute('aria-hidden', 'true');
      darkIcon.setAttribute('aria-hidden', 'true');

      button.append(lightIcon, darkIcon);
      button.addEventListener('click', () => selectTheme(getTheme() === 'dark' ? 'light' : 'dark'));
      return button;
    };

    if (sidebarTheme) sidebarTheme.append(createThemeOptions(), createThemeCompact());
    if (mobileTheme) {
      const themeLabel = document.createElement('p');
      themeLabel.className = 'app-mobile-more__theme-label';
      themeLabel.textContent = 'Tema da interface';
      mobileTheme.append(themeLabel, createThemeOptions());
    }
    syncThemeControls();

    const handleThemeChange = () => syncThemeControls();
    document.addEventListener(THEME_EVENT, handleThemeChange);

    const primaryGroup = document.createElement('div');
    primaryGroup.className = 'app-sidebar__group';
    primaryGroup.setAttribute('aria-label', 'Navegação principal');
    primaryItems.forEach((item) => primaryGroup.append(createNavLink(item)));
    nav.append(primaryGroup);

    mobilePrimaryItems.forEach((item) => mobileNav.append(createMobileNavLink(item)));
    mobileNav.append(createMoreButton());
    mobileSecondaryItems.forEach((item) => moreList.append(createMobileNavLink(item)));

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

    const unreadLinks = [...root.querySelectorAll('a[data-path="/messages"]')];

    const setUnreadCount = (count) => {
      const total = Math.max(0, Number(count) || 0);
      const badgeText = total > 9 ? '9+' : String(total);

      unreadLinks.forEach((link) => {
        const badge = link.querySelector('[data-unread-badge]');
        if (badge) {
          badge.hidden = total === 0;
          badge.textContent = badgeText;
        }

        const baseLabel = link.dataset.label ?? 'Mensagens';
        const accessibleLabel = total
          ? `${baseLabel}, ${total} não lida${total === 1 ? '' : 's'}`
          : baseLabel;
        link.setAttribute('aria-label', accessibleLabel);
        link.title = accessibleLabel;
      });
    };

    const handleUnreadChange = (event) => setUnreadCount(event.detail);
    document.addEventListener(MESSAGES_UNREAD_EVENT, handleUnreadChange);
    if (unreadLinks.length) getUnreadCount().then(setUnreadCount).catch(() => {});

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
      root.querySelectorAll('a[data-path]').forEach((link) => {
        if (link.dataset.path === current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    const closeProfileMenu = () => {
      profileMenu.hidden = true;
      profileToggle.setAttribute('aria-expanded', 'false');
    };

    const closeMoreDialog = () => {
      if (moreDialog.open) moreDialog.close();
      const moreToggle = mobileNav.querySelector('[data-mobile-more-toggle]');
      moreToggle?.setAttribute('aria-expanded', 'false');
    };

    const handleMoreDialogClose = () => {
      const moreToggle = mobileNav.querySelector('[data-mobile-more-toggle]');
      moreToggle?.setAttribute('aria-expanded', 'false');
    };

    const openMoreDialog = () => {
      if (!moreDialog.open) moreDialog.showModal();
      const moreToggle = mobileNav.querySelector('[data-mobile-more-toggle]');
      moreToggle?.setAttribute('aria-expanded', 'true');
    };

    const handleHashChange = () => {
      updateActive();
      closeMoreDialog();
    };

    const handleMobileNavClick = (event) => {
      if (event.target.closest('[data-mobile-more-toggle]')) openMoreDialog();
      else if (event.target.closest('a[data-path]')) closeMoreDialog();
    };

    const handleMoreDialogClick = (event) => {
      if (event.target === moreDialog) closeMoreDialog();
    };

    const toggleProfileMenu = () => {
      const willOpen = profileMenu.hidden;
      profileMenu.hidden = !willOpen;
      profileToggle.setAttribute('aria-expanded', String(willOpen));
    };

    updateActive();
    window.addEventListener('hashchange', handleHashChange);
    sidebarToggle.addEventListener('click', () => {
      setCollapsed(appLayout.dataset.collapsed !== 'true');
    });
    moreDialog.id = 'mobile-more-dialog';
    mobileNav.addEventListener('click', handleMobileNavClick);
    moreClose.addEventListener('click', closeMoreDialog);
    moreDialog.addEventListener('click', handleMoreDialogClick);
    moreDialog.addEventListener('close', handleMoreDialogClose);
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
        window.removeEventListener('hashchange', handleHashChange);
        document.removeEventListener(THEME_EVENT, handleThemeChange);
        document.removeEventListener(MESSAGES_UNREAD_EVENT, handleUnreadChange);
        mobileNav.removeEventListener('click', handleMobileNavClick);
        moreDialog.removeEventListener('click', handleMoreDialogClick);
        moreDialog.removeEventListener('close', handleMoreDialogClose);
        if (moreDialog.open) moreDialog.close();
      },
    };
  },
};
