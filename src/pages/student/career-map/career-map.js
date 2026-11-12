import html from './career-map.html?raw';
import './career-map.css';
import { listCourses } from '../../../services/courses.service.js';
import { getDemoCourseProgress } from '../../../utils/course-progress.js';

const careerPaths = [
  { id: 'development', title: 'Desenvolvimento', aliases: ['desenvolvimento'], completed: 3 },
  { id: 'data', title: 'Banco de dados', aliases: ['dados', 'banco de dados'], completed: 2 },
  { id: 'infrastructure', title: 'Infraestrutura', aliases: ['infraestrutura'], completed: 1 },
];

const statusLabels = {
  completed: 'Concluído',
  progress: 'Em andamento',
  unavailable: 'Indisponível',
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
  element.className = className;
  element.textContent = text;
  return element;
}

function createCourseModule(course, index, status, progress, onSelect) {
  const item = document.createElement('li');
  item.className = 'career-map-page__step';

  const button = document.createElement('button');
  button.className = `career-map-page__module career-map-page__module--${status}`;
  button.type = 'button';
  button.dataset.courseId = String(course.id);
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', `${course.title}. ${statusLabels[status]}. ${progress}% de progresso.`);
  button.title = course.description || course.title;
  button.addEventListener('click', () => onSelect(course));

  const marker = createTextElement('span', 'career-map-page__module-marker', String(index + 1));
  marker.setAttribute('aria-hidden', 'true');
  const name = createTextElement('span', 'career-map-page__module-name', course.title);

  button.append(marker, name);
  item.append(button);
  return item;
}

function createPathSelector(path, selected, onSelect) {
  const button = document.createElement('button');
  button.className = `career-map-page__path-button career-map-page__path-button--${path.id}`;
  button.type = 'button';
  button.dataset.pathId = path.id;
  button.setAttribute('aria-label', `Mostrar trilha de ${path.title}`);
  button.setAttribute('aria-pressed', String(selected));
  button.title = path.title;
  button.addEventListener('click', () => onSelect(path));

  const dot = document.createElement('span');
  dot.className = 'career-map-page__path-dot';
  dot.setAttribute('aria-hidden', 'true');
  const tooltip = createTextElement('span', 'career-map-page__path-tooltip', path.title);
  tooltip.setAttribute('aria-hidden', 'true');
  button.append(dot, tooltip);
  return button;
}

function createPath(path, courses, onSelect) {
  const section = document.createElement('section');
  section.className = `career-map-page__track career-map-page__track--${path.id}`;
  section.setAttribute('aria-label', `Trilha de ${path.title}`);

  const heading = document.createElement('div');
  heading.className = 'career-map-page__track-heading';
  heading.append(
    createTextElement('h2', '', path.title),
    createTextElement('span', '', `${courses.length} cursos`),
  );

  const scroll = document.createElement('div');
  scroll.className = 'career-map-page__track-scroll';
  scroll.setAttribute('tabindex', '0');
  scroll.setAttribute('aria-label', `Cursos de ${path.title}; role horizontalmente para explorar`);

  const steps = document.createElement('ol');
  steps.className = 'career-map-page__steps';

  courses.forEach(({ course, status, progress }, index) => {
    steps.append(createCourseModule(course, index, status, progress, onSelect));
  });

  scroll.append(steps);
  section.append(heading, scroll);
  return section;
}

function createProgress(course, status, progress) {
  const section = document.createElement('div');
  section.className = 'career-map-page__progress';

  const label = document.createElement('div');
  label.className = 'career-map-page__progress-label';
  label.append(
    createTextElement('span', '', 'Progresso demonstrativo'),
    createTextElement('strong', '', `${progress}%`),
  );

  const track = document.createElement('div');
  track.className = 'career-map-page__progress-track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', `Progresso demonstrativo no curso ${course.title}`);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', String(progress));

  const fill = document.createElement('span');
  fill.style.width = `${progress}%`;
  if (status === 'unavailable') {
    fill.style.background = 'var(--surface-3)';
  }
  track.append(fill);
  section.append(label, track);
  return section;
}

function createCourseDetails(course, status, progress, pathTitle, pathId) {
  const article = document.createElement('article');
  article.className = 'career-map-page__detail-card';

  const heading = document.createElement('header');
  heading.className = 'career-map-page__detail-heading';

  const titleGroup = document.createElement('div');
  titleGroup.append(
    createTextElement('span', `career-map-page__area career-map-page__area--${pathId}`, pathTitle),
    createTextElement('h2', '', course.title),
  );

  heading.append(titleGroup);

  const description = createTextElement(
    'p',
    'career-map-page__description',
    course.longDescription || course.description || 'Descrição não disponível.',
  );

  const facts = document.createElement('ul');
  facts.className = 'career-map-page__facts';

  const hours = Number(course.workloadHours);
  const workload = Number.isFinite(hours) && hours > 0
    ? `${hours} ${hours === 1 ? 'hora' : 'horas'}`
    : 'Não informada';
  const teachers = Array.isArray(course.teachers) && course.teachers.length
    ? course.teachers.join(', ')
    : 'Não informados';

  const workloadFact = document.createElement('li');
  workloadFact.append(createTextElement('strong', '', 'Carga horária: '), document.createTextNode(workload));
  const teachersFact = document.createElement('li');
  teachersFact.append(createTextElement('strong', '', 'Instrutores: '), document.createTextNode(teachers));
  facts.append(workloadFact, teachersFact);

  const footer = document.createElement('div');
  footer.className = 'career-map-page__detail-footer';
  footer.append(
    createTextElement('p', 'career-map-page__demo-note', 'Progresso demonstrativo; os dados não representam uma conta real.'),
  );

  if (status === 'progress') {
    const continueLink = document.createElement('a');
    continueLink.className = 'career-map-page__details-link';
    continueLink.href = `#/courses/${encodeURIComponent(String(course.id))}`;
    continueLink.textContent = 'Continuar';
    footer.append(continueLink);
  } else if (status === 'unavailable') {
    const continueButton = document.createElement('button');
    continueButton.className = 'career-map-page__details-link';
    continueButton.type = 'button';
    continueButton.disabled = true;
    continueButton.textContent = 'Continuar';
    footer.append(continueButton);
  }

  article.append(heading, description, facts, createProgress(course, status, progress), footer);
  return article;
}

