import html from './lessons.html?raw';
import './lessons.css';
import {
  createTeacherLesson,
  deleteTeacherLesson,
  listTeacherClasses,
  listTeacherLessons,
  updateTeacherLesson,
  updateTeacherLessonStatus,
} from '../../../services/teacher.service.js';
import { toastError, toastSuccess } from '../../../core/toast.js';
import { formatDate, formatMinutes } from '../../../utils/format.js';

const statusLabels = { publicada: 'Publicada', rascunho: 'Rascunho', agendada: 'Agendada' };
const typeLabels = { video: 'Vídeo', leitura: 'Leitura', pratica: 'Prática' };

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

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default {
  title: 'Aulas e conteúdos',
  html,

  mount(root, ctx) {
    const page = root.querySelector('.lessons-page');
    const filters = page.querySelector('[data-filters]');
    const search = filters.elements.busca;
    const classFilter = filters.elements.classId;
    const statusFilter = filters.elements.status;
    const count = page.querySelector('[data-count]');
    const loading = page.querySelector('[data-loading]');
    const error = page.querySelector('[data-error]');
    const retry = page.querySelector('[data-retry]');
    const empty = page.querySelector('[data-empty]');
    const emptyText = page.querySelector('[data-empty-text]');
    const clearFilters = page.querySelector('[data-clear-filters]');
    const tableCard = page.querySelector('[data-table-card]');
    const rows = page.querySelector('[data-lesson-rows]');
    const newLessonButton = page.querySelector('[data-new-lesson]');
    const dialog = page.querySelector('[data-lesson-dialog]');
    const form = page.querySelector('[data-lesson-form]');
    const lessonClassSelect = page.querySelector('[data-lesson-class]');
    const publishedAt = page.querySelector('[data-published-at]');
    const formError = page.querySelector('[data-form-error]');
    const submitButton = page.querySelector('[data-submit-lesson]');
    const dialogEyebrow = page.querySelector('[data-dialog-eyebrow]');
    const dialogTitle = page.querySelector('[data-dialog-title]');
    const deleteDialog = page.querySelector('[data-delete-dialog]');
    const deleteDescription = page.querySelector('[data-delete-description]');
    const confirmDelete = page.querySelector('[data-confirm-delete]');
    let lessons = [];
    let classes = [];
    let editingId = null;
    let deletingId = null;
    let active = true;
    let debounce;

    const announce = (message, isError = false) => {
      if (!message) return;
      if (isError) toastError(message);
      else toastSuccess(message);
    };

    function renderClassOptions() {
      classFilter.replaceChildren(new Option('Todas as turmas', ''));
      lessonClassSelect.replaceChildren(new Option('Selecione uma turma', ''));
      classes.forEach((classroom) => {
        const label = `${classroom.name} · ${classroom.code}`;
        classFilter.append(new Option(label, String(classroom.id)));
        lessonClassSelect.append(new Option(label, String(classroom.id)));
      });
    }

    function renderSummary() {
      page.querySelector('[data-summary-published]').textContent = lessons.filter((item) => item.status === 'publicada').length;
      page.querySelector('[data-summary-drafts]').textContent = lessons.filter((item) => item.status === 'rascunho').length;
      page.querySelector('[data-summary-scheduled]').textContent = lessons.filter((item) => item.status === 'agendada').length;
    }

    function createRow(lesson) {
      const row = el('tr');
      row.dataset.lessonId = String(lesson.id);

      const lessonCell = el('td', 'lessons-page__lesson-cell');
      lessonCell.append(el('strong', '', lesson.title), el('span', '', lesson.module));

      const classCell = el('td', 'lessons-page__class-cell');
      classCell.append(el('strong', '', lesson.className), el('span', '', lesson.classCode));

      const typeCell = el('td');
      typeCell.append(el('span', `lessons-page__type${lesson.type === 'pratica' ? ' lessons-page__type--pratica' : ''}`, typeLabels[lesson.type] ?? lesson.type));

      const durationCell = el('td', 'lessons-page__date', formatMinutes(lesson.durationMin));

      const statusCell = el('td');
      statusCell.append(el('span', `lessons-page__status lessons-page__status--${lesson.status}`, statusLabels[lesson.status] ?? lesson.status));

      const updatedCell = el('td', 'lessons-page__date', formatDate(lesson.updatedAt));

      const actions = el('td');
      const actionWrap = el('div', 'lessons-page__row-actions');

      const edit = el('button', 'lessons-page__row-action', 'Editar');
      edit.type = 'button';
      edit.dataset.action = 'edit';
      edit.dataset.id = String(lesson.id);
      edit.setAttribute('aria-label', `Editar aula ${lesson.title}`);

      const publish = el('button', 'lessons-page__row-action', lesson.status === 'publicada' ? 'Despublicar' : 'Publicar');
      publish.type = 'button';
      publish.dataset.action = lesson.status === 'publicada' ? 'unpublish' : 'publish';
      publish.dataset.id = String(lesson.id);
      publish.setAttribute('aria-label', `${lesson.status === 'publicada' ? 'Despublicar' : 'Publicar'} aula ${lesson.title}`);

      const remove = el('button', 'lessons-page__row-action lessons-page__row-action--danger', 'Excluir');
      remove.type = 'button';
      remove.dataset.action = 'delete';
      remove.dataset.id = String(lesson.id);
      remove.setAttribute('aria-label', `Excluir aula ${lesson.title}`);

      actionWrap.append(edit, publish, remove);
      actions.append(actionWrap);

      row.append(lessonCell, classCell, typeCell, durationCell, statusCell, updatedCell, actions);
      return row;
    }

    function applyFilters() {
      const term = normalize(search.value);
      const visible = lessons.filter((item) =>
        (!classFilter.value || item.classId === Number(classFilter.value)) &&
        (!statusFilter.value || item.status === statusFilter.value) &&
        (!term || [item.title, item.module, item.className, item.summary].some((value) => normalize(value).includes(term))),
      );

      rows.replaceChildren();
      visible.forEach((item) => rows.append(createRow(item)));
      count.textContent = `${visible.length} aula(s) encontrada(s)`;
      tableCard.hidden = visible.length === 0;
      empty.hidden = visible.length > 0;
      emptyText.textContent = lessons.length === 0
        ? 'Você ainda não criou aulas. Cadastre a primeira para começar.'
        : 'Revise a busca ou os filtros para ver outras aulas.';
    }

    function openLessonDialog(lesson = null) {
      if (!classes.length) {
        announce('Cadastre uma turma antes de criar aulas.', true);
        return;
      }
      editingId = lesson?.id ?? null;
      form.reset();
      formError.hidden = true;
      submitButton.disabled = false;
      submitButton.textContent = lesson ? 'Salvar alterações' : 'Salvar aula';
      dialogEyebrow.textContent = lesson ? 'EDITAR AULA' : 'NOVA AULA';
      dialogTitle.textContent = lesson ? 'Editar aula' : 'Criar aula';

      if (lesson) {
        form.elements.title.value = lesson.title;
        lessonClassSelect.value = String(lesson.classId);
        form.elements.module.value = lesson.module;
        form.elements.type.value = lesson.type;
        form.elements.durationMin.value = String(lesson.durationMin);
        form.elements.status.value = lesson.status;
        publishedAt.value = toDateTimeInput(lesson.publishedAt);
        form.elements.summary.value = lesson.summary ?? '';
      } else {
        const preferred = classFilter.value || String(classes[0].id);
        if ([...lessonClassSelect.options].some((option) => option.value === preferred)) lessonClassSelect.value = preferred;
        publishedAt.value = '';
      }

      dialog.showModal();
      form.elements.title.focus();
    }

    function openDelete(lesson) {
      deletingId = lesson.id;
      deleteDescription.textContent = `A aula "${lesson.title}" será removida de ${lesson.className}.`;
      confirmDelete.disabled = false;
      confirmDelete.textContent = 'Excluir aula';
      deleteDialog.showModal();
      page.querySelector('[data-cancel-delete]').focus();
    }

    async function togglePublish(lesson, button) {
      const nextStatus = lesson.status === 'publicada' ? 'rascunho' : 'publicada';
      button.disabled = true;
      button.textContent = 'Salvando…';
      try {
        const updated = await updateTeacherLessonStatus(lesson.id, nextStatus);
        if (!active) return;
        lessons = lessons.map((item) => (item.id === updated.id ? updated : item));
        renderSummary();
        applyFilters();
        announce(nextStatus === 'publicada' ? `Aula "${lesson.title}" publicada.` : `Aula "${lesson.title}" voltou para rascunho.`);
        requestAnimationFrame(() => rows.querySelector(`[data-action="edit"][data-id="${lesson.id}"]`)?.focus());
      } catch (cause) {
        announce(cause.message || 'Não foi possível atualizar a aula.', true);
        button.disabled = false;
        button.textContent = lesson.status === 'publicada' ? 'Despublicar' : 'Publicar';
      }
    }

    async function load() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      tableCard.hidden = true;
      rows.replaceChildren();
      announce('');

      try {
        const [lessonList, classList] = await Promise.all([listTeacherLessons(), listTeacherClasses()]);
        if (!active) return;
        lessons = lessonList;
        classes = classList;
        renderClassOptions();
        renderSummary();
        loading.hidden = true;

        const queryClass = ctx?.query?.get('turma');
        if (queryClass && [...classFilter.options].some((option) => option.value === queryClass)) {
          classFilter.value = queryClass;
        }

        applyFilters();
        if (ctx?.query?.get('novo') === '1') openLessonDialog();
      } catch (cause) {
        console.error('Erro ao carregar aulas:', cause);
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
    classFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    clearFilters.addEventListener('click', () => {
      search.value = '';
      classFilter.value = '';
      statusFilter.value = '';
      applyFilters();
      search.focus();
    });

    newLessonButton.addEventListener('click', () => openLessonDialog());
    page.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-cancel-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-cancel-delete]').addEventListener('click', () => deleteDialog.close());

    rows.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button || button.disabled) return;
      const lesson = lessons.find((item) => item.id === Number(button.dataset.id));
      if (!lesson) return;
      if (button.dataset.action === 'edit') openLessonDialog(lesson);
      if (button.dataset.action === 'publish' || button.dataset.action === 'unpublish') togglePublish(lesson, button);
      if (button.dataset.action === 'delete') openDelete(lesson);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError.hidden = true;
      if (!form.reportValidity()) return;

      const selectedStatus = form.elements.status.value;
      if (selectedStatus === 'agendada' && !publishedAt.value) {
        formError.textContent = 'Informe a data de agendamento da aula.';
        formError.hidden = false;
        publishedAt.focus();
        return;
      }

      const payload = {
        title: form.elements.title.value.trim(),
        classId: Number(lessonClassSelect.value),
        module: form.elements.module.value.trim(),
        type: form.elements.type.value,
        durationMin: Number(form.elements.durationMin.value) || 0,
        status: selectedStatus,
        publishedAt: publishedAt.value ? new Date(publishedAt.value).toISOString() : null,
        summary: form.elements.summary.value.trim(),
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Salvando…';
      try {
        const saved = editingId
          ? await updateTeacherLesson(editingId, payload)
          : await createTeacherLesson(payload);
        if (!active) return;

        lessons = editingId
          ? lessons.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...lessons];
        const wasEditing = Boolean(editingId);
        editingId = null;
        renderSummary();
        search.value = '';
        statusFilter.value = '';
        classFilter.value = '';
        applyFilters();
        dialog.close();
        announce(wasEditing ? `Aula "${saved.title}" atualizada.` : `Aula "${saved.title}" criada.`);
        newLessonButton.focus();
      } catch (cause) {
        formError.textContent = cause.message || 'Não foi possível salvar a aula.';
        formError.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = editingId ? 'Salvar alterações' : 'Salvar aula';
      }
    });

    confirmDelete.addEventListener('click', async () => {
      if (!deletingId) return;
      confirmDelete.disabled = true;
      confirmDelete.textContent = 'Excluindo…';
      try {
        await deleteTeacherLesson(deletingId);
        if (!active) return;
        lessons = lessons.filter((item) => item.id !== deletingId);
        deletingId = null;
        deleteDialog.close();
        renderSummary();
        applyFilters();
        announce('Aula excluída.');
        newLessonButton.focus();
      } catch (cause) {
        announce(cause.message || 'Não foi possível excluir a aula.', true);
        confirmDelete.disabled = false;
        confirmDelete.textContent = 'Excluir aula';
      }
    });

    [dialog, deleteDialog].forEach((element) => {
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
