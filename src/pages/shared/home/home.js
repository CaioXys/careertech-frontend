import html from './home.html?raw';
import './home.css';
import { auth } from '../../../core/auth.js';
import { navigate } from '../../../core/navigate.js';
import { getStudentHomeData } from '../../../services/student-home.service.js';

function write(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = String(value);
}

function updateRing(root, progress) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0));
  const circle = root.querySelector('[data-home-ring-value]');
  const ring = root.querySelector('[data-home-ring]');
  const circumference = 2 * Math.PI * 62;

  if (circle) {
    circle.style.strokeDasharray = String(circumference);
    circle.style.strokeDashoffset = String(circumference * (1 - value / 100));
  }

  ring?.setAttribute('aria-label', `${value}% da jornada concluída`);
  write(root, '[data-home-ring-label]', `${value}%`);
}

function renderCourses(root, courses) {
  const cards = Object.fromEntries(
    [...root.querySelectorAll('[data-home-course-card]')].map((card) => [card.dataset.courseSlot, card]),
  );

  Object.values(courses).forEach((item) => {
    const card = cards[item.slot];
    if (!card) return;

    card.href = `#/courses/${item.course.id}`;
    card.setAttribute(
      'aria-label',
      item.slot === 'current'
        ? `Continuar curso ${item.course.title}`
        : `Abrir curso ${item.course.title}`,
    );
    write(card, '[data-course-status]', item.status);
    write(card, '[data-course-title]', item.course.title);
    write(card, '[data-course-description]', item.course.description);
    write(card, '[data-course-meta]', item.meta);
    write(card, '[data-course-percent]', `${item.progress}%`);

    const track = card.querySelector('[data-course-track]');
    if (track) track.style.width = `${item.progress}%`;
  });
}

function renderCareers(root, careers) {
  write(root, '[data-home-affinity-source]', careers.source);

  root.querySelectorAll('[data-home-affinity]').forEach((row, index) => {
    const item = careers.items[index];
    if (!item) {
      row.hidden = true;
      return;
    }

    row.hidden = false;
    write(row, '[data-affinity-label]', item.label);
    write(row, '[data-affinity-value]', `${item.percent}% de afinidade`);

    const bar = row.querySelector('[data-affinity-bar]');
    if (bar) {
      bar.className = `home-page__affinity-value home-page__affinity-value--${item.tone}`;
      bar.style.width = `${item.percent}%`;
    }
  });
}

function renderActivities(root, activities) {
  root.querySelectorAll('[data-home-activity]').forEach((item, index) => {
    const activity = activities[index];
    if (!activity) {
      item.hidden = true;
      return;
    }

    item.hidden = false;
    write(item, '[data-activity-day]', activity.day);
    write(item, '[data-activity-weekday]', activity.weekday);
    write(item, '[data-activity-title]', activity.title);
    write(item, '[data-activity-meta]', activity.meta);
  });
}

function renderStudentHome(root, data) {
  write(root, '[data-home-trail-kicker]', data.trail.kicker);
  write(root, '[data-home-trail-title]', data.trail.title);
  write(root, '[data-home-trail-subtitle]', data.trail.subtitle);
  write(root, '[data-home-trail-course]', data.trail.courseTitle);
  write(root, '[data-home-trail-reward]', `+${data.trail.rewardXp} XP`);

  const continueLink = root.querySelector('[data-home-continue]');
  if (continueLink) continueLink.href = `#${data.trail.continueHref}`;

  updateRing(root, data.trail.progress);

  write(root, '[data-home-stat-xp]', `${data.stats.xp} XP`);
  write(root, '[data-home-stat-xp-note]', `Nível ${data.stats.level} · faltam ${data.stats.missingXp} XP`);
  write(root, '[data-home-stat-streak]', `${data.stats.streak} ${data.stats.streak === 1 ? 'dia' : 'dias'}`);
  write(root, '[data-home-stat-streak-note]', 'Estude hoje para manter');
  write(root, '[data-home-stat-study]', `${data.stats.studyHours}h`);
  write(root, '[data-home-stat-study-note]', 'nesta semana');
  write(root, '[data-home-stat-certificates]', data.stats.certificates);
  write(
    root,
    '[data-home-stat-certificates-note]',
    `${data.stats.certificatesInProgress} em andamento`,
  );

  renderCourses(root, data.courses);
  renderCareers(root, data.careers);
  renderActivities(root, data.activities);
}

export default {
  title: 'Início',
  html,

  mount(root) {
    const user = auth.getUser();
    const profile = user?.role === 'teacher' ? 'teacher' : 'student';
    const firstName = String(user?.name ?? '')
      .trim()
      .split(/\s+/)[0]
      .slice(0, 60);
    const name = firstName
      ? firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1)
      : profile === 'teacher' ? 'professor(a)' : 'estudante';

    root.querySelector('[data-home-name]').textContent = name;
    root.querySelector('[data-home-eyebrow]').textContent = profile === 'teacher'
      ? 'SEU ESPAÇO DE ENSINO'
      : 'SEU ESPAÇO DE APRENDIZAGEM';

    root.querySelectorAll('[data-home-profile]').forEach((section) => {
      section.hidden = section.dataset.homeProfile !== profile;
    });

    let active = true;

    if (profile === 'student') {
      getStudentHomeData(user)
        .then((data) => {
          if (active) renderStudentHome(root, data);
        })
        .catch((cause) => {
          console.error('Erro ao carregar dados da home:', cause);
        });
    }

    const searchForm = root.querySelector('[data-home-search]');
    const searchInput = searchForm?.querySelector('input');

    const handleSearch = (event) => {
      event.preventDefault();
      const term = searchInput?.value.trim() ?? '';
      navigate(term ? `/courses?busca=${encodeURIComponent(term)}` : '/courses');
    };

    searchForm?.addEventListener('submit', handleSearch);

    return () => {
      active = false;
      searchForm?.removeEventListener('submit', handleSearch);
    };
  },
};
