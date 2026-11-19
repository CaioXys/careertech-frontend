import html from './jobs.html?raw';
import './jobs.css';
import { auth } from '../../../core/auth.js';
import { listJobs } from '../../../services/jobs.service.js';
import { readCareerQuiz } from '../../../utils/career-quiz-storage.js';
import { toastInfo, toastSuccess } from '../../../core/toast.js';

const interestLabels = {
  pratico: 'Prático e realizador',
  investigativo: 'Investigativo e curioso',
  criativo: 'Criativo e expressivo',
  social: 'Colaborativo e cuidador',
  empreendedor: 'Empreendedor e articulador',
  organizado: 'Organizado e planejador',
};

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createHeartIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shape.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z');
  shape.setAttribute('fill', 'none');
  shape.setAttribute('stroke', 'currentColor');
  shape.setAttribute('stroke-width', '1.8');
  shape.setAttribute('stroke-linejoin', 'round');
  icon.append(shape);
  return icon;
}

function parseDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isJobOpen(job) {
  if (job.status !== 'open') return false;
  const expiresAt = parseDate(job.expiresAt);
  return !expiresAt || expiresAt.getTime() >= Date.now();
}

function formatPostedDate(value) {
  const date = parseDate(value);
  if (!date) return 'Data não informada';
  const days = Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return 'Publicada hoje';
  if (days === 1) return 'Publicada ontem';
  return `Publicada há ${days} dias`;
}

