import html from './certifications.html?raw';
import './certifications.css';
import { auth } from '../../../core/auth.js';
import { listCourses } from '../../../services/courses.service.js';

const classroomLimit = 6;
const inProgressValues = [75, 55, 35, 20];
const certificatePlaceholderImage = '/images/certifications/certificate-cover-placeholder.webp';

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  return element;
}

function appendCertificateText(svg, text, y, fontSize, fill, fontWeight) {
  const label = createSvgElement('text', {
    x: '600',
    y: String(y),
    fill,
    'font-family': 'Inter, Arial, sans-serif',
    'font-size': String(fontSize),
    'font-weight': String(fontWeight),
    'text-anchor': 'middle',
  });
  label.textContent = text;
  svg.append(label);
}

function normalizeFilename(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'curso';
}

function createCertificateSvg(course) {
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(name).trim();
  const svg = createSvgElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '1200',
    height: '850',
    viewBox: '0 0 1200 850',
  });

  svg.append(
    createSvgElement('rect', {
      x: '24',
      y: '24',
      width: '1152',
      height: '802',
      rx: '24',
      fill: token('--surface'),
      stroke: token('--action'),
      'stroke-width': '4',
    }),
    createSvgElement('path', {
      d: 'M160 205h880',
      fill: 'none',
      stroke: token('--line'),
      'stroke-width': '2',
    }),
  );

  const userName = auth.getUser()?.name;
  const learnerName = typeof userName === 'string' && userName.trim()
    ? userName.trim()
    : 'Estudante CareerTech';
  const issueDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());

  appendCertificateText(svg, 'CAREERTECH', 150, 30, token('--action'), 600);
  appendCertificateText(svg, 'CERTIFICADO DE CONCLUSÃO', 315, 42, token('--ink'), 600);
  appendCertificateText(svg, 'Certificamos que', 410, 24, token('--text-2'), 400);
  appendCertificateText(svg, learnerName, 490, 38, token('--ink'), 600);
  appendCertificateText(svg, 'concluiu com êxito o curso', 565, 24, token('--text-2'), 400);
  appendCertificateText(svg, course.title, 635, 30, token('--action'), 600);
  appendCertificateText(svg, `Emitido em ${issueDate}`, 745, 18, token('--muted'), 400);

  return svg;
}

