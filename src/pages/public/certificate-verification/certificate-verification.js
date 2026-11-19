import html from './certificate-verification.html?raw';
import './certificate-verification.css';
import { verifyCertificate } from '../../../services/certificates.service.js';

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function formatDate(value) {
  if (!value) return 'Não informada';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

function createStatus(status) {
  const wrapper = document.createElement('div');
  wrapper.className = `certificate-verification-page__status certificate-verification-page__status--${status}`;
  const icon = document.createElement('span');
  icon.className = 'certificate-verification-page__status-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = status === 'valid' ? '✓' : '!';
  const copy = document.createElement('div');
  copy.append(
    createTextElement('strong', '', status === 'valid' ? 'Certificado válido' : 'Certificado revogado'),
    createTextElement(
      'span',
      '',
      status === 'valid'
        ? 'Os dados abaixo conferem com o registro de emissão.'
        : 'Este certificado foi emitido, mas não está mais válido.',
    ),
  );
  wrapper.append(icon, copy);
  return wrapper;
}

function createDefinitionList(certificate) {
  const list = document.createElement('dl');
  list.className = 'certificate-verification-page__details';
  const rows = [
    ['Aluno', certificate.studentName],
    ['Curso', certificate.courseTitle],
    ['Instituição', certificate.institution],
    ['Carga horária', `${certificate.workloadHours} horas`],
    ['Tipo de certificado', certificate.certificateType],
    ['Conclusão', formatDate(certificate.completedAt)],
    ['Emissão', formatDate(certificate.issuedAt)],
    ['Código', certificate.code],
  ];
  if (certificate.status === 'revoked') rows.push(['Revogado em', formatDate(certificate.revokedAt)]);

  rows.forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'certificate-verification-page__detail';
    item.append(
      createTextElement('dt', '', label),
      createTextElement('dd', '', value),
    );
    list.append(item);
  });
  return list;
}

function createValidResult(certificate) {
  const article = document.createElement('article');
  article.className = `certificate-verification-page__result-card certificate-verification-page__result-card--${certificate.status}`;
  article.append(
    createStatus(certificate.status),
    createTextElement('h2', '', certificate.courseTitle),
    createDefinitionList(certificate),
    createTextElement(
      'p',
      'certificate-verification-page__result-note',
      certificate.status === 'valid'
        ? 'Certificado autêntico no registro demonstrativo da CareerTech.'
        : 'Em caso de dúvidas, procure a instituição emissora.',
    ),
  );
  return article;
}

function createNotFoundResult(code) {
  const article = document.createElement('article');
  article.className = 'certificate-verification-page__result-card certificate-verification-page__result-card--not-found';
  const icon = createTextElement('span', 'certificate-verification-page__not-found-icon', '?');
  icon.setAttribute('aria-hidden', 'true');
  article.append(
    icon,
    createTextElement('h2', '', 'Certificado não encontrado'),
    createTextElement(
      'p',
      '',
      `Não encontramos um certificado para o código ${code}. Confira os caracteres e tente novamente.`,
    ),
    createTextElement('p', 'certificate-verification-page__result-note', 'Se o problema continuar, entre em contato com a instituição que emitiu o documento.'),
  );
  return article;
}

export default {
  title: 'Verificar certificado',
  html,

  mount(root, ctx) {
    const form = root.querySelector('[data-verification-form]');
    const input = root.querySelector('[data-verification-code]');
    const message = root.querySelector('[data-verification-message]');
    const submit = root.querySelector('[data-verification-submit]');
    const submitLabel = root.querySelector('[data-verification-submit-label]');
    const spinner = root.querySelector('[data-verification-spinner]');
    const result = root.querySelector('[data-verification-result]');
    const demo = root.querySelector('[data-verification-demo]');
    let active = true;
    let loading = false;

    function setMessage(text = '') {
      message.textContent = text;
      input.toggleAttribute('aria-invalid', Boolean(text));
    }

    function setLoading(state) {
      loading = state;
      submit.disabled = state;
      submit.setAttribute('aria-busy', String(state));
      submitLabel.textContent = state ? 'Verificando...' : 'Verificar certificado';
      spinner.hidden = !state;
    }

    async function runVerification(rawCode) {
      if (loading) return;
      const code = String(rawCode ?? '').trim();
      setMessage();
      if (!code) {
        setMessage('Informe o código do certificado para continuar.');
        input.focus();
        return;
      }
      if (code.length < 6) {
        setMessage('O código informado é muito curto. Confira o documento.');
        input.focus();
        return;
      }

      setLoading(true);
      result.hidden = true;
      result.replaceChildren();
      try {
        const certificate = await verifyCertificate(code);
        if (!active) return;
        result.replaceChildren(
          certificate ? createValidResult(certificate) : createNotFoundResult(code.toUpperCase()),
        );
        result.hidden = false;
      } catch (cause) {
        console.error('Erro ao verificar certificado:', cause);
        if (!active) return;
        setMessage('Não foi possível consultar o certificado agora. Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    }

    const onSubmit = (event) => {
      event.preventDefault();
      runVerification(input.value);
    };
    const onInput = () => {
      if (message.textContent) setMessage();
    };
    const onDemo = () => {
      input.value = demo.textContent.trim();
      setMessage();
      runVerification(input.value);
    };

    form.addEventListener('submit', onSubmit);
    input.addEventListener('input', onInput);
    demo.addEventListener('click', onDemo);

    const code = ctx?.params?.code;
    if (code) {
      input.value = code;
      runVerification(code);
    } else {
      input.focus();
    }

    return () => {
      active = false;
      form.removeEventListener('submit', onSubmit);
      input.removeEventListener('input', onInput);
      demo.removeEventListener('click', onDemo);
    };
  },
};