function topInterest() {
  const quiz = readCareerQuiz(auth.getUser());
  if (!quiz?.scores || !Object.keys(quiz.scores).length) return null;
  return Object.entries(quiz.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildMeta(job) {
  return [job.area, job.level, job.location, job.contract, job.salary].filter(Boolean);
}

export default {
  title: 'Vagas',
  html,

  mount(root) {
    const search = root.querySelector('[data-jobs-search]');
    const area = root.querySelector('[data-jobs-area]');
    const level = root.querySelector('[data-jobs-level]');
    const location = root.querySelector('[data-jobs-location]');
    const clear = root.querySelector('[data-jobs-clear]');
    const count = root.querySelector('[data-jobs-count]');
    const loading = root.querySelector('[data-jobs-loading]');
    const error = root.querySelector('[data-jobs-error]');
    const retry = root.querySelector('[data-jobs-retry]');
    const empty = root.querySelector('[data-jobs-empty]');
    const list = root.querySelector('[data-jobs-list]');
    const recommendation = root.querySelector('[data-jobs-recommendation]');
    const recommendationTitle = root.querySelector('[data-jobs-recommendation-title]');
    const recommendationCopy = root.querySelector('[data-jobs-recommendation-copy]');
    const recommendedToggle = root.querySelector('[data-jobs-recommended-toggle]');
    const dialog = root.querySelector('[data-job-dialog]');
    const dialogFeedback = root.querySelector('[data-job-dialog-feedback]');
    const dialogFavorite = root.querySelector('[data-job-favorite]');
    const dialogApply = root.querySelector('[data-job-apply]');
    const dialogExternal = root.querySelector('[data-job-external]');
    const dialogClose = root.querySelector('[data-job-close]');
    const interest = topInterest();
    const favorites = new Set();
    const applied = new Set();
    let jobs = [];
    let currentJob = null;
    let recommendedOnly = false;
    let active = true;
    let applyTimer = null;

    function recommendedJobs() {
      if (interest) {
        return jobs.filter((job) => job.personalityFits?.includes(interest));
      }
      return jobs.filter((job) => job.featured);
    }

    function visibleJobs() {
      const term = normalize(search.value);
      const selectedArea = normalize(area.value);
      const selectedLevel = normalize(level.value);
      const selectedLocation = normalize(location.value);
      const recommendedIds = new Set(recommendedJobs().map((job) => job.id));

      return jobs
        .filter((job) => {
          if (!isJobOpen(job)) return false;
          if (recommendedOnly && !recommendedIds.has(job.id)) return false;
          if (selectedArea && normalize(job.area) !== selectedArea) return false;
          if (selectedLevel && normalize(job.level) !== selectedLevel) return false;
          if (selectedLocation && normalize(job.location) !== selectedLocation) return false;
          if (!term) return true;
          return normalize([
            job.title,
            job.company,
            job.area,
            job.level,
            job.location,
            job.summary,
            ...(job.skills ?? []),
          ].join(' ')).includes(term);
        })
        .sort((a, b) => {
          const recommendedA = recommendedIds.has(a.id) ? 1 : 0;
          const recommendedB = recommendedIds.has(b.id) ? 1 : 0;
          if (recommendedA !== recommendedB) return recommendedB - recommendedA;
          if (Boolean(a.featured) !== Boolean(b.featured)) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          return String(b.postedAt).localeCompare(String(a.postedAt));
        });
    }

    function updateFavoriteButton(button, job) {
      const saved = favorites.has(job.id);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remover dos favoritos' : 'Favoritar'}: ${job.title}`);
      button.classList.toggle('jobs-page__save--active', saved);
      const label = button.querySelector('span');
      if (label) label.textContent = saved ? 'Salva' : 'Salvar';
    }

    function toggleFavorite(job, button) {
      if (favorites.has(job.id)) {
        favorites.delete(job.id);
        toastInfo('Vaga removida dos favoritos.');
      } else {
        favorites.add(job.id);
        toastSuccess('Vaga salva com sucesso.');
      }
      if (button) updateFavoriteButton(button, job);
      if (currentJob?.id === job.id) updateDialogFavorite();
    }

    function createJobCard(job, recommendedIds) {
      const card = document.createElement('article');
      card.className = `jobs-page__card${recommendedIds.has(job.id) ? ' jobs-page__card--recommended' : ''}`;

      const header = document.createElement('header');
      header.className = 'jobs-page__card-header';
      const logo = createTextElement('span', 'jobs-page__company-logo', job.companyInitials || job.company.slice(0, 2));
      logo.setAttribute('aria-hidden', 'true');
      const heading = document.createElement('div');
      heading.className = 'jobs-page__card-heading';
      heading.append(
        createTextElement('h3', '', job.title),
        createTextElement('p', '', job.company),
      );
      const save = document.createElement('button');
      save.className = 'jobs-page__save';
      save.type = 'button';
      save.append(createHeartIcon(), createTextElement('span', '', 'Salvar'));
      updateFavoriteButton(save, job);
      save.addEventListener('click', () => toggleFavorite(job, save));
      header.append(logo, heading, save);

      const tags = document.createElement('ul');
      tags.className = 'jobs-page__tags';
      [job.area, job.level, job.location].filter(Boolean).forEach((tag) => {
        const item = document.createElement('li');
        item.textContent = tag;
        tags.append(item);
      });

      if (recommendedIds.has(job.id)) {
        const badge = document.createElement('li');
        badge.className = 'jobs-page__recommended-badge';
        badge.textContent = 'Recomendada para você';
        tags.append(badge);
      }

      const summary = createTextElement('p', 'jobs-page__summary', job.summary);
      const skills = document.createElement('ul');
      skills.className = 'jobs-page__skill-list';
      (job.skills ?? []).slice(0, 4).forEach((skill) => {
        const item = document.createElement('li');
        item.textContent = skill;
        skills.append(item);
      });

      if (job.teacherReferral) {
        const referral = document.createElement('p');
        referral.className = 'jobs-page__card-referral';
        referral.append(
          createTextElement('strong', '', 'Indicação de professor'),
          document.createTextNode(` · ${job.teacherReferral.name}`),
        );
        card.append(header, tags, summary, skills, referral);
      } else {
        card.append(header, tags, summary, skills);
      }

      const footer = document.createElement('footer');
      footer.className = 'jobs-page__card-footer';
      const footerInfo = document.createElement('div');
      footerInfo.className = 'jobs-page__card-footer-info';
      footerInfo.append(
        createTextElement('strong', '', job.salary || 'Salário não informado'),
        createTextElement('span', '', `${formatPostedDate(job.postedAt)} · ${job.contract || 'Contrato não informado'}`),
      );
      const details = document.createElement('button');
      details.className = 'jobs-page__details';
      details.type = 'button';
      details.textContent = 'Ver detalhes';
      details.addEventListener('click', () => openJob(job, details));
      footer.append(footerInfo, details);
      card.append(footer);

      return card;
    }

    function render() {
      const recommendedIds = new Set(recommendedJobs().map((job) => job.id));
      const items = visibleJobs();
      list.replaceChildren(...items.map((job) => createJobCard(job, recommendedIds)));
      list.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      error.hidden = true;
      count.textContent = `${items.length} ${items.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}`;
      empty.hidden = items.length > 0;
      empty.textContent = recommendedOnly
        ? 'Nenhuma vaga recomendada corresponde aos filtros selecionados.'
        : 'Nenhuma vaga corresponde aos filtros selecionados. Tente buscar por outro termo.';
      clear.hidden = !search.value && !area.value && !level.value && !location.value && !recommendedOnly;
      updateRecommendedPanel();
    }

    function updateRecommendedPanel() {
      const recommended = recommendedJobs().filter(isJobOpen);
      recommendation.hidden = recommended.length === 0;
      recommendationTitle.textContent = `${recommended.length} ${recommended.length === 1 ? 'vaga recomendada' : 'vagas recomendadas'} para você`;
      recommendationCopy.textContent = interest
        ? `Seu perfil ${interestLabels[interest] ?? 'vocacional'} combina com estas oportunidades.`
        : 'Separei oportunidades em destaque para você começar a explorar.';
      recommendedToggle.setAttribute('aria-pressed', String(recommendedOnly));
      recommendedToggle.textContent = recommendedOnly ? 'Ver todas as vagas' : 'Ver recomendadas';
    }

    function fillSelect(select, values) {
      values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.append(option);
      });
    }

    function fillFilters() {
      const openJobs = jobs.filter(isJobOpen);
      fillSelect(area, [...new Set(openJobs.map((job) => job.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
      fillSelect(level, [...new Set(openJobs.map((job) => job.level).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
      fillSelect(location, [...new Set(openJobs.map((job) => job.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }

    function createListItems(values, fallback = 'Não informado.') {
      if (!values?.length) return [createTextElement('li', '', fallback)];
      return values.map((value) => createTextElement('li', '', value));
    }

    function updateDialogFavorite() {
      if (!currentJob) return;
      updateFavoriteButton(dialogFavorite, currentJob);
      dialogFavorite.querySelector('svg')?.remove();
      dialogFavorite.prepend(createHeartIcon());
    }

    function updateDialogApply() {
      if (!currentJob) return;
      const isApplied = applied.has(currentJob.id);
      dialogApply.disabled = isApplied;
      dialogApply.textContent = isApplied ? 'Candidatura enviada' : 'Candidatar-se';
      dialogFeedback.textContent = isApplied ? 'Sua candidatura demonstrativa foi registrada neste protótipo.' : '';
    }

    function openJob(job, trigger) {
      if (!dialog.open) dialog.dataset.triggerId = trigger?.id ?? '';
      currentJob = job;
      dialogFeedback.textContent = '';
      root.querySelector('[data-job-dialog-initials]').textContent = job.companyInitials || job.company.slice(0, 2);
      root.querySelector('[data-job-dialog-area]').textContent = `${job.area} · ${job.level}`;
      root.querySelector('[data-job-dialog-title]').textContent = job.title;
      root.querySelector('[data-job-dialog-company]').textContent = job.company;
      root.querySelector('[data-job-dialog-summary]').textContent = job.summary;
      root.querySelector('[data-job-dialog-description]').textContent = job.description;

      const meta = root.querySelector('[data-job-dialog-meta]');
      meta.replaceChildren(...buildMeta(job).map((value) => createTextElement('li', '', value)));
      root.querySelector('[data-job-dialog-responsibilities]').replaceChildren(...createListItems(job.responsibilities, 'Responsabilidades não informadas.'));
      root.querySelector('[data-job-dialog-requirements]').replaceChildren(...createListItems(job.requirements, 'Requisitos não informados.'));
      root.querySelector('[data-job-dialog-desirable]').replaceChildren(...createListItems(job.desirable, 'Nenhum diferencial informado.'));
      root.querySelector('[data-job-dialog-desirable-section]').hidden = !job.desirable?.length;
      root.querySelector('[data-job-dialog-benefits]').replaceChildren(...createListItems(job.benefits, 'Benefícios não informados.'));
      root.querySelector('[data-job-dialog-skills]').replaceChildren(
        ...(job.skills ?? []).map((skill) => createTextElement('span', '', skill)),
      );

      const referral = root.querySelector('[data-job-dialog-referral]');
      referral.hidden = !job.teacherReferral;
      if (job.teacherReferral) {
        root.querySelector('[data-job-dialog-referral-name]').textContent = job.teacherReferral.name;
        root.querySelector('[data-job-dialog-referral-note]').textContent = job.teacherReferral.note;
      }

      updateDialogFavorite();
      updateDialogApply();
      dialog.showModal();
      document.body.classList.add('jobs-dialog-open');
      dialogClose.focus();
    }

    function closeDialog() {
      if (!dialog.open) return;
      dialog.close();
    }

    async function loadJobs() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      recommendation.hidden = true;
      count.textContent = '';
      list.replaceChildren();
      list.setAttribute('aria-busy', 'true');

      try {
        jobs = await listJobs();
        if (!active) return;
        fillFilters();
        loading.hidden = true;
        render();
      } catch (cause) {
        console.error('Erro ao carregar vagas:', cause);
        if (!active) return;
        loading.hidden = true;
        error.hidden = false;
        list.setAttribute('aria-busy', 'false');
      }
    }

    const onFilterChange = () => render();
    const onClear = () => {
      search.value = '';
      area.value = '';
      level.value = '';
      location.value = '';
      recommendedOnly = false;
      render();
    };
    const onRecommendedToggle = () => {
      recommendedOnly = !recommendedOnly;
      render();
    };
    const onDialogClose = () => {
      clearTimeout(applyTimer);
      document.body.classList.remove('jobs-dialog-open');
      currentJob = null;
    };
    const onDialogBackdrop = (event) => {
      if (event.target === dialog) closeDialog();
    };
    const onDialogFavorite = () => {
      if (currentJob) toggleFavorite(currentJob, null);
    };
    const onDialogApply = () => {
      if (!currentJob || applied.has(currentJob.id)) return;
      clearTimeout(applyTimer);
      dialogApply.disabled = true;
      dialogApply.setAttribute('aria-busy', 'true');
      dialogApply.textContent = 'Enviando candidatura...';
      dialogFeedback.textContent = '';
      const job = currentJob;
      applyTimer = setTimeout(() => {
        dialogApply.removeAttribute('aria-busy');
        applied.add(job.id);
        updateDialogApply();
        toastSuccess('Candidatura simulada com sucesso.');
      }, 700);
    };
    const onDialogExternal = () => {
      if (!currentJob) return;
      toastInfo('Link externo demonstrativo. Nenhum redirecionamento real será feito.', { duration: 5200 });
      dialogFeedback.textContent = `Link externo da vaga: ${currentJob.externalUrl}`;
    };

    search.addEventListener('input', onFilterChange);
    area.addEventListener('change', onFilterChange);
    level.addEventListener('change', onFilterChange);
    location.addEventListener('change', onFilterChange);
    clear.addEventListener('click', onClear);
    recommendedToggle.addEventListener('click', onRecommendedToggle);
    retry.addEventListener('click', loadJobs);
    dialogClose.addEventListener('click', closeDialog);
    dialog.addEventListener('click', onDialogBackdrop);
    dialog.addEventListener('close', onDialogClose);
    dialogFavorite.addEventListener('click', onDialogFavorite);
    dialogApply.addEventListener('click', onDialogApply);
    dialogExternal.addEventListener('click', onDialogExternal);
    loadJobs();

    return () => {
      active = false;
      clearTimeout(applyTimer);
      document.body.classList.remove('jobs-dialog-open');
      search.removeEventListener('input', onFilterChange);
      area.removeEventListener('change', onFilterChange);
      level.removeEventListener('change', onFilterChange);
      location.removeEventListener('change', onFilterChange);
      clear.removeEventListener('click', onClear);
      recommendedToggle.removeEventListener('click', onRecommendedToggle);
      retry.removeEventListener('click', loadJobs);
      dialogClose.removeEventListener('click', closeDialog);
      dialog.removeEventListener('click', onDialogBackdrop);
      dialog.removeEventListener('close', onDialogClose);
      dialogFavorite.removeEventListener('click', onDialogFavorite);
      dialogApply.removeEventListener('click', onDialogApply);
      dialogExternal.removeEventListener('click', onDialogExternal);
    };
  },
};