export default {
  title: 'Mapa de carreira',
  html,

  mount(root) {
    const switcher = root.querySelector('[data-career-map-switcher]');
    const pathOptions = root.querySelector('[data-career-map-options]');
    const journeys = root.querySelector('[data-career-map-journeys]');
    const loading = root.querySelector('[data-career-map-loading]');
    const error = root.querySelector('[data-career-map-error]');
    const retry = root.querySelector('[data-career-map-retry]');
    const empty = root.querySelector('[data-career-map-empty]');
    const detail = root.querySelector('[data-career-map-detail]');
    let active = true;
    let selectedCourseId = null;
    let selectedPathId = null;

    function selectCourse(course, tracks) {
      const selectedTrack = tracks.find((track) =>
        track.courses.some(({ course: trackCourse }) => String(trackCourse.id) === String(course.id)),
      );
      if (!selectedTrack) return;

      selectedCourseId = String(course.id);
      journeys.querySelectorAll('[data-course-id]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.courseId === selectedCourseId));
      });

      const selected = selectedTrack.courses.find(({ course: trackCourse }) =>
        String(trackCourse.id) === selectedCourseId,
      );
      detail.replaceChildren(createCourseDetails(
        selected.course,
        selected.status,
        selected.progress,
        selectedTrack.title,
        selectedTrack.id,
      ));
      detail.hidden = false;
    }

    function render(courses) {
      const groupedCourses = careerPaths.map((path) => ({
        ...path,
        courses: courses.filter((course) => {
          const area = normalize(course.type ?? course.area);
          return path.aliases.some((alias) => area === normalize(alias));
        }),
      }));
      const equalCourseCount = Math.min(...groupedCourses.map((path) => path.courses.length));

      if (equalCourseCount === 0) {
        switcher.hidden = true;
        pathOptions.replaceChildren();
        journeys.replaceChildren();
        journeys.setAttribute('aria-busy', 'false');
        journeys.hidden = true;
        empty.textContent = 'Não há cursos disponíveis para montar as trilhas no momento.';
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      switcher.hidden = false;
      journeys.hidden = false;
      const tracks = groupedCourses.map((path) => ({
        ...path,
        courses: path.courses.slice(0, equalCourseCount).map((course, index) => {
          const status = index < path.completed
            ? 'completed'
            : index === path.completed
              ? 'progress'
              : 'unavailable';
          const progress = status === 'completed'
            ? 100
            : status === 'progress'
              ? getDemoCourseProgress(course.id)
              : 0;
          return { course, status, progress };
        }),
      }));

      const onSelectCourse = (course) => selectCourse(course, tracks);
      const showPath = (path) => {
        selectedPathId = path.id;
        pathOptions.querySelectorAll('[aria-pressed]').forEach((button) => {
          button.setAttribute('aria-pressed', String(button.dataset.pathId === selectedPathId));
        });
        journeys.replaceChildren(createPath(path, path.courses, onSelectCourse));
        const selected = path.courses.find(({ course }) => String(course.id) === selectedCourseId)
          ?? path.courses.find(({ status }) => status === 'progress')
          ?? path.courses[0];
        selectCourse(selected.course, tracks);
      };

      pathOptions.replaceChildren(...tracks.map((path) =>
        createPathSelector(path, path.id === selectedPathId, showPath),
      ));
      journeys.setAttribute('aria-busy', 'false');

      const initialPath = tracks.find((path) => path.id === selectedPathId) ?? tracks[0];
      showPath(initialPath);
    }

    async function loadCourses() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      detail.hidden = true;
      switcher.hidden = true;
      pathOptions.replaceChildren();
      journeys.hidden = false;
      journeys.setAttribute('aria-busy', 'true');
      journeys.replaceChildren();

      try {
        const courses = await listCourses();
        if (!active) return;
        loading.hidden = true;
        render(courses);
      } catch (cause) {
        console.error('Erro ao carregar cursos para o mapa de carreira:', cause);
        if (!active) return;
        loading.hidden = true;
        journeys.replaceChildren();
        journeys.setAttribute('aria-busy', 'false');
        error.hidden = false;
      }
    }

    retry.addEventListener('click', loadCourses);
    loadCourses();

    return () => {
      active = false;
      retry.removeEventListener('click', loadCourses);
    };
  },
};
