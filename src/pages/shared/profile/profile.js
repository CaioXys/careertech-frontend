import html from './profile.html?raw';
import './profile.css';
import { auth } from '../../../core/auth.js';
import { session } from '../../../core/session.js';
import { userInitials } from '../../../utils/user-initials.js';

const roleNames = { student: 'Estudante', teacher: 'Professor', admin: 'Administrador' };

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
    const form = root.querySelector('.profile-page__form');
    const message = root.querySelector('[data-profile-message]');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const phoneInput = form.elements.telefone;
    const addressInput = form.elements.endereco;
    const cpfInput = form.elements.cpf;
    const roleInput = form.elements.role;
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

    return () => {
      phoneInput.removeEventListener('input', onPhoneInput);
      form.removeEventListener('input', onInput);
      form.removeEventListener('reset', onReset);
      form.removeEventListener('submit', onSubmit);
    };
  },
};
