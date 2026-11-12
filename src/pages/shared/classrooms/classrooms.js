import html from './classrooms.html?raw';
import './classrooms.css';
import { listCourses } from '../../../services/courses.service.js';
import { getDemoCourseProgress } from '../../../utils/course-progress.js';

const careerPaths = [
  { id: 'development', aliases: ['desenvolvimento'], completed: 3 },
  { id: 'data', aliases: ['dados', 'banco de dados'], completed: 2 },
  { id: 'infrastructure', aliases: ['infraestrutura'], completed: 1 },
];

const courseImages = {
  1: '/images/classrooms/course-01-fundamentos-computacao-logica.webp',
  2: '/images/classrooms/course-02-algoritmos-estruturas-dados.webp',
  3: '/images/classrooms/course-03-programacao-orientada-objetos.webp',
  4: '/images/classrooms/course-04-html-css-pratica.webp',
  5: '/images/classrooms/course-05-desenvolvimento-java.webp',
  6: '/images/classrooms/course-06-banco-dados-sql.webp',
};

const lessonDuration = 750;
const classroomLimit = 6;
const lessonTopics = [
  'Visão geral do curso',
  'Objetivos de aprendizagem',
  'Conceitos fundamentais',
  'Ambiente e ferramentas',
  'Primeiros passos',
  'Componentes principais',
  'Estrutura do conteúdo',
  'Prática guiada I',
  'Boas práticas',
  'Exemplos aplicados',
  'Resolução de problemas',
  'Prática guiada II',
  'Organização de projetos',
  'Validação de resultados',
  'Técnicas intermediárias',
  'Exercícios de consolidação',
  'Integração entre conceitos',
  'Estudo de caso I',
  'Análise de soluções',
  'Desenvolvimento de projeto I',
  'Refinamento e melhorias',
  'Testes e revisão',
  'Estudo de caso II',
  'Projeto prático II',
  'Desafios avançados',
  'Otimização de soluções',
  'Preparação da entrega',
  'Apresentação do projeto',
  'Revisão final',
  'Próximos passos',
];

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