function downloadCertificate(course) {
  const svg = new XMLSerializer().serializeToString(createCertificateSvg(course));
  const file = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `certificado-${normalizeFilename(course.title)}.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createLockIcon() {
  const icon = createSvgElement('svg', {
    viewBox: '0 0 48 48',
    'aria-hidden': 'true',
  });
  icon.append(
    createSvgElement('path', { d: 'M15 21v-6a9 9 0 0 1 18 0v6' }),
    createSvgElement('rect', { x: '10', y: '21', width: '28', height: '21', rx: '4' }),
    createSvgElement('path', { d: 'M24 29v5' }),
  );
  return icon;
}

function createDownloadIcon() {
  const icon = createSvgElement('svg', {
    viewBox: '0 0 48 48',
    'aria-hidden': 'true',
  });
  icon.append(
    createSvgElement('path', { d: 'M24 7v23m-9-9 9 9 9-9' }),
    createSvgElement('path', { d: 'M10 34v6h28v-6' }),
  );
  return icon;
}

function createCertificateCard(certificate) {
  const { course, status, progress } = certificate;
  const completed = status === 'completed';
  const card = document.createElement('article');
  card.className = `certifications-page__card${completed ? '' : ' certifications-page__card--progress'}`;
  if (!completed) card.tabIndex = 0;

  const cover = document.createElement('div');
  cover.className = `certifications-page__cover${completed ? '' : ' certifications-page__cover--locked'}`;
  const image = document.createElement('img');
  image.src = certificatePlaceholderImage;
  image.alt = `Imagem ilustrativa do certificado de ${course.title}`;
  image.loading = 'lazy';
  image.decoding = 'async';

  const coverInfo = document.createElement('div');
  coverInfo.className = 'certifications-page__cover-info';
  coverInfo.append(
    createTextElement(
      'span',
      `certifications-page__status${completed ? '' : ' certifications-page__status--progress'}`,
      completed ? 'Concluído' : 'Em progresso',
    ),
  );

  if (!completed) {
    const progressSection = document.createElement('div');
    progressSection.className = 'certifications-page__progress';
    const progressCopy = document.createElement('div');
    progressCopy.className = 'certifications-page__progress-copy';
    progressCopy.append(createTextElement('strong', '', `${progress}%`));

    const progressTrack = document.createElement('div');
    progressTrack.className = 'certifications-page__progress-track';
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-label', `Progresso no curso ${course.title}`);
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.setAttribute('aria-valuenow', String(progress));
    const progressFill = document.createElement('span');
    progressFill.style.width = `${progress}%`;
    progressTrack.append(progressFill);
    progressSection.append(progressCopy, progressTrack);
    coverInfo.append(progressSection);
  }

  cover.append(image, coverInfo);
  if (!completed) {
    const lock = document.createElement('span');
    lock.className = 'certifications-page__lock';
    lock.setAttribute('role', 'img');
    lock.setAttribute('aria-label', 'Certificado bloqueado até a conclusão do curso');
    lock.append(createLockIcon());
    cover.append(lock);
  }
  cover.append(createTextElement('h2', 'certifications-page__cover-title', course.title));

  if (completed) {
    const download = document.createElement('button');
    download.className = 'certifications-page__download';
    download.type = 'button';
    download.setAttribute('aria-label', `Baixar certificado de ${course.title}`);
    download.append(createDownloadIcon());
    download.addEventListener('click', () => downloadCertificate(course));
    cover.append(download);
  }

  card.append(cover);
  return card;
}

export default {
  title: 'Meus certificados',
  html,

  mount(root) {
    const filters = root.querySelector('[data-certificate-filters]');
    const filterButtons = [...root.querySelectorAll('[data-certificate-filter]')];
    const loading = root.querySelector('[data-certificate-loading]');
    const error = root.querySelector('[data-certificate-error]');
    const retry = root.querySelector('[data-certificate-retry]');
    const empty = root.querySelector('[data-certificate-empty]');
    const list = root.querySelector('[data-certificate-list]');
    const counts = {
      all: root.querySelector('[data-certificate-count="all"]'),
      completed: root.querySelector('[data-certificate-count="completed"]'),
      progress: root.querySelector('[data-certificate-count="progress"]'),
    };
    let active = true;
    let certificates = [];
    let currentFilter = 'all';

    function render() {
      const visibleCertificates = certificates.filter((certificate) =>
        currentFilter === 'all' || certificate.status === currentFilter,
      );
      list.replaceChildren(...visibleCertificates.map(createCertificateCard));
      list.setAttribute('aria-busy', 'false');
      empty.textContent = certificates.length
        ? 'Não há certificados nesta categoria.'
        : 'Nenhum certificado disponível no momento.';
      empty.hidden = visibleCertificates.length > 0;
    }

    function selectFilter(event) {
      currentFilter = event.currentTarget.dataset.certificateFilter;
      filterButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button === event.currentTarget));
      });
      render();
    }

    async function loadCertificates() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      filters.hidden = true;
      list.replaceChildren();
      list.setAttribute('aria-busy', 'true');

      try {
        const courses = await listCourses();
        if (!active) return;

        const progressValues = inProgressValues;
        certificates = courses.slice(0, classroomLimit).map((course, index) => {
          const completed = index < 2;
          return {
            course,
            status: completed ? 'completed' : 'progress',
            progress: completed ? null : progressValues[index - 2],
          };
        });

        counts.all.textContent = String(certificates.length);
        counts.completed.textContent = String(
          certificates.filter(({ status }) => status === 'completed').length,
        );
        counts.progress.textContent = String(
          certificates.filter(({ status }) => status === 'progress').length,
        );
        filters.hidden = certificates.length === 0;
        loading.hidden = true;
        render();
      } catch (cause) {
        console.error('Erro ao carregar certificados:', cause);
        if (!active) return;
        loading.hidden = true;
        list.setAttribute('aria-busy', 'false');
        error.hidden = false;
      }
    }

    filterButtons.forEach((button) => button.addEventListener('click', selectFilter));
    retry.addEventListener('click', loadCertificates);
    loadCertificates();

    return () => {
      active = false;
      filterButtons.forEach((button) => button.removeEventListener('click', selectFilter));
      retry.removeEventListener('click', loadCertificates);
    };
  },
};
