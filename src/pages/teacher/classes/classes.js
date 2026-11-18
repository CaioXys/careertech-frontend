import html from './classes.html?raw';
import './classes.css';
import { createTeacherClass, listTeacherClasses } from '../../../services/teacher.service.js';
import { listCourses } from '../../../services/courses.service.js';
import { getCourseImage } from '../../../utils/course-images.js';
import { toastError, toastSuccess } from '../../../core/toast.js';
import { formatDate, formatDateTime, formatPercent } from '../../../utils/format.js';

const statusLabels = { ativa: 'Ativa', planejada: 'Planejada', encerrada: 'Encerrada' };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function progressBar(value, label) {
  const track = el('div', 'classes-page__track');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', String(Math.round(value)));
  const fill = el('span');
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  track.append(fill);
  return track;
}

export default {
  title: 'Turmas',
  html,

  mount(root, ctx) {
    const page = root.querySelector('.classes-page');
    const filters = page.querySelector('[data-filters]');
    const search = filters.elements.busca;
    const status = filters.elements.status;
    const count = page.querySelector('[data-count]');
    const loading = page.querySelector('[data-loading]');
    const error = page.querySelector('[data-error]');
    const retry = page.querySelector('[data-retry]');
    const empty = page.querySelector('[data-empty]');
    const emptyText = page.querySelector('[data-empty-text]');
    const clearFilters = page.querySelector('[data-clear-filters]');
    const grid = page.querySelector('[data-class-list]');
    const newClassButton = page.querySelector('[data-new-class]');
    const dialog = page.querySelector('[data-class-dialog]');
    const form = page.querySelector('[data-class-form]');
    const courseSelect = page.querySelector('[data-course-select]');
    const formError = page.querySelector('[data-form-error]');
    const submitButton = page.querySelector('[data-submit-class]');
    const detailDialog = page.querySelector('[data-detail-dialog]');
    const detailName = page.querySelector('[data-detail-name]');
    const detailCode = page.querySelector('[data-detail-code]');
    const detailCourse = page.querySelector('[data-detail-course]');
    const detailStatus = page.querySelector('[data-detail-status]');
    const detailPeriod = page.querySelector('[data-detail-period]');
    const detailSchedule = page.querySelector('[data-detail-schedule]');
    const detailRoom = page.querySelector('[data-detail-room]');
    const detailModality = page.querySelector('[data-detail-modality]');
    const detailStart = page.querySelector('[data-detail-start]');
    const detailEnd = page.querySelector('[data-detail-end]');
    const detailProgress = page.querySelector('[data-detail-progress]');
    const detailProgressValue = page.querySelector('[data-detail-progress-value]');
    const detailStudentsCount = page.querySelector('[data-detail-students-count]');
    const detailNext = page.querySelector('[data-detail-next]');
    const detailLessons = page.querySelector('[data-detail-lessons]');
    const detailStudents = page.querySelector('[data-detail-students]');
    let classes = [];
    let coursesReady = false;
    let active = true;
    let debounce;

    const announce = (message, isError = false) => {
      if (!message) return;
      if (isError) toastError(message);
      else toastSuccess(message);
    };

    function renderCourseOptions(courses) {
      courseSelect.replaceChildren(new Option('Selecione um curso', ''));
      courses.forEach((course) => {
        const option = new Option(course.title, String(course.id));
        option.dataset.courseName = course.title;
        option.dataset.area = course.area ?? 'Desenvolvimento';
        courseSelect.append(option);
      });
      coursesReady = courses.length > 0;
    }

    function renderSummary() {
      const activeClasses = classes.filter((item) => item.status === 'ativa');
      const plannedClasses = classes.filter((item) => item.status === 'planejada');
      const activeStudents = activeClasses.reduce((total, item) => total + item.studentsCount, 0);
      const average = activeClasses.length
        ? Math.round(activeClasses.reduce((total, item) => total + item.progress, 0) / activeClasses.length)
        : 0;

      page.querySelector('[data-summary-classes]').textContent = classes.length;
      page.querySelector('[data-summary-classes-meta]').textContent = `${activeClasses.length} ativa(s) · ${plannedClasses.length} planejada(s)`;
      page.querySelector('[data-summary-students]').textContent = activeStudents;
      page.querySelector('[data-summary-students-meta]').textContent = `${classes.reduce((total, item) => total + item.studentsCount, 0)} matrículas no total`;
      page.querySelector('[data-summary-progress]').textContent = formatPercent(average);
      page.querySelector('[data-summary-progress-meta]').textContent = 'Média das turmas ativas';
    }

    function createCover(classroom) {
      const cover = el('div', `classes-page__cover${normalize(classroom.area).includes('dados') ? ' classes-page__cover--dados' : ''}`);
      const imagePath = getCourseImage(classroom.courseId);
      if (imagePath) {
        const image = el('img');
        image.src = imagePath;
        image.alt = `Imagem do curso ${classroom.course}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        cover.append(image);
      } else {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M4 19V7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM14 5v6h6');
        icon.append(path);
        cover.append(icon);
      }
      cover.append(el('span', `classes-page__status classes-page__status--${classroom.status}`, statusLabels[classroom.status] ?? classroom.status));
      return cover;
    }

    function createCard(classroom) {
      const card = el('article', 'classes-page__card');
      card.dataset.classId = String(classroom.id);

      const body = el('div', 'classes-page__card-body');
      const top = el('div', 'classes-page__card-top');
      top.append(
        el('span', 'classes-page__area', classroom.area ?? 'Curso'),
        el('span', 'classes-page__code', classroom.code),
      );

      const meta = el('ul', 'classes-page__meta');
      meta.append(
        el('li', '', `${classroom.studentsCount} aluno(s) matriculado(s)`),
        el('li', '', `${classroom.period} · ${classroom.shift}`),
        el('li', '', classroom.schedule),
        el('li', '', `${classroom.modality}${classroom.room ? ` · ${classroom.room}` : ''}`),
      );

      const progress = el('div', 'classes-page__progress');
      const progressCopy = el('div', 'classes-page__progress-copy');
      progressCopy.append(el('span', '', 'Progresso médio'), el('b', '', formatPercent(classroom.progress)));
      progress.append(progressCopy, progressBar(classroom.progress, `Progresso médio da turma ${classroom.name}`));

      const next = el('p', 'classes-page__next');
      if (classroom.nextLesson) {
        next.append(
          el('b', '', classroom.nextLesson.title),
          document.createTextNode(`${formatDateTime(classroom.nextLesson.date)} · ${classroom.nextLesson.type}`),
        );
      } else {
        next.append(document.createTextNode(classroom.status === 'encerrada' ? 'Turma encerrada — sem próxima aula.' : 'Nenhuma aula agendada.'));
      }

      const actions = el('div', 'classes-page__card-actions');
      const detailButton = el('button', '', 'Detalhes da turma');
      detailButton.type = 'button';
      detailButton.dataset.action = 'detail';
      detailButton.setAttribute('aria-label', `Ver detalhes da turma ${classroom.name}`);
      const lessonsLink = el('a', '', 'Aulas');
      lessonsLink.href = `#/teacher/lessons?turma=${classroom.id}`;
      const studentsLink = el('a', '', 'Alunos');
      studentsLink.href = `#/teacher/students?turma=${classroom.id}`;
      actions.append(detailButton, lessonsLink, studentsLink);

      body.append(top, el('h2', '', classroom.name), el('p', 'classes-page__course', classroom.course), meta, progress, next, actions);
      card.append(createCover(classroom), body);
      return card;
    }

    function applyFilters() {
      const term = normalize(search.value);
      const selectedStatus = status.value;
      const visible = classes.filter((item) =>
        (!selectedStatus || item.status === selectedStatus) &&
        (!term || [item.name, item.course, item.code, item.period].some((value) => normalize(value).includes(term))),
      );

      grid.replaceChildren();
      visible.forEach((item) => grid.append(createCard(item)));
      count.textContent = `${visible.length} turma(s) encontrada(s)`;
      empty.hidden = visible.length > 0;

      if (classes.length === 0) {
        emptyText.textContent = 'Você ainda não criou turmas. Cadastre a primeira para começar a organizar as aulas.';
      } else {
        emptyText.textContent = 'Revise a busca ou os filtros para ver outras turmas.';
      }
    }

    function openNewClass() {
      if (!coursesReady) {
        announce('Aguarde o carregamento dos cursos para cadastrar uma turma.', true);
        return;
      }
      form.reset();
      formError.hidden = true;
      submitButton.disabled = false;
      submitButton.textContent = 'Criar turma';
      dialog.showModal();
      form.elements.name.focus();
    }

    function openDetails(classroom) {
      detailName.textContent = classroom.name;
      detailCode.textContent = `${classroom.code} · ${classroom.period}`;
      detailCourse.textContent = classroom.course;
      detailStatus.textContent = statusLabels[classroom.status] ?? classroom.status;
      detailPeriod.textContent = `${classroom.period} · ${classroom.shift}`;
      detailSchedule.textContent = classroom.schedule;
      detailRoom.textContent = classroom.room || 'Não informado';
      detailModality.textContent = classroom.modality;
      detailStart.textContent = classroom.startDate ? formatDate(classroom.startDate) : 'Não definido';
      detailEnd.textContent = classroom.endDate ? formatDate(classroom.endDate) : 'Não definido';
      detailProgressValue.textContent = formatPercent(classroom.progress);
      detailProgress.setAttribute('aria-valuenow', String(Math.round(classroom.progress)));
      detailProgress.querySelector('span').style.width = `${Math.max(0, Math.min(100, classroom.progress))}%`;
      detailStudentsCount.textContent = `${classroom.studentsCount} aluno(s) acompanhado(s) nesta turma`;
      detailNext.textContent = classroom.nextLesson
        ? `Próxima aula: ${classroom.nextLesson.title} em ${formatDateTime(classroom.nextLesson.date)}.`
        : classroom.status === 'encerrada'
          ? 'Esta turma foi encerrada.'
          : 'Nenhuma aula agendada para esta turma.';
      detailLessons.href = `#/teacher/lessons?turma=${classroom.id}`;
      detailStudents.href = `#/teacher/students?turma=${classroom.id}`;
      detailDialog.showModal();
    }

    async function load() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      grid.replaceChildren();
      announce('');
      try {
        const [classList, courseList] = await Promise.all([
          listTeacherClasses(),
          listCourses().catch(() => []),
        ]);
        if (!active) return;
        classes = classList;
        renderCourseOptions(courseList);
        renderSummary();
        loading.hidden = true;
        applyFilters();

        if (ctx?.query?.get('nova') === '1') openNewClass();
        if (ctx?.query?.get('status')) {
          status.value = ctx.query.get('status');
          applyFilters();
        }
      } catch (cause) {
        console.error('Erro ao carregar turmas:', cause);
        if (!active) return;
        loading.hidden = true;
        error.hidden = false;
      }
    }

    filters.addEventListener('submit', (event) => event.preventDefault());
    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(applyFilters, 200);
    });
    status.addEventListener('change', applyFilters);
    clearFilters.addEventListener('click', () => {
      search.value = '';
      status.value = '';
      applyFilters();
      search.focus();
    });
    newClassButton.addEventListener('click', openNewClass);
    page.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-cancel-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-detail-close]').addEventListener('click', () => detailDialog.close());
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="detail"]');
      if (!button) return;
      const card = button.closest('.classes-page__card');
      const classroom = classes.find((item) => String(item.id) === card.dataset.classId);
      if (classroom) openDetails(classroom);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError.hidden = true;
      if (!form.reportValidity()) return;
      const option = courseSelect.selectedOptions[0];
      if (!option?.value) {
        formError.textContent = 'Selecione o curso vinculado à turma.';
        formError.hidden = false;
        courseSelect.focus();
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Criando…';
      try {
        const classroom = await createTeacherClass({
          name: form.elements.name.value.trim(),
          courseId: Number(option.value),
          course: option.dataset.courseName,
          area: option.dataset.area,
          code: form.elements.code.value.trim(),
          period: form.elements.period.value.trim(),
          shift: form.elements.shift.value,
          modality: form.elements.modality.value,
          schedule: form.elements.schedule.value.trim(),
          room: form.elements.room.value.trim(),
          startDate: form.elements.startDate.value || null,
          endDate: form.elements.endDate.value || null,
        });
        if (!active) return;
        classes.unshift(classroom);
        renderSummary();
        search.value = '';
        status.value = '';
        applyFilters();
        dialog.close();
        announce(`Turma "${classroom.name}" criada com sucesso.`);
        newClassButton.focus();
      } catch (cause) {
        formError.textContent = cause.message || 'Não foi possível criar a turma.';
        formError.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar turma';
      }
    });

    [dialog, detailDialog].forEach((element) => {
      element.addEventListener('click', (event) => {
        if (event.target === element) element.close();
      });
    });
    retry.addEventListener('click', load);

    load();

    return () => {
      active = false;
      clearTimeout(debounce);
      retry.removeEventListener('click', load);
    };
  },
};
