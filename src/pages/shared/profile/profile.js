import html from './profile.html?raw';
import './profile.css';
import { auth } from '../../../core/auth.js';
import { session } from '../../../core/session.js';
import { getTheme, setTheme, THEME_EVENT } from '../../../core/theme.js';
import { getStudentProgress } from '../../../services/student-progress.service.js';
import { userInitials } from '../../../utils/user-initials.js';

const roleNames = { student: 'Estudante', teacher: 'Professor', admin: 'Administrador' };
const settingUpdateDelay = 450;

const medalIcons = {
  'first-course': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3v18m0-9h11l-2 3 2 3H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  logic: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 4.5A3 3 0 0 0 4.2 6.3 3.5 3.5 0 0 0 5 13v4a3 3 0 0 0 3 3h1.5V4.5Zm5 0a3 3 0 0 1 5.3 1.8A3.5 3.5 0 0 1 19 13v4a3 3 0 0 1-3 3h-1.5V4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  `,
  'career-quiz': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  `,
  'interface-builder': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-12-4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
};

const fallbackMedalIcon = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
  </svg>
`;

function waitForSettingUpdate() {
  return new Promise((resolve) => setTimeout(resolve, settingUpdateDelay));
}

function formatPhone(value) {
  const phone = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  if (phone.length <= 2) return phone ? `(${phone}` : '';
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

function formatCpf(value) {
  const cpf = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function updateRegisteredUser(user) {
  try {
    const overrides = JSON.parse(localStorage.getItem('careertech:profile-overrides') ?? '{}');
    const key = String(user.id ?? user.email);
    overrides[key] = { name: user.name, email: user.email, telefone: user.telefone, endereco: user.endereco };
    localStorage.setItem('careertech:profile-overrides', JSON.stringify(overrides));

    const users = JSON.parse(localStorage.getItem('careertech:registered-users') ?? '[]');
    const index = users.findIndex((item) => String(item.id) === String(user.id));
    if (index < 0) return;
    users[index] = { ...users[index], name: user.name, email: user.email, telefone: user.telefone, endereco: user.endereco };
    localStorage.setItem('careertech:registered-users', JSON.stringify(users));
  } catch {
    // O perfil ainda pode ser atualizado na sessão, mesmo se o armazenamento do protótipo falhar.
  }
}

export default {
  title: 'Perfil',
  html,

  /**
   * Chamado depois que o HTML foi inserido na página.
   * @param {HTMLElement} root  elemento onde a tela foi depasswordda
   * @param {{ params: Record<string, string>, query: URLSearchParams }} ctx
   *        params = parâmetros da rota (ex.: /courses/:id -> ctx.params.id)
   * @returns {Function | void} função de limpeza opcional, chamada ao sair da tela
   */
  mount(root) {
    const user = auth.getUser() ?? {};
    const profileAvatar = root.querySelector('[data-profile-initials]');
    const progressPanel = root.querySelector('[data-profile-progress]');
    const medalsPanel = root.querySelector('[data-profile-medals]');
    const form = root.querySelector('.profile-page__form');
    const message = root.querySelector('[data-profile-message]');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const phoneInput = form.elements.telefone;
    const addressInput = form.elements.endereco;
    const cpfInput = form.elements.cpf;
    const roleInput = form.elements.role;
    const themeToggle = root.querySelector('[data-theme-toggle]');
    const toast = root.querySelector('[data-profile-toast]');
    const toastText = root.querySelector('[data-profile-toast-text]');
    const toastClose = root.querySelector('[data-profile-toast-close]');
    let toastTimer;
    let toastCloseTimer;
    const initialValues = {
      name: user.name ?? user.nome ?? '',
      email: user.email ?? '',
      telefone: user.telefone ?? user.phone ?? '',
      endereco: user.endereco ?? user.address ?? '',
    };

    const showUser = (profile) => {
      const name = profile.name ?? profile.nome ?? '';
      const email = profile.email ?? '';
      const role = roleNames[profile.role] ?? 'Conta CareerTech';
      root.querySelector('[data-profile-name]').textContent = name || 'Seu nome';
      root.querySelector('[data-profile-email]').textContent = email || 'E-mail não informado';
      root.querySelector('[data-profile-initials]').textContent = userInitials(name);
      root.querySelector('[data-profile-role]').textContent = role;
    };

    nameInput.value = initialValues.name;
    emailInput.value = initialValues.email;
    phoneInput.value = formatPhone(initialValues.telefone);
    addressInput.value = initialValues.endereco;
    cpfInput.value = formatCpf(user.cpf);
    roleInput.value = roleNames[user.role] ?? 'Conta CareerTech';
    showUser(user);

    let progressActive = true;

    const renderMedals = (progress) => {
      const list = root.querySelector('[data-profile-medals-list]');
      const summary = root.querySelector('[data-profile-medals-summary]');
      list.replaceChildren(...progress.medals.map((medal) => {
        const item = document.createElement('article');
        item.className = `profile-page__medal profile-page__medal--${medal.unlocked ? 'unlocked' : 'locked'}`;
        item.dataset.profileMedal = medal.id;

        const icon = document.createElement('span');
        icon.className = 'profile-page__medal-icon';
        icon.innerHTML = medalIcons[medal.id] ?? fallbackMedalIcon;

        const copy = document.createElement('div');
        copy.className = 'profile-page__medal-copy';

        const title = document.createElement('strong');
        title.textContent = medal.title;

        const description = document.createElement('small');
        description.textContent = medal.description;

        const status = document.createElement('span');
        status.className = 'profile-page__medal-status';
        status.textContent = medal.unlocked
          ? `Conquistada · +${medal.rewardXp} XP`
          : `+${medal.rewardXp} XP · ${medal.progress}% concluído`;

        copy.append(title, description, status);
        item.append(icon, copy);
        return item;
      }));

      summary.textContent = `${progress.unlockedMedals} de ${progress.totalMedals} conquistadas`;
      medalsPanel.hidden = false;
    };

    const renderStudentProgress = (progress) => {
      profileAvatar.dataset.level = String(progress.level);
      profileAvatar.title = `Nível ${progress.level} · ${progress.xp} XP`;

      root.querySelector('[data-profile-xp]').textContent = `${progress.xp} XP`;
      root.querySelector('[data-profile-level]').textContent = `Nível ${progress.level}`;
      root.querySelector('[data-profile-next-level]').textContent = `${progress.missingXp} XP para o nível ${progress.level + 1}`;

      const track = root.querySelector('[data-profile-xp-track]');
      track.setAttribute('aria-valuenow', String(progress.levelProgress));
      root.querySelector('[data-profile-xp-bar]').style.width = `${progress.levelProgress}%`;

      progressPanel.hidden = false;
      renderMedals(progress);
    };

    if (user.role === 'student') {
      getStudentProgress(user)
        .then((progress) => {
          if (progressActive) renderStudentProgress(progress);
        })
        .catch((cause) => {
          console.error('Erro ao carregar progresso do perfil:', cause);
        });
    }

    const onPhoneInput = () => { phoneInput.value = formatPhone(phoneInput.value); };
    const onInput = () => {
      message.textContent = '';
      message.removeAttribute('data-state');
    };
    const onReset = () => {
      requestAnimationFrame(() => {
        message.textContent = '';
        message.removeAttribute('data-state');
      });
    };
    const onSubmit = (event) => {
      event.preventDefault();
      message.textContent = '';
      message.removeAttribute('data-state');

      if (!form.reportValidity()) return;
      if (nameInput.value.trim().length < 3) {
        nameInput.setCustomValidity('Informe seu nome completo.');
        nameInput.reportValidity();
        nameInput.setCustomValidity('');
        return;
      }

      const updatedUser = {
        ...user,
        name: nameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        telefone: phoneInput.value.replace(/\D/g, ''),
        endereco: addressInput.value.trim(),
      };

      try {
        const currentSession = session.get();
        if (!currentSession) throw new Error('Sessão não encontrada. Entre novamente para atualizar seu perfil.');
        session.set({ ...currentSession, user: updatedUser });
        updateRegisteredUser(updatedUser);
        Object.assign(user, updatedUser);
        showUser(updatedUser);
        message.textContent = 'Perfil atualizado com sucesso.';
      } catch (error) {
        message.dataset.state = 'error';
        message.textContent = error.message || 'Não foi possível salvar suas alterações. Tente novamente.';
      }
    };

    phoneInput.addEventListener('input', onPhoneInput);
    form.addEventListener('input', onInput);
    form.addEventListener('reset', onReset);
    form.addEventListener('submit', onSubmit);

    themeToggle.checked = getTheme() === 'dark';
    const handleThemeChange = () => {
      themeToggle.checked = getTheme() === 'dark';
    };
    document.addEventListener(THEME_EVENT, handleThemeChange);
    const settingToggles = [...root.querySelectorAll('.profile-page__switch-input')];
    const showToast = (text, tone = 'success', autoClose = true) => {
      clearTimeout(toastTimer);
      clearTimeout(toastCloseTimer);
      toast.hidden = false;
      toast.classList.remove('profile-page__toast--closing');
      toast.dataset.tone = tone;
      toastText.textContent = text;
      toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
      if (autoClose) toastTimer = setTimeout(dismissToast, 3000);
    };
    const dismissToast = () => {
      clearTimeout(toastTimer);
      clearTimeout(toastCloseTimer);
      if (toast.hidden) return;
      toast.classList.add('profile-page__toast--closing');
      toastCloseTimer = setTimeout(() => {
        toast.hidden = true;
        toast.classList.remove('profile-page__toast--closing');
      }, 220);
    };
    const onSettingChange = async (event) => {
      const toggle = event.currentTarget;
      const setting = toggle.closest('.profile-page__setting');
      const label = setting.querySelector('strong').textContent;
      const previousValue = !toggle.checked;

      toggle.disabled = true;
      setting.setAttribute('aria-busy', 'true');
      setting.dataset.state = 'loading';
      showToast('Atualizando configuração…', 'loading', false);

      try {
        if (toggle === themeToggle) setTheme(toggle.checked ? 'dark' : 'light');
        await waitForSettingUpdate();
        showToast(`${label} ${toggle.checked ? 'ativada' : 'desativada'}.`);
      } catch (error) {
        toggle.checked = previousValue;
        showToast(error?.message || 'Não foi possível atualizar esta configuração.', 'error');
      } finally {
        toggle.disabled = false;
        setting.removeAttribute('aria-busy');
        delete setting.dataset.state;
      }
    };
    settingToggles.forEach((toggle) => toggle.addEventListener('change', onSettingChange));
    toastClose.addEventListener('click', dismissToast);

    return () => {
      progressActive = false;
      phoneInput.removeEventListener('input', onPhoneInput);
      form.removeEventListener('input', onInput);
      form.removeEventListener('reset', onReset);
      form.removeEventListener('submit', onSubmit);
      document.removeEventListener(THEME_EVENT, handleThemeChange);
      settingToggles.forEach((toggle) => toggle.removeEventListener('change', onSettingChange));
      toastClose.removeEventListener('click', dismissToast);
      clearTimeout(toastTimer);
      clearTimeout(toastCloseTimer);
    };
  },
};
