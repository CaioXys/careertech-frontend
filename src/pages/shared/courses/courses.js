import html from './courses.html?raw';
import './courses.css';
import { listCourses } from '../../../services/courses.service.js';
import { navigate } from '../../../core/navigate.js';

export default {
  title: 'Cursos',
  html,

  mount(root) {
    const list = root.querySelector('.courses-page__list');
    const search = root.querySelector('#courses-search');
    const empty = root.querySelector('.courses-page__empty');
    const count = root.querySelector('.courses-page__count');
    const loading = root.querySelector('.courses-page__loading');
    const error = root.querySelector('.courses-page__error');
    const retry = root.querySelector('.courses-page__retry');
    let courses = [];
    let active = true;
    let isLoading = false;

    function normalize(value) {
      return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
    }

    function render() {
      const term = normalize(search.value.trim());
      const items = courses.filter((course) =>
        normalize(`${course.title} ${course.area}`).includes(term),
      );
      list.replaceChildren();
      list.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      error.hidden = true;
      count.textContent = `${items.length} ${items.length === 1 ? 'curso encontrado' : 'cursos encontrados'}`;
      empty.hidden = items.length > 0;
      empty.textContent = courses.length === 0
        ? 'Nenhum curso disponível no momento.'
        : 'Nenhum curso encontrado para essa busca.';

      items.forEach((course) => {
        const card = document.createElement('article');
        card.className = 'courses-page__card';

        const name = document.createElement('h3');
        name.textContent = course.title;

        const area = document.createElement('span');
        area.className = 'courses-page__area';
        area.textContent = course.area;

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

        card.append(name, area, workload, details);
        list.append(card);
      });
    }

    async function loadCourses() {
      isLoading = true;
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      count.textContent = '';
      list.replaceChildren();
      list.setAttribute('aria-busy', 'true');

      try {
        courses = await listCourses();
        if (!active) return;
        isLoading = false;
        render();
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
      if (!isLoading) render();
    }

    function onRetry() {
      loadCourses();
    }

    search.addEventListener('input', onSearch);
    retry.addEventListener('click', onRetry);
    loadCourses();

    return () => {
      active = false;
      search.removeEventListener('input', onSearch);
      retry.removeEventListener('click', onRetry);
    };
  },
};