import html from './forgot-password.html?raw';
import './forgot-password.css';
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from '../../../services/auth.service.js';

export default {
  title: 'Esqueci minha senha',
  html,

  mount(root) {
    const wrap = root.querySelector('.forgot-form-wrap');
    const requestForm = root.querySelector('.forgot-form');
    const email = root.querySelector('#forgot-email');
    const requestMessage = root.querySelector('#forgot-message');
    const requestButton = requestForm.querySelector('[type="submit"]');
    const requestLabel = requestButton.querySelector('span');
    const success = root.querySelector('.forgot-success');
    const successCopy = root.querySelector('.forgot-success__copy');
    const codeForm = root.querySelector('.forgot-code-form');
    const codeInputs = [...root.querySelectorAll('.forgot-code-input')];
    const codeMessage = root.querySelector('.forgot-code-message');
    const codeButton = codeForm.querySelector('[type="submit"]');
    const codeLabel = codeButton.querySelector('span');
    const modal = root.querySelector('.forgot-modal');
    const modalPanel = root.querySelector('.forgot-modal__panel');
    const modalClose = root.querySelector('.forgot-modal__close');
    const modalBackdrop = root.querySelector('.forgot-modal__backdrop');
    const passwordForm = root.querySelector('.forgot-password-form');
    const newPassword = root.querySelector('#forgot-new-password');
    const confirmPassword = root.querySelector('#forgot-confirm-password');
    const passwordMessage = root.querySelector('.forgot-password-message');
    const resetDone = root.querySelector('.forgot-reset-done');
    let resetEmail = '';
    let submittingRequest = false;
    let submittingCode = false;
    let submittingPassword = false;
    let previousFocus = null;

    const clearRequestMessage = () => {
      requestMessage.textContent = '';
      email.removeAttribute('aria-invalid');
    };
    const clearCodeError = () => {
      codeMessage.textContent = '';
      codeInputs.forEach((input) => input.removeAttribute('aria-invalid'));
    };
    const clearPasswordError = () => {
      passwordMessage.textContent = '';
      newPassword.removeAttribute('aria-invalid');
      confirmPassword.removeAttribute('aria-invalid');
    };
    const setBusy = (button, label, busy, busyText, idleText) => {
      button.disabled = busy;
      if (busy) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
      label.textContent = busy ? busyText : idleText;
    };
    const openModal = () => {
      previousFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('forgot-modal-open');
      newPassword.focus();
    };
    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove('forgot-modal-open');
      previousFocus?.focus?.();
    };
    const handleModalKeydown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...modalPanel.querySelectorAll('input:not(:disabled),button:not(:disabled)')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleRequestInput = () => { if (requestMessage.textContent) clearRequestMessage(); };
    const handleRequestSubmit = async (event) => {
      event.preventDefault();
      if (submittingRequest) return;
      clearRequestMessage();
      const address = email.value.trim().toLowerCase();
      if (!address || !email.validity.valid) {
        requestMessage.textContent = 'Informe um e-mail válido.';
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      submittingRequest = true;
      setBusy(requestButton, requestLabel, true, 'Enviando…', 'Enviar instruções');
      try {
        const result = await requestPasswordReset(address);
        resetEmail = address;
        wrap.classList.add('is-success');
        successCopy.textContent = result.mensagem;
        success.hidden = false;
        codeInputs[0].focus();
      } catch (error) {
        requestMessage.textContent = error?.message || 'Não foi possível solicitar a recuperação agora. Tente novamente.';
      } finally {
        submittingRequest = false;
        setBusy(requestButton, requestLabel, false, 'Enviando…', 'Enviar instruções');
      }
    };

    const handleCodeInput = (event) => {
      const input = event.target;
      const index = codeInputs.indexOf(input);
      input.value = input.value.replace(/\D/g, '').slice(-1);
      clearCodeError();
      if (input.value && index < codeInputs.length - 1) codeInputs[index + 1].focus();
    };
    const handleCodeKeydown = (event) => {
      const index = codeInputs.indexOf(event.target);
      if (event.key === 'Backspace' && !event.target.value && index > 0) {
        codeInputs[index - 1].focus();
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        codeInputs[index - 1].focus();
      } else if (event.key === 'ArrowRight' && index < codeInputs.length - 1) {
        event.preventDefault();
        codeInputs[index + 1].focus();
      }
    };
    const handleCodePaste = (event) => {
      const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
      if (!pasted) return;
      event.preventDefault();
      codeInputs.forEach((input, index) => { input.value = pasted[index] || ''; });
      clearCodeError();
      codeInputs[Math.min(pasted.length, 5)].focus();
    };
    const handleCodeSubmit = async (event) => {
      event.preventDefault();
      if (submittingCode) return;
      clearCodeError();
      const code = codeInputs.map((input) => input.value).join('');
      if (code.length !== 6) {
        codeMessage.textContent = 'Digite os 6 dígitos do código.';
        codeInputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
        codeInputs.find((input) => !input.value)?.focus();
        return;
      }
      submittingCode = true;
      setBusy(codeButton, codeLabel, true, 'Validando…', 'Validar código');
      try {
        await verifyPasswordResetCode(resetEmail, code);
        openModal();
      } catch (error) {
        codeMessage.textContent = error?.message || 'Não foi possível validar o código. Tente novamente.';
        codeInputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
        codeInputs[0].focus();
      } finally {
        submittingCode = false;
        setBusy(codeButton, codeLabel, false, 'Validando…', 'Validar código');
      }
    };

    const handlePasswordInput = () => { if (passwordMessage.textContent) clearPasswordError(); };
    const handlePasswordSubmit = async (event) => {
      event.preventDefault();
      if (submittingPassword) return;
      clearPasswordError();
      if (!newPassword.value || !newPassword.validity.valid) {
        passwordMessage.textContent = 'A nova senha deve ter pelo menos 8 caracteres.';
        newPassword.setAttribute('aria-invalid', 'true');
        newPassword.focus();
        return;
      }
      if (newPassword.value !== confirmPassword.value) {
        passwordMessage.textContent = 'As senhas não coincidem. Confira os campos e tente novamente.';
        confirmPassword.setAttribute('aria-invalid', 'true');
        confirmPassword.focus();
        return;
      }
      submittingPassword = true;
      const saveButton = passwordForm.querySelector('[type="submit"]');
      const saveLabel = saveButton.querySelector('span');
      setBusy(saveButton, saveLabel, true, 'Salvando…', 'Salvar nova senha');
      try {
        await resetPassword(resetEmail, newPassword.value);
        closeModal();
        wrap.classList.add('is-reset-done');
        success.hidden = true;
        resetDone.hidden = false;
      } catch (error) {
        passwordMessage.textContent = error?.message || 'Não foi possível atualizar sua senha. Tente novamente.';
      } finally {
        submittingPassword = false;
        setBusy(saveButton, saveLabel, false, 'Salvando…', 'Salvar nova senha');
      }
    };
    const handleCloseModal = () => closeModal();

    requestForm.addEventListener('submit', handleRequestSubmit);
    email.addEventListener('input', handleRequestInput);
    codeForm.addEventListener('submit', handleCodeSubmit);
    codeInputs.forEach((input) => {
      input.addEventListener('input', handleCodeInput);
      input.addEventListener('keydown', handleCodeKeydown);
      input.addEventListener('paste', handleCodePaste);
    });
    passwordForm.addEventListener('submit', handlePasswordSubmit);
    passwordForm.addEventListener('input', handlePasswordInput);
    modalClose.addEventListener('click', handleCloseModal);
    modalBackdrop.addEventListener('click', handleCloseModal);
    modal.addEventListener('keydown', handleModalKeydown);

    return () => {
      requestForm.removeEventListener('submit', handleRequestSubmit);
      email.removeEventListener('input', handleRequestInput);
      codeForm.removeEventListener('submit', handleCodeSubmit);
      codeInputs.forEach((input) => {
        input.removeEventListener('input', handleCodeInput);
        input.removeEventListener('keydown', handleCodeKeydown);
        input.removeEventListener('paste', handleCodePaste);
      });
      passwordForm.removeEventListener('submit', handlePasswordSubmit);
      passwordForm.removeEventListener('input', handlePasswordInput);
      modalClose.removeEventListener('click', handleCloseModal);
      modalBackdrop.removeEventListener('click', handleCloseModal);
      modal.removeEventListener('keydown', handleModalKeydown);
      document.body.classList.remove('forgot-modal-open');
    };
  },
};
