import html from './register.html?raw';
import './register.css';
import { signUp } from '../../../services/auth.service.js';

function digits(value) {
  return value.replace(/\D/g, '');
}

function isValidCpf(value) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  const checkDigit = (length) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

function formatCpf(value) {
  return digits(value).slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatPhone(value) {
  const phone = digits(value).slice(0, 11);
  if (phone.length <= 2) return phone ? `(${phone}` : '';
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

export default {
  title: 'Cadastro',
  html,

  mount(root) {
    const form = root.querySelector('.register-form');
    const formWrap = root.querySelector('.register-form-wrap');
    const fields = [...form.querySelectorAll('input:not([type="radio"])')];
    const cpf = root.querySelector('#register-cpf');
    const phone = root.querySelector('#register-phone');
    const birthDate = root.querySelector('#register-birth');
    const password = root.querySelector('#register-password');
    const confirmPassword = root.querySelector('#register-confirm-password');
    const submit = root.querySelector('.register-submit[type="submit"]');
    const submitLabel = submit.querySelector('span');
    const message = root.querySelector('#register-message');
    const success = root.querySelector('#register-success');
    const successMessage = root.querySelector('#register-success-message');
    let submitting = false;

    const today = new Date();
    birthDate.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const clearError = (input) => input.removeAttribute('aria-invalid');
    const clearMessage = () => {
      message.textContent = '';
      fields.forEach(clearError);
    };
    const handleInput = (event) => {
      clearError(event.target);
      if (message.textContent) clearMessage();
    };
    const handleCpfInput = () => { cpf.value = formatCpf(cpf.value); };
    const handlePhoneInput = () => { phone.value = formatPhone(phone.value); };

    const fail = (text, input) => {
      message.textContent = text;
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (submitting) return;
      clearMessage();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const requiredInputs = [...form.querySelectorAll('input[required]:not([type="radio"])')];
      const invalidRequired = requiredInputs.find((input) => !input.value.trim() || !input.validity.valid);
      if (invalidRequired) {
        fail(invalidRequired.validationMessage || 'Preencha este campo corretamente.', invalidRequired);
        return;
      }
      if (!isValidCpf(cpf.value)) {
        fail('Informe um CPF válido.', cpf);
        return;
      }
      if (digits(phone.value) && !/^\d{10,11}$/.test(digits(phone.value))) {
        fail('Informe o telefone com DDD e 10 ou 11 dígitos.', phone);
        return;
      }
      if (password.value !== confirmPassword.value) {
        fail('As senhas não coincidem.', confirmPassword);
        return;
      }

      data.email = data.email.trim().toLowerCase();
      data.cpf = digits(data.cpf);
      data.telefone = digits(data.telefone);
      data.nome = data.nome.trim();
      data.rg = data.rg.trim();
      data.endereco = data.endereco.trim();
      if (!data.telefone) delete data.telefone;
      if (!data.endereco) delete data.endereco;

      submitting = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submitLabel.textContent = 'Criando sua conta…';

      try {
        const result = await signUp(data);
        form.hidden = true;
        root.querySelector('.register-role').hidden = true;
        root.querySelector('.register-heading').hidden = true;
        root.querySelector('.register-login').hidden = true;
        root.querySelector('.register-terms').hidden = true;
        successMessage.textContent = result.mensagem;
        success.hidden = false;
        formWrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch (error) {
        const errorText = Array.isArray(error?.message) ? error.message.join(' ') : error?.message;
        fail(errorText || 'Não foi possível criar sua conta agora. Tente novamente.');
      } finally {
        submitting = false;
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submitLabel.textContent = 'Criar minha conta';
      }
    };

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', handleInput);
    cpf.addEventListener('input', handleCpfInput);
    phone.addEventListener('input', handlePhoneInput);

    return () => {
      form.removeEventListener('submit', handleSubmit);
      form.removeEventListener('input', handleInput);
      cpf.removeEventListener('input', handleCpfInput);
      phone.removeEventListener('input', handlePhoneInput);
    };
  },
};
