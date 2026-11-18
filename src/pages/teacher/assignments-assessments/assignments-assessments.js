import html from './assignments-assessments.html?raw';
import './assignments-assessments.css';
import {
  createTeacherAssessment,
  gradeTeacherSubmission,
  listTeacherAssessmentSubmissions,
  listTeacherAssessments,
  listTeacherClasses,
  updateTeacherAssessmentStatus,
} from '../../../services/teacher.service.js';
import { toastError, toastSuccess } from '../../../core/toast.js';
import { formatDate, formatDateTime, formatNumber } from '../../../utils/format.js';

const statusLabels = {
  aberta: 'Aberta',
  em_correcao: 'Em correção',
  agendada: 'Agendada',
  encerrada: 'Encerrada',
};

const typeLabels = { atividade: 'Atividade', prova: 'Prova', projeto: 'Projeto' };

const submissionLabels = {
  corrigida: 'Corrigida',
  enviada: 'Aguardando correção',
  nao_enviada: 'Não enviada',
};

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
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function progressBar(value, label) {
  const track = el('div', 'assignments-assessments-page__track');
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
  title: 'Atividades e avaliações',
  html,

  mount(root, ctx) {
    const page = root.querySelector('.assignments-assessments-page');
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
    const grid = page.querySelector('[data-assessment-list]');
    const newAssessmentButton = page.querySelector('[data-new-assessment]');
    const dialog = page.querySelector('[data-assessment-dialog]');
    const form = page.querySelector('[data-assessment-form]');
    const assessmentClassSelect = page.querySelector('[data-assessment-class]');
    const formError = page.querySelector('[data-form-error]');
    const submitButton = page.querySelector('[data-submit-assessment]');
    const submissionsDialog = page.querySelector('[data-submissions-dialog]');
    const submissionsTitle = page.querySelector('[data-submissions-title]');
    const submissionsMeta = page.querySelector('[data-submissions-meta]');
    const submissionsCount = page.querySelector('[data-submissions-count]');
    const submissionsGraded = page.querySelector('[data-submissions-graded]');
    const submissionsAverage = page.querySelector('[data-submissions-average]');
    const submissionsLoading = page.querySelector('[data-submissions-loading]');
    const submissionsTable = page.querySelector('[data-submissions-table]');
    const submissionRows = page.querySelector('[data-submission-rows]');
    let assessments = [];
    let classes = [];
    let currentAssessment = null;
    let currentSubmissions = [];
    let active = true;
    let debounce;

    const announce = (message, isError = false) => {
      if (!message) return;
      if (isError) toastError(message);
      else toastSuccess(message);
    };

    const announceSubmission = announce;

    function renderClassOptions() {
      classFilter.replaceChildren(new Option('Todas as turmas', ''));
      assessmentClassSelect.replaceChildren(new Option('Selecione uma turma', ''));
      classes.forEach((classroom) => {
        const label = `${classroom.name} · ${classroom.code}`;
        classFilter.append(new Option(label, String(classroom.id)));
        assessmentClassSelect.append(new Option(label, String(classroom.id)));
      });
    }

    function renderSummary() {
      const open = assessments.filter((item) => item.status === 'aberta').length;
      const grading = assessments.filter((item) => item.status === 'em_correcao').length;
      const pending = assessments.reduce((total, item) => total + Math.max(0, item.submissions - item.graded), 0);
      const gradedAssessments = assessments.filter((item) => Number.isFinite(item.average));
      const average = gradedAssessments.length
        ? gradedAssessments.reduce((total, item) => total + item.average, 0) / gradedAssessments.length
        : null;

      page.querySelector('[data-summary-open]').textContent = open;
      page.querySelector('[data-summary-grading]').textContent = grading;
      page.querySelector('[data-summary-grading-meta]').textContent = pending ? `${pending} entrega(s) pendente(s)` : 'Nenhuma entrega pendente';
      page.querySelector('[data-summary-average]').textContent = average === null ? '—' : formatNumber(average);
    }

    function createCard(assessment) {
      const card = el('article', 'assignments-assessments-page__card');
      card.dataset.assessmentId = String(assessment.id);

      const top = el('div', 'assignments-assessments-page__card-top');
      top.append(
        el('span', `assignments-assessments-page__type assignments-assessments-page__type--${assessment.type}`, typeLabels[assessment.type] ?? assessment.type),
        el('span', `assignments-assessments-page__status assignments-assessments-page__status--${assessment.status}`, statusLabels[assessment.status] ?? assessment.status),
      );

      const metrics = el('dl', 'assignments-assessments-page__metrics');
      const metric = (label, value) => {
        const wrap = el('div');
        wrap.append(el('dt', '', label), el('dd', '', value));
        return wrap;
      };
      metrics.append(
        metric('Prazo', formatDate(assessment.dueDate)),
        metric('Peso', `${assessment.weight}%`),
        metric('Média', assessment.average === null ? '—' : formatNumber(assessment.average)),
      );

      const deliveries = el('div', 'assignments-assessments-page__deliveries');
      const percent = assessment.totalStudents ? (assessment.submissions / assessment.totalStudents) * 100 : 0;
      const deliveriesCopy = el('div', 'assignments-assessments-page__deliveries-copy');
      deliveriesCopy.append(
        el('span', '', 'Entregas recebidas'),
        el('b', '', `${assessment.submissions} de ${assessment.totalStudents}`),
      );
      deliveries.append(
        deliveriesCopy,
        progressBar(percent, `Entregas recebidas em ${assessment.title}`),
      );

      const actions = el('div', 'assignments-assessments-page__card-actions');
      const openButton = el('button', 'assignments-assessments-page__card-action assignments-assessments-page__card-action--primary', 'Ver entregas');
      openButton.type = 'button';
      openButton.dataset.action = 'submissions';
      openButton.dataset.id = String(assessment.id);
      openButton.setAttribute('aria-label', `Ver entregas de ${assessment.title}`);

      const statusAction = el(
        'button',
        `assignments-assessments-page__card-action${assessment.status === 'encerrada' ? '' : ' assignments-assessments-page__card-action--danger'}`,
        assessment.status === 'encerrada' ? 'Reabrir' : assessment.status === 'agendada' ? 'Abrir agora' : 'Encerrar',
      );
      statusAction.type = 'button';
      statusAction.dataset.action = assessment.status === 'encerrada' ? 'reopen' : 'close';
      statusAction.dataset.id = String(assessment.id);
      statusAction.setAttribute('aria-label', `${statusAction.textContent} avaliação ${assessment.title}`);
      actions.append(openButton, statusAction);

      card.append(
        top,
        el('h2', '', assessment.title),
        el('p', 'assignments-assessments-page__class', `${assessment.className} · ${assessment.classCode}`),
        el('p', 'assignments-assessments-page__description', assessment.description),
        metrics,
        deliveries,
        actions,
      );
      return card;
    }

    function applyFilters() {
      const term = normalize(search.value);
      const visible = assessments.filter((item) =>
        (!classFilter.value || item.classId === Number(classFilter.value)) &&
        (!statusFilter.value || item.status === statusFilter.value) &&
        (!term || [item.title, item.className, item.description].some((value) => normalize(value).includes(term))),
      );

      grid.replaceChildren();
      visible.forEach((item) => grid.append(createCard(item)));
      count.textContent = `${visible.length} avaliação(ões) encontrada(s)`;
      empty.hidden = visible.length > 0;
      emptyText.textContent = assessments.length === 0
        ? 'Você ainda não criou avaliações. Cadastre a primeira para acompanhar as entregas.'
        : 'Revise a busca ou os filtros para ver outras avaliações.';
    }

    function openNewAssessment() {
      if (!classes.length) {
        announce('Cadastre uma turma antes de criar avaliações.', true);
        return;
      }
      form.reset();
      formError.hidden = true;
      submitButton.disabled = false;
      submitButton.textContent = 'Criar avaliação';
      const preferred = classFilter.value || String(classes[0].id);
      if ([...assessmentClassSelect.options].some((option) => option.value === preferred)) {
        assessmentClassSelect.value = preferred;
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      form.elements.dueDate.value = toDateTimeInput(tomorrow);
      dialog.showModal();
      form.elements.title.focus();
    }

    function renderSubmissionRows() {
      submissionRows.replaceChildren();
      currentSubmissions.forEach((submission) => {
        const row = el('tr');

        const student = el('td', 'assignments-assessments-page__student');
        student.append(el('strong', '', submission.name), el('span', '', submission.email));

        const sent = el('td', '', submission.submitted ? formatDate(submission.submittedAt) : '—');
        const status = el('td');
        status.append(el(
          'span',
          `assignments-assessments-page__submission-status assignments-assessments-page__submission-status--${submission.status}`,
          submissionLabels[submission.status] ?? submission.status,
        ));

        const grade = el('td');
        if (submission.status === 'corrigida') {
          grade.append(el('span', 'assignments-assessments-page__grade-value', formatNumber(submission.grade)));
        } else if (submission.submitted) {
          const wrap = el('div', 'assignments-assessments-page__grade');
          const input = el('input');
          input.type = 'number';
          input.min = '0';
          input.max = '10';
          input.step = '0.1';
          input.placeholder = '0,0';
          input.setAttribute('aria-label', `Nota de ${submission.name}`);
          input.dataset.gradeInput = String(submission.studentId);
          const save = el('button', 'assignments-assessments-page__grade-button', 'Salvar nota');
          save.type = 'button';
          save.dataset.gradeStudent = String(submission.studentId);
          save.setAttribute('aria-label', `Salvar nota de ${submission.name}`);
          wrap.append(input, save);
          grade.append(wrap);
        } else {
          grade.append(el('span', 'assignments-assessments-page__grade-empty', 'Aguardando envio'));
        }

        row.append(student, sent, status, grade);
        submissionRows.append(row);
      });
    }

    function renderSubmissionsView() {
      if (!currentAssessment) return;
      const submitted = currentSubmissions.filter((item) => item.submitted).length;
      const graded = currentSubmissions.filter((item) => item.status === 'corrigida').length;
      submissionsCount.textContent = `${submitted} de ${currentSubmissions.length}`;
      submissionsGraded.textContent = `${graded} de ${submitted}`;
      submissionsAverage.textContent = currentAssessment.average === null ? '—' : formatNumber(currentAssessment.average);
      renderSubmissionRows();
      submissionsLoading.hidden = true;
      submissionsTable.hidden = false;
    }

    async function openSubmissions(assessment) {
      currentAssessment = assessment;
      currentSubmissions = [];
      submissionsTitle.textContent = assessment.title;
      submissionsMeta.textContent = `${assessment.className} · Prazo em ${formatDateTime(assessment.dueDate)}`;
      submissionsCount.textContent = '—';
      submissionsGraded.textContent = '—';
      submissionsAverage.textContent = '—';
      submissionRows.replaceChildren();
      submissionsTable.hidden = true;
      submissionsLoading.hidden = false;
      announceSubmission('');
      submissionsDialog.showModal();

      try {
        const result = await listTeacherAssessmentSubmissions(assessment.id);
        if (!active) return;
        currentAssessment = result.assessment;
        currentSubmissions = result.submissions;
        renderSubmissionsView();
        submissionsDialog.querySelector('[data-submissions-close]').focus();
      } catch (cause) {
        if (!active) return;
        submissionsLoading.hidden = true;
        announceSubmission(cause.message || 'Não foi possível carregar as entregas.', true);
      }
    }

    async function changeStatus(assessment, button) {
      const nextStatus = assessment.status === 'encerrada' ? 'aberta' : 'encerrada';
      button.disabled = true;
      button.textContent = 'Salvando…';
      try {
        const updated = await updateTeacherAssessmentStatus(assessment.id, nextStatus);
        if (!active) return;
        assessments = assessments.map((item) => (item.id === updated.id ? updated : item));
        renderSummary();
        applyFilters();
        announce(nextStatus === 'encerrada' ? `Avaliação "${assessment.title}" encerrada.` : `Avaliação "${assessment.title}" reaberta.`);
        requestAnimationFrame(() => grid.querySelector(`[data-action="${nextStatus === 'encerrada' ? 'reopen' : 'close'}"][data-id="${assessment.id}"]`)?.focus());
      } catch (cause) {
        announce(cause.message || 'Não foi possível atualizar a avaliação.', true);
        button.disabled = false;
        button.textContent = assessment.status === 'encerrada' ? 'Reabrir' : 'Encerrar';
      }
    }

    async function load() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      grid.replaceChildren();
      announce('');

      try {
        const [assessmentList, classList] = await Promise.all([listTeacherAssessments(), listTeacherClasses()]);
        if (!active) return;
        assessments = assessmentList;
        classes = classList;
        renderClassOptions();
        renderSummary();
        loading.hidden = true;

        const queryClass = ctx?.query?.get('turma');
        if (queryClass && [...classFilter.options].some((option) => option.value === queryClass)) {
          classFilter.value = queryClass;
        }
        applyFilters();
        if (ctx?.query?.get('novo') === '1') openNewAssessment();
      } catch (cause) {
        console.error('Erro ao carregar avaliações:', cause);
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

    newAssessmentButton.addEventListener('click', openNewAssessment);
    page.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-cancel-dialog]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-submissions-close]').addEventListener('click', () => submissionsDialog.close());
    page.querySelector('[data-submissions-close-footer]').addEventListener('click', () => submissionsDialog.close());

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button || button.disabled) return;
      const assessment = assessments.find((item) => item.id === Number(button.dataset.id));
      if (!assessment) return;
      if (button.dataset.action === 'submissions') openSubmissions(assessment);
      if (button.dataset.action === 'close' || button.dataset.action === 'reopen') changeStatus(assessment, button);
    });

    submissionRows.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-grade-student]');
      if (!button || button.disabled || !currentAssessment) return;
      const studentId = Number(button.dataset.gradeStudent);
      const row = button.closest('tr');
      const input = row.querySelector('[data-grade-input]');
      const name = row.querySelector('.assignments-assessments-page__student strong')?.textContent ?? 'aluno';
      button.disabled = true;
      button.textContent = 'Salvando…';
      try {
        const result = await gradeTeacherSubmission(currentAssessment.id, studentId, input.value);
        if (!active) return;
        assessments = assessments.map((item) => (item.id === result.assessment.id ? result.assessment : item));
        currentAssessment = result.assessment;
        currentSubmissions = result.submissions;
        renderSummary();
        applyFilters();
        renderSubmissionsView();
        announceSubmission(`Nota de ${name} registrada.`);
        requestAnimationFrame(() => {
          const target = submissionsDialog.querySelector('[data-grade-input]')
            ?? submissionsDialog.querySelector('[data-submissions-close]');
          target?.focus();
        });
      } catch (cause) {
        announceSubmission(cause.message || 'Não foi possível salvar a nota.', true);
        button.disabled = false;
        button.textContent = 'Salvar nota';
        input.focus();
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError.hidden = true;
      if (!form.reportValidity()) return;
      if (!assessmentClassSelect.value) {
        formError.textContent = 'Selecione a turma da avaliação.';
        formError.hidden = false;
        assessmentClassSelect.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Criando…';
      try {
        const saved = await createTeacherAssessment({
          title: form.elements.title.value.trim(),
          classId: Number(assessmentClassSelect.value),
          type: form.elements.type.value,
          dueDate: new Date(form.elements.dueDate.value).toISOString(),
          weight: Number(form.elements.weight.value) || 0,
          status: form.elements.status.value,
          description: form.elements.description.value.trim(),
        });
        if (!active) return;
        assessments = [saved, ...assessments];
        renderSummary();
        search.value = '';
        classFilter.value = '';
        statusFilter.value = '';
        applyFilters();
        dialog.close();
        announce(`Avaliação "${saved.title}" criada.`);
        newAssessmentButton.focus();
      } catch (cause) {
        formError.textContent = cause.message || 'Não foi possível criar a avaliação.';
        formError.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar avaliação';
      }
    });

    [dialog, submissionsDialog].forEach((element) => {
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
