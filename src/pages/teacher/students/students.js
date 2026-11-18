import html from './students.html?raw';
import './students.css';
import { listTeacherClasses, listTeacherStudents } from '../../../services/teacher.service.js';
import { toastError, toastSuccess } from '../../../core/toast.js';
import { formatDate, formatDateTime, formatNumber, formatPercent, formatRelative } from '../../../utils/format.js';

const statusLabels = {
  em_dia: 'Em dia',
  atencao: 'Atenção',
  risco: 'Em risco',
  concluido: 'Concluído',
};

const statusNotes = {
  em_dia: 'O aluno está acompanhando o ritmo esperado da turma. Continue monitorando as entregas e a participação.',
  atencao: 'O progresso está abaixo do esperado. Vale enviar uma mensagem para entender os desafios e retomar o conteúdo.',
  risco: 'O aluno apresenta progresso crítico e baixa participação. Priorize um contato individual e um plano de recuperação.',
  concluido: 'O aluno concluiu o percurso previsto. Você ainda pode acompanhar a média final e registrar feedbacks.',
};

const statusOrder = { risco: 0, atencao: 1, em_dia: 2, concluido: 3 };

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

function initials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('') || '—';
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default {
  title: 'Alunos e progresso',
  html,

  mount(root, ctx) {
    const page = root.querySelector('.students-page');
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
    const rows = page.querySelector('[data-student-rows]');
    const exportButton = page.querySelector('[data-export]');
    const dialog = page.querySelector('[data-student-dialog]');
    const detailAvatar = page.querySelector('[data-detail-avatar]');
    const detailName = page.querySelector('[data-detail-name]');
    const detailEmail = page.querySelector('[data-detail-email]');
    const detailClass = page.querySelector('[data-detail-class]');
    const detailStatus = page.querySelector('[data-detail-status]');
    const detailProgressValue = page.querySelector('[data-detail-progress-value]');
    const detailProgress = page.querySelector('[data-detail-progress]');
    const detailGrade = page.querySelector('[data-detail-grade]');
    const detailAttendance = page.querySelector('[data-detail-attendance]');
    const detailLessons = page.querySelector('[data-detail-lessons]');
    const detailAccess = page.querySelector('[data-detail-access]');
    const detailNote = page.querySelector('[data-detail-note]');
    const detailMessage = page.querySelector('[data-detail-message]');
    let students = [];
    let classes = [];
    let visibleStudents = [];
    let active = true;
    let debounce;

    const announce = (message, isError = false) => {
      if (!message) return;
      if (isError) toastError(message);
      else toastSuccess(message);
    };

    function renderClassOptions() {
      classFilter.replaceChildren(new Option('Todas as turmas', ''));
      classes.forEach((classroom) => {
        classFilter.append(new Option(`${classroom.name} · ${classroom.code}`, String(classroom.id)));
      });
    }

    function renderSummary() {
      const total = students.length;
      const ontrack = students.filter((student) => student.status === 'em_dia').length;
      const attention = students.filter((student) => student.status === 'risco' || student.status === 'atencao').length;
      const concluded = students.filter((student) => student.status === 'concluido').length;
      const average = total ? students.reduce((sum, student) => sum + Number(student.progress || 0), 0) / total : 0;

      page.querySelector('[data-summary-total]').textContent = total;
      page.querySelector('[data-summary-total-meta]').textContent = `${classes.length} turma(s)`;
      page.querySelector('[data-summary-ontrack]').textContent = ontrack;
      page.querySelector('[data-summary-attention]').textContent = attention;
      page.querySelector('[data-summary-progress]').textContent = formatPercent(average);
      page.querySelector('[data-summary-progress-meta]').textContent = concluded ? `${concluded} concluído(s)` : 'Média das turmas';
    }

    function createRow(student) {
      const row = el('tr');

      const studentCell = el('td', 'students-page__student-cell');
      studentCell.append(el('strong', '', student.name), el('span', '', student.email));

      const classCell = el('td', 'students-page__class-cell');
      classCell.append(el('strong', '', student.className), el('span', '', student.classCode));

      const progressCell = el('td', 'students-page__progress-cell');
      const copy = el('div', 'students-page__progress-copy');
      copy.append(el('span', '', 'No curso'), el('b', '', formatPercent(student.progress)));
      const track = el('div', 'students-page__track');
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', `Progresso de ${student.name}`);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(Math.round(student.progress)));
      const fill = el('span');
      fill.style.width = `${Math.max(0, Math.min(100, student.progress))}%`;
      track.append(fill);
      progressCell.append(copy, track);

      const grade = el('td', 'students-page__number', formatNumber(student.grade));
      const attendance = el('td', 'students-page__number', formatPercent(student.attendance));

      const access = el('td', 'students-page__date', formatRelative(student.lastAccess));
      access.title = formatDateTime(student.lastAccess);

      const status = el('td');
      status.append(el('span', `students-page__status students-page__status--${student.status}`, statusLabels[student.status] ?? student.status));

      const actionCell = el('td');
      const action = el('button', 'students-page__row-action', 'Ver detalhes');
      action.type = 'button';
      action.dataset.viewStudent = String(student.id);
      action.setAttribute('aria-label', `Ver detalhes de ${student.name}`);
      actionCell.append(action);

      row.append(studentCell, classCell, progressCell, grade, attendance, access, status, actionCell);
      return row;
    }

    function applyFilters() {
      const term = normalize(search.value);
      visibleStudents = students
        .filter((student) =>
          (!classFilter.value || student.classId === Number(classFilter.value)) &&
          (!statusFilter.value || student.status === statusFilter.value) &&
          (!term || [student.name, student.email, student.className, student.classCode].some((value) => normalize(value).includes(term))),
        )
        .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.name.localeCompare(b.name, 'pt-BR'));

      rows.replaceChildren();
      visibleStudents.forEach((student) => rows.append(createRow(student)));
      count.textContent = `${visibleStudents.length} aluno(s) encontrado(s)`;
      tableCard.hidden = visibleStudents.length === 0;
      empty.hidden = visibleStudents.length > 0;
      emptyText.textContent = students.length === 0
        ? 'Você ainda não tem alunos vinculados às suas turmas.'
        : 'Revise a busca ou os filtros para ver outros alunos.';
      clearFilters.hidden = !search.value && !classFilter.value && !statusFilter.value;
    }

    function openDetails(student) {
      detailAvatar.textContent = initials(student.name);
      detailName.textContent = student.name;
      detailEmail.textContent = student.email;
      detailClass.textContent = `${student.className} · ${student.classCode}`;
      detailStatus.textContent = statusLabels[student.status] ?? student.status;
      detailStatus.className = `students-page__status students-page__status--${student.status}`;
      detailProgressValue.textContent = formatPercent(student.progress);
      detailProgress.setAttribute('aria-valuenow', String(Math.round(student.progress)));
      detailProgress.firstElementChild.style.width = `${Math.max(0, Math.min(100, student.progress))}%`;
      detailGrade.textContent = formatNumber(student.grade);
      detailAttendance.textContent = formatPercent(student.attendance);
      detailLessons.textContent = `${student.completedLessons} de ${student.totalLessons}`;
      detailAccess.textContent = `${formatRelative(student.lastAccess)} · ${formatDate(student.lastAccess)}`;
      detailNote.textContent = statusNotes[student.status] ?? '';
      detailMessage.href = `#/messages?aluno=${student.id}`;
      dialog.showModal();
      dialog.querySelector('[data-detail-close]').focus();
    }

    function exportCsv() {
      if (!visibleStudents.length) {
        announce('Nenhum aluno para exportar com os filtros atuais.', true);
        return;
      }
      const header = ['Nome', 'E-mail', 'Turma', 'Código', 'Progresso (%)', 'Média', 'Presença (%)', 'Último acesso', 'Situação'];
      const lines = visibleStudents.map((student) => [
        student.name,
        student.email,
        student.className,
        student.classCode,
        student.progress,
        formatNumber(student.grade),
        student.attendance,
        formatDateTime(student.lastAccess),
        statusLabels[student.status] ?? student.status,
      ]);
      const content = [header, ...lines].map((line) => line.map(csvCell).join(';')).join('\r\n');
      const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      announce(`Relatório com ${visibleStudents.length} aluno(s) exportado.`);
    }

    async function load() {
      loading.hidden = false;
      error.hidden = true;
      empty.hidden = true;
      tableCard.hidden = true;
      announce('');

      try {
        const [studentList, classList] = await Promise.all([listTeacherStudents(), listTeacherClasses()]);
        if (!active) return;
        students = studentList;
        classes = classList;
        renderClassOptions();
        renderSummary();
        loading.hidden = true;

        const queryClass = ctx?.query?.get('turma');
        if (queryClass && [...classFilter.options].some((option) => option.value === queryClass)) {
          classFilter.value = queryClass;
        }
        applyFilters();

        const queryStudent = Number(ctx?.query?.get('aluno'));
        if (queryStudent) {
          const student = students.find((item) => item.id === queryStudent);
          if (student) openDetails(student);
        }
      } catch (cause) {
        console.error('Erro ao carregar alunos:', cause);
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

    rows.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view-student]');
      if (!button) return;
      const student = students.find((item) => item.id === Number(button.dataset.viewStudent));
      if (student) openDetails(student);
    });

    exportButton.addEventListener('click', exportCsv);
    page.querySelector('[data-detail-close]').addEventListener('click', () => dialog.close());
    page.querySelector('[data-detail-close-footer]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
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
