import html from './login.html?raw';
import './login.css';
import { auth } from '../../../core/auth.js';
import { getHomePath } from '../../../core/guards.js';
import { navigate } from '../../../core/navigate.js';

export default {
  title: 'Entrar',
  html,

  mount(root) {
    const form = root.querySelector('.login-form');
    const emailInput = root.querySelector('#login-email');
    const passwordInput = root.querySelector('#login-password');
    const passwordToggle = root.querySelector('.login-password-toggle');
    const submitButton = root.querySelector('.login-submit');
    const submitLabel = submitButton.querySelector('span');
    const message = root.querySelector('#login-message');
    let submitting = false;

    const clearMessage = () => {
      message.textContent = '';
      emailInput.removeAttribute('aria-invalid');
      passwordInput.removeAttribute('aria-invalid');
    };

    const handleInput = () => {
      if (message.textContent) clearMessage();
    };

    const handlePasswordToggle = () => {
      const showPassword = passwordInput.type === 'password';
      passwordInput.type = showPassword ? 'text' : 'password';
      passwordToggle.setAttribute('aria-pressed', String(showPassword));
      passwordToggle.setAttribute('aria-label', showPassword ? 'Ocultar senha' : 'Mostrar senha');
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (submitting) return;
      clearMessage();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !emailInput.validity.valid) {
        message.textContent = 'Informe um e-mail válido.';
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
      }
      if (!password) {
        message.textContent = 'Informe sua senha.';
        passwordInput.setAttribute('aria-invalid', 'true');
        passwordInput.focus();
        return;
      }

      submitting = true;
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitLabel.textContent = 'Entrando…';

      try {
        const user = await auth.signIn(email, password);
        navigate(getHomePath(user), { replace: true });
      } catch (error) {
        message.textContent = error?.message || 'Não foi possível entrar agora. Tente novamente.';
        emailInput.setAttribute('aria-invalid', 'true');
        passwordInput.setAttribute('aria-invalid', 'true');
        passwordInput.focus();
      } finally {
        submitting = false;
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitLabel.textContent = 'Entrar';
      }
    };

    form.addEventListener('submit', handleSubmit);
    emailInput.addEventListener('input', handleInput);
    passwordInput.addEventListener('input', handleInput);
    passwordToggle.addEventListener('click', handlePasswordToggle);

    return () => {
      form.removeEventListener('submit', handleSubmit);
      emailInput.removeEventListener('input', handleInput);
      passwordInput.removeEventListener('input', handleInput);
      passwordToggle.removeEventListener('click', handlePasswordToggle);
    };
  },
};