function createCourseCover(course, area) {
  const cover = document.createElement('div');
  cover.className = `classrooms-page__cover classrooms-page__cover--${area}`;
  const imagePath = courseImages[course.id];
  if (imagePath) {
    const image = document.createElement('img');
    image.src = imagePath;
    image.alt = `Imagem do curso ${course.title}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    cover.append(image);
    return cover;
  }

  const image = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  image.setAttribute('viewBox', '0 0 96 96');
  image.setAttribute('aria-hidden', 'true');

  const shapes = {
    development: [
      ['rect', { x: '13', y: '18', width: '70', height: '54', rx: '7' }],
      ['path', { d: 'm37 34-10 11 10 11m22-22 10 11-10 11m-7-17-8 22' }],
      ['path', { d: 'M34 82h28m-14-10v10' }],
    ],
    data: [
      ['path', { d: 'M16 77h66M22 68V47h12v21m9 0V31h12v37m9 0V18h12v50' }],
      ['path', { d: 'm22 37 19-12 15 3 19-14' }],
      ['circle', { cx: '22', cy: '37', r: '3' }],
      ['circle', { cx: '41', cy: '25', r: '3' }],
      ['circle', { cx: '56', cy: '28', r: '3' }],
      ['circle', { cx: '75', cy: '14', r: '3' }],
    ],
    infrastructure: [
      ['rect', { x: '22', y: '15', width: '52', height: '22', rx: '5' }],
      ['rect', { x: '22', y: '59', width: '52', height: '22', rx: '5' }],
      ['path', { d: 'M32 37v11h32V37m-32 22V48m32 11V48' }],
      ['circle', { cx: '32', cy: '26', r: '2' }],
      ['circle', { cx: '32', cy: '70', r: '2' }],
    ],
  };

  for (const [tagName, attributes] of shapes[area]) {
    const shape = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
    image.append(shape);
  }

  cover.append(image);
  return cover;
}

function getCourseState(course, groupedCourses, progressByCourse) {
  const path = careerPaths.find(({ aliases }) =>
    aliases.some((alias) => normalize(alias) === normalize(course.type ?? course.area)),
  );
  const courseIndex = path
    ? groupedCourses[path.id].findIndex((item) => String(item.id) === String(course.id))
    : -1;

  if (!path || courseIndex < 0) return { progress: 0 };
  if (courseIndex < path.completed) {
    const courseId = String(course.id);
    if (!progressByCourse.has(courseId)) {
      progressByCourse.set(courseId, 65 + Math.floor(Math.random() * 31));
    }
    return { progress: progressByCourse.get(courseId) };
  }
  if (courseIndex === path.completed) return { progress: getDemoCourseProgress(course.id) };
  return { progress: 0 };
}

function getTeacherNames(course) {
  return Array.isArray(course.teachers) && course.teachers.length
    ? course.teachers.join(', ')
    : 'Professor não informado';
}

function getAverageRating(courseId, ratings) {
  if (!ratings.has(courseId)) {
    ratings.set(courseId, Number((3.5 + Math.random() * 1.5).toFixed(1)));
  }
  return ratings.get(courseId);
}

function createRatingDisplay(courseId, ratings) {
  const rating = getAverageRating(courseId, ratings);
  const display = document.createElement('div');
  display.className = 'classrooms-page__rating';
  display.setAttribute('role', 'img');
  display.setAttribute('aria-label', `Avaliação média ${rating.toLocaleString('pt-BR')} de 5 estrelas`);

  for (let index = 0; index < 5; index += 1) {
    const star = createTextElement('span', 'classrooms-page__rating-star', '★');
    star.classList.add(
      rating >= index + 1
        ? 'classrooms-page__rating-star--full'
        : rating >= index + 0.5
          ? 'classrooms-page__rating-star--half'
          : 'classrooms-page__rating-star--empty',
    );
    star.setAttribute('aria-hidden', 'true');
    display.append(star);
  }

  return display;
}

function createLessons(course, progress) {
  const lessonCount = 20 + Math.floor(Math.random() * 11);
  const lessons = lessonTopics.slice(0, lessonCount).map((topic) => ({
    title: topic,
    description: `${topic} no curso ${course.title}. ${course.description || ''}`.trim(),
  }));
  const currentIndex = Math.min(
    Math.floor((progress / 100) * lessonCount),
    lessonCount - 1,
  );
  return { lessons, currentIndex };
}

function createClassroomCard(course, progress, onSelect, ratings) {
  const area = normalize(course.type ?? course.area);
  const areaVariant = area.includes('infraestrutura')
    ? 'infrastructure'
    : area.includes('dado')
      ? 'data'
      : 'development';
  const courseId = String(course.id);
  const teacher = getTeacherNames(course);
  const card = document.createElement('article');
  card.className = 'classrooms-page__card';
  card.dataset.courseId = courseId;

  const title = createTextElement('h2', 'classrooms-page__card-title', course.title);
  const areaLabel = createTextElement('span', `classrooms-page__card-area classrooms-page__card-area--${areaVariant}`, course.type ?? course.area ?? 'Curso');
  const teacherLabel = createTextElement('p', 'classrooms-page__teacher', `Professor: ${teacher}`);

  const progressSection = document.createElement('div');
  progressSection.className = 'classrooms-page__progress';
  const progressCopy = document.createElement('div');
  progressCopy.className = 'classrooms-page__progress-copy';
  progressCopy.append(
    createTextElement('span', '', 'Progresso no curso'),
    createTextElement('strong', '', `${progress}%`),
  );

  const progressTrack = document.createElement('div');
  progressTrack.className = 'classrooms-page__progress-track';
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-label', `Progresso no curso ${course.title}`);
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', '100');
  progressTrack.setAttribute('aria-valuenow', String(progress));
  const progressFill = document.createElement('span');
  progressFill.style.width = `${progress}%`;
  progressTrack.append(progressFill);
  progressSection.append(progressCopy, progressTrack);

  const footer = document.createElement('div');
  footer.className = 'classrooms-page__card-footer';
  footer.append(progressSection);
  const accessLabel = document.createElement('button');
  accessLabel.className = 'classrooms-page__access';
  accessLabel.type = 'button';
  accessLabel.setAttribute('aria-controls', 'classroom-room');
  accessLabel.setAttribute('aria-expanded', 'false');
  accessLabel.append(
    createTextElement('span', '', 'Acessar sala'),
    createTextElement('span', '', '→'),
  );
  footer.append(accessLabel);

  const content = document.createElement('div');
  content.className = 'classrooms-page__card-content';
  content.append(areaLabel, title, teacherLabel, footer);
  const visual = document.createElement('div');
  visual.className = 'classrooms-page__visual';
  visual.append(createCourseCover(course, areaVariant), createRatingDisplay(courseId, ratings));
  card.append(visual, content);

  card.addEventListener('click', () => onSelect(course, card, progress));
  return card;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default {
  title: 'Salas de aula',
  html,

  mount(root) {
    const list = root.querySelector('[data-classrooms-list]');
    const loading = root.querySelector('[data-classrooms-loading]');
    const error = root.querySelector('[data-classrooms-error]');
    const retry = root.querySelector('[data-classrooms-retry]');
    const searchWrap = root.querySelector('[data-classrooms-search-wrap]');
    const search = root.querySelector('[data-classrooms-search]');
    const empty = root.querySelector('[data-classrooms-empty]');
    const room = root.querySelector('[data-classroom-room]');
    const roomTitle = root.querySelector('[data-classroom-title]');
    const roomTeacher = root.querySelector('[data-classroom-teacher]');
    const lessonList = root.querySelector('[data-classroom-lessons]');
    const lessonNumber = root.querySelector('[data-classroom-lesson-number]');
    const lessonTitle = root.querySelector('[data-classroom-lesson-title]');
    const descriptionTitle = root.querySelector('[data-classroom-description-title]');
    const description = root.querySelector('[data-classroom-description]');
    const lessonPosition = root.querySelector('[data-classroom-lesson-position]');
    const previousLessonButton = root.querySelector('[data-classroom-previous]');
    const nextLessonButton = root.querySelector('[data-classroom-next]');
    const playerState = root.querySelector('[data-classroom-player-state]');
    const playButton = root.querySelector('[data-classroom-play]');
    const playIcon = root.querySelector('[data-classroom-play-icon]');
    const timeline = root.querySelector('[data-classroom-timeline]');
    const timeLabel = root.querySelector('[data-classroom-time]');
    const closeButton = root.querySelector('[data-classroom-close]');
    let active = true;
    let playbackTimer = null;
    let currentTime = 0;
    let availableCourses = [];
    let groupedCourses = {};
    let selectedCourseId = null;
    let activeLessonData = null;
    let currentLessonIndex = 0;
    const averageRatings = new Map();
    const progressByCourse = new Map();
    const lessonsByCourse = new Map();

    function updatePlayback() {
      timeline.value = String(currentTime);
      timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(lessonDuration)}`;
    }

    function pausePlayback() {
      if (playbackTimer !== null) {
        window.clearInterval(playbackTimer);
        playbackTimer = null;
      }
      playButton.setAttribute('aria-label', 'Reproduzir prévia');
      playIcon.textContent = '▶';
      playerState.textContent = 'Prévia pausada';
    }

    function renderLessons() {
      lessonList.replaceChildren();
      activeLessonData.lessons.forEach((lesson, index) => {
        const status = index < currentLessonIndex
          ? 'completed'
          : index === currentLessonIndex
            ? 'current'
            : 'upcoming';
        const statusLabel = status === 'completed'
          ? 'Concluída'
          : status === 'current'
            ? 'Aula atual'
            : 'Próxima';
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.className = `classrooms-page__lesson-item classrooms-page__lesson-item--${status}`;
        button.type = 'button';
        button.setAttribute('aria-label', `Aula ${index + 1}. ${lesson.title}. ${statusLabel}`);
        if (status === 'current') button.setAttribute('aria-current', 'step');
        button.append(
          createTextElement('span', 'classrooms-page__lesson-number', String(index + 1).padStart(2, '0')),
          createTextElement('span', 'classrooms-page__lesson-title', lesson.title),
        );
        button.addEventListener('click', () => setCurrentLesson(index));
        item.append(button);
        lessonList.append(item);
      });

      lessonPosition.textContent = `Aula ${currentLessonIndex + 1} de ${activeLessonData.lessons.length}`;
      previousLessonButton.disabled = currentLessonIndex === 0;
      nextLessonButton.disabled = currentLessonIndex === activeLessonData.lessons.length - 1;
    }

    function setCurrentLesson(index) {
      if (!activeLessonData || index < 0 || index >= activeLessonData.lessons.length) return;
      currentLessonIndex = index;
      activeLessonData.currentIndex = index;
      pausePlayback();
      currentTime = 0;
      updatePlayback();

      const lesson = activeLessonData.lessons[currentLessonIndex];
      lessonNumber.textContent = `AULA ${String(currentLessonIndex + 1).padStart(2, '0')}`;
      lessonTitle.textContent = lesson.title;
      descriptionTitle.textContent = lesson.title;
      description.textContent = lesson.description;
      renderLessons();
    }

    function showPreviousLesson() {
      setCurrentLesson(currentLessonIndex - 1);
    }

    function showNextLesson() {
      setCurrentLesson(currentLessonIndex + 1);
    }

    function togglePlayback() {
      if (playbackTimer !== null) {
        pausePlayback();
        return;
      }

      if (currentTime >= lessonDuration) currentTime = 0;
      playButton.setAttribute('aria-label', 'Pausar prévia');
      playIcon.textContent = 'Ⅱ';
      playerState.textContent = 'Reproduzindo prévia demonstrativa';
      playbackTimer = window.setInterval(() => {
        currentTime = Math.min(currentTime + 1, lessonDuration);
        updatePlayback();
        if (currentTime >= lessonDuration) pausePlayback();
      }, 1000);
    }

    function closeRoom() {
      const selectedCard = [...list.querySelectorAll('.classrooms-page__card')]
        .find((card) => card.dataset.courseId === selectedCourseId);
      room.hidden = true;
      selectedCourseId = null;
      activeLessonData = null;
      lessonList.replaceChildren();
      list.querySelectorAll('.classrooms-page__card').forEach((card) => {
        card.querySelector('.classrooms-page__access').setAttribute('aria-expanded', 'false');
      });
      pausePlayback();
      selectedCard?.querySelector('.classrooms-page__access').focus();
    }

    function selectRoom(course, selectedCard, progress) {
      selectedCourseId = String(course.id);
      list.querySelectorAll('.classrooms-page__card').forEach((card) => {
        card.querySelector('.classrooms-page__access')
          .setAttribute('aria-expanded', String(card === selectedCard));
      });
      roomTitle.textContent = course.title;
      roomTeacher.textContent = `Professor: ${getTeacherNames(course)}`;
      activeLessonData = lessonsByCourse.get(selectedCourseId);
      if (!activeLessonData) {
        activeLessonData = createLessons(course, progress);
        lessonsByCourse.set(selectedCourseId, activeLessonData);
      }
      setCurrentLesson(activeLessonData.currentIndex);
      room.hidden = false;
      closeButton.focus();
    }

    function renderClassrooms() {
      const term = normalize(search.value);
      const visibleCourses = availableCourses
        .slice(0, classroomLimit)
        .filter((course) => normalize(course.title).includes(term));
      const selectedCourseIsVisible = visibleCourses.some(
        (course) => String(course.id) === selectedCourseId,
      );

      if (selectedCourseId && !selectedCourseIsVisible) {
        room.hidden = true;
        selectedCourseId = null;
        activeLessonData = null;
        lessonList.replaceChildren();
        pausePlayback();
      }

      list.replaceChildren();
      visibleCourses.forEach((course) => {
        const progress = getCourseState(course, groupedCourses, progressByCourse).progress;
        const card = createClassroomCard(course, progress, selectRoom, averageRatings);
        if (!room.hidden && String(course.id) === selectedCourseId) {
          card.querySelector('.classrooms-page__access').setAttribute('aria-expanded', 'true');
        }
        list.append(card);
      });

      empty.textContent = term
        ? 'Nenhuma sala encontrada para essa busca.'
        : 'Nenhum curso disponível para exibir salas de aula.';
      empty.hidden = visibleCourses.length > 0;
    }

    async function loadCourses() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      room.hidden = true;
      selectedCourseId = null;
      searchWrap.hidden = true;
      list.replaceChildren();
      list.setAttribute('aria-busy', 'true');

      try {
        const courses = await listCourses();
        if (!active) return;
        loading.hidden = true;
        list.setAttribute('aria-busy', 'false');

        if (!courses.length) {
          availableCourses = [];
          search.value = '';
          renderClassrooms();
          empty.hidden = false;
          return;
        }

        availableCourses = courses;
        groupedCourses = Object.fromEntries(
          careerPaths.map((path) => [
            path.id,
            courses.filter((course) => path.aliases.some((alias) =>
              normalize(alias) === normalize(course.type ?? course.area),
            )),
          ]),
        );
        search.value = '';
        searchWrap.hidden = false;
        renderClassrooms();
      } catch (cause) {
        console.error('Erro ao carregar salas de aula:', cause);
        if (!active) return;
        loading.hidden = true;
        list.setAttribute('aria-busy', 'false');
        error.hidden = false;
      }
    }

    retry.addEventListener('click', loadCourses);
    search.addEventListener('input', renderClassrooms);
    closeButton.addEventListener('click', closeRoom);
    previousLessonButton.addEventListener('click', showPreviousLesson);
    nextLessonButton.addEventListener('click', showNextLesson);
    playButton.addEventListener('click', togglePlayback);
    timeline.addEventListener('input', () => {
      currentTime = Number(timeline.value);
      updatePlayback();
    });
    loadCourses();

    return () => {
      active = false;
      if (playbackTimer !== null) window.clearInterval(playbackTimer);
      retry.removeEventListener('click', loadCourses);
      search.removeEventListener('input', renderClassrooms);
      closeButton.removeEventListener('click', closeRoom);
      previousLessonButton.removeEventListener('click', showPreviousLesson);
      nextLessonButton.removeEventListener('click', showNextLesson);
      playButton.removeEventListener('click', togglePlayback);
    };
  },
};
