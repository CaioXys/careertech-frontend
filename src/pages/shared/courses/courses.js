import html from './courses.html?raw';
import './courses.css';
import { listCourses } from '../../../services/courses.service.js';
import { navigate } from '../../../core/navigate.js';
import { getCourseCoverImage } from '../../../utils/course-cover-images.js';

const courseAreas = [
  { id: 'development', label: 'Desenvolvimento', aliases: ['desenvolvimento'], completedCourses: 3 },
  { id: 'data', label: 'Banco de dados', aliases: ['dados', 'banco de dados', 'banco'], completedCourses: 2 },
  { id: 'infrastructure', label: 'Infraestrutura', aliases: ['infraestrutura', 'infra'], completedCourses: 1 },
];
const allCoursesArea = { id: 'all', label: 'Todos os cursos' };

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function getCoursesForArea(courses, area) {
  return courses.filter((course) =>
    area.aliases.some((alias) =>
      normalize(alias) === normalize(course.type ?? course.area),
    ),
  );
}

function getCourseAreaLabel(course) {
  return courseAreas.find((area) =>
    area.aliases.some((alias) =>
      normalize(alias) === normalize(course.type ?? course.area),
    ),
  )?.label ?? course.type ?? course.area ?? 'Curso';
}

function createCourseCard(course, areaLabel, recommended = false) {
  const card = document.createElement('article');
  card.className = recommended
    ? 'courses-page__card courses-page__card--recommended'
    : 'courses-page__card';
  card.tabIndex = 0;
  const imagePath = getCourseCoverImage(course.id);
  if (imagePath) card.style.setProperty('--course-card-image', `url("${imagePath}")`);

  const name = document.createElement('h3');
  name.textContent = course.title;

  const area = document.createElement('span');
  area.className = 'courses-page__area';
  area.textContent = areaLabel;

  const collapsedArea = area.cloneNode(false);
  collapsedArea.classList.add('courses-page__area--collapsed');
  collapsedArea.textContent = areaLabel;

  const description = document.createElement('p');
  description.className = 'courses-page__description';
  description.textContent = course.description;

  const workload = document.createElement('p');
  workload.className = 'courses-page__workload';
  const hours = Number(course.workloadHours);
  workload.textContent = Number.isFinite(hours) && hours > 0
    ? `Carga horária: ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    : 'Carga horária não informada';

  const details = document.createElement('button');
  details.className = 'courses-page__details';
  details.type = 'button';
  details.textContent = 'Ver detalhes';
  details.addEventListener('click', () => navigate(`/courses/${course.id}`));

  card.append(name, area, description, workload, details, collapsedArea);
  return card;
}

export default {
  title: 'Cursos',
  html,

  mount(root, ctx) {
    const list = root.querySelector('.courses-page__list');
    const recommendations = root.querySelector('.courses-page__recommendation-list');
    const recommendationSource = root.querySelector('.courses-page__recommendation-source');
    const areaButtons = root.querySelector('.courses-page__area-options');
    const selectedAreaLabel = root.querySelector('.courses-page__selected-area');
    const search = root.querySelector('#courses-search');
    const initialSearch = ctx?.query?.get('busca')?.trim().slice(0, 120) ?? '';
    if (initialSearch && search) search.value = initialSearch;
    const empty = root.querySelector('.courses-page__empty');
    const count = root.querySelector('.courses-page__count');
    const loading = root.querySelector('.courses-page__loading');
    const error = root.querySelector('.courses-page__error');
    const retry = root.querySelector('.courses-page__retry');
    let courses = [];
    let active = true;
    let isLoading = false;
    let activeAreaId = allCoursesArea.id;

    function renderRecommendations() {
      const recommendationArea = courseAreas[0];
      const areaCourses = getCoursesForArea(courses, recommendationArea);
      const completedCourses = areaCourses.slice(0, recommendationArea.completedCourses);
      const sourceCourse = completedCourses.at(-1);
      const recommendedCourses = sourceCourse
        ? areaCourses.slice(recommendationArea.completedCourses, recommendationArea.completedCourses + 2)
        : [];

      recommendations.replaceChildren(...recommendedCourses.map((course) =>
        createCourseCard(course, recommendationArea.label, true),
      ));
      recommendationSource.textContent = sourceCourse
        ? sourceCourse.title
        : 'Ainda não há curso concluído nesta trilha.';
    }

    function renderCatalog() {
      const term = normalize(search.value.trim());
      const selectedArea = activeAreaId === allCoursesArea.id
        ? allCoursesArea
        : courseAreas.find(({ id }) => id === activeAreaId);
      const areaCourses = selectedArea.id === allCoursesArea.id
        ? courses
        : getCoursesForArea(courses, selectedArea);
      const items = areaCourses.filter((course) =>
        normalize(`${course.title} ${course.area} ${course.description}`).includes(term),
      );

      list.replaceChildren();
      list.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      error.hidden = true;
      selectedAreaLabel.textContent = selectedArea.label;
      count.textContent = term
        ? `${items.length} ${items.length === 1 ? 'curso encontrado' : 'cursos encontrados'}${selectedArea.id === allCoursesArea.id ? ' no total' : ` em ${selectedArea.label}`}`
        : `${items.length} ${items.length === 1 ? 'curso disponível' : 'cursos disponíveis'}${selectedArea.id === allCoursesArea.id ? ' no total' : ` em ${selectedArea.label}`}`;
      empty.hidden = items.length > 0;
      empty.textContent = areaCourses.length === 0
        ? 'Nenhum curso disponível no momento.'
        : 'Nenhum curso encontrado para essa busca.';

      list.replaceChildren(...items.map((course) =>
        createCourseCard(
          course,
          selectedArea.id === allCoursesArea.id ? getCourseAreaLabel(course) : selectedArea.label,
        ),
      ));
    }

    function onAreaChange(event) {
      const button = event.target.closest('[data-course-area]');
      if (!button || !areaButtons.contains(button) || button.dataset.courseArea === activeAreaId) return;

      activeAreaId = button.dataset.courseArea;
      areaButtons.querySelectorAll('[data-course-area]').forEach((areaButton) => {
        areaButton.setAttribute('aria-pressed', String(areaButton === button));
      });
      search.value = '';
      if (!isLoading) renderCatalog();
    }

    async function loadCourses() {
      isLoading = true;
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      count.textContent = '';
      recommendations.replaceChildren();
      recommendationSource.textContent = '';
      list.replaceChildren();
      list.setAttribute('aria-busy', 'true');

      try {
        courses = await listCourses();
        if (!active) return;
        isLoading = false;
        renderRecommendations();
        renderCatalog();
      } catch (cause) {
        console.error('Erro ao carregar cursos:', cause);
        if (!active) return;
        isLoading = false;
        loading.hidden = true;
        error.hidden = false;
        list.setAttribute('aria-busy', 'false');
      }
    }

    function onSearch() {
      if (!isLoading) renderCatalog();
    }

    function onRetry() {
      loadCourses();
    }

    search.addEventListener('input', onSearch);
    areaButtons.addEventListener('click', onAreaChange);
    retry.addEventListener('click', onRetry);
    loadCourses();

    return () => {
      active = false;
      search.removeEventListener('input', onSearch);
      areaButtons.removeEventListener('click', onAreaChange);
      retry.removeEventListener('click', onRetry);
    };
  },
};