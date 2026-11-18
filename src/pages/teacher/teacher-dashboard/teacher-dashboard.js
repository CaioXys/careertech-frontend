import html from './teacher-dashboard.html?raw';
import './teacher-dashboard.css';
import { auth } from '../../../core/auth.js';
import { getTeacherDashboard } from '../../../services/teacher.service.js';
import { userInitials } from '../../../utils/user-initials.js';
import { formatDay, formatMonth, formatPercent, formatTime } from '../../../utils/format.js';

const classStatusLabels = {
  ativa: 'Turma ativa',
  planejada: 'Turma planejada',
  encerrada: 'Turma encerrada',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function emptyItem(message) {
  const item = el('li');
  item.append(el('p', 'teacher-dashboard-page__empty', message));
  return item;
}

function progressBar(value, label) {
  const track = el('div', 'teacher-dashboard-page__track');
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

function renderAgenda(list, lessons) {
  list.replaceChildren();
  if (!lessons.length) {
    list.append(emptyItem('Nenhuma aula agendada para os próximos dias.'));
    return;
  }

  lessons.forEach((lesson) => {
    const item = el('li');
    const date = el('div', 'teacher-dashboard-page__date');
    date.append(
      el('strong', '', formatDay(lesson.nextLesson.date)),
      el('small', '', formatMonth(lesson.nextLesson.date)),
    );
    date.setAttribute('aria-label', `Aula em ${formatDay(lesson.nextLesson.date)} de ${formatMonth(lesson.nextLesson.date).toLocaleLowerCase('pt-BR')}`);

    const body = el('div', 'teacher-dashboard-page__item-body');
    body.append(
      el('strong', '', lesson.nextLesson.title),
      el('span', '', lesson.name),
      el('small', '', `${lesson.schedule} · ${lesson.room}`),
    );

    item.append(
      date,
      body,
      el('span', 'teacher-dashboard-page__tag', `${formatTime(lesson.nextLesson.date)} · ${lesson.nextLesson.type}`),
    );
    list.append(item);
  });
}

function renderReviews(list, assessments) {
  list.replaceChildren();
  if (!assessments.length) {
    list.append(emptyItem('Nenhuma entrega aguardando correção. Tudo em dia.'));
    return;
  }

  assessments.forEach((assessment) => {
    const item = el('li');
    const body = el('div', 'teacher-dashboard-page__item-body');
    body.append(
      el('strong', '', assessment.title),
      el('span', '', `${assessment.className} · ${assessment.type === 'prova' ? 'Prova' : assessment.type === 'projeto' ? 'Projeto' : 'Atividade'}`),
      el('small', '', `${assessment.submissions - assessment.graded} entrega(s) para corrigir`),
    );

    const percent = assessment.submissions ? (assessment.graded / assessment.submissions) * 100 : 0;
    const progress = el('div', 'teacher-dashboard-page__review-progress');
    progress.append(
      el('small', '', `${assessment.graded} de ${assessment.submissions} corrigidas`),
      progressBar(percent, `Correção de ${assessment.title}`),
    );

    item.append(body, progress);
    list.append(item);
  });
}

function renderClasses(list, classes) {
  list.replaceChildren();
  if (!classes.length) {
    list.append(emptyItem('Você ainda não possui turmas cadastradas.'));
    return;
  }

  classes.forEach((classroom) => {
    const item = el('li');
    const body = el('div', 'teacher-dashboard-page__item-body');
    body.append(
      el('strong', '', classroom.name),
      el('span', '', `${classroom.studentsCount} aluno(s) · ${classroom.period} · ${classroom.shift}`),
      el('span', `teacher-dashboard-page__class-status teacher-dashboard-page__class-status--${classroom.status}`, classStatusLabels[classroom.status] ?? classroom.status),
    );

    const progress = el('div', 'teacher-dashboard-page__class-progress');
    progress.append(
      el('b', '', formatPercent(classroom.progress)),
      progressBar(classroom.progress, `Progresso médio da turma ${classroom.name}`),
    );

    item.append(body, progress);
    list.append(item);
  });
}

function renderAttention(list, students) {
  list.replaceChildren();
  if (!students.length) {
    list.append(emptyItem('Nenhum aluno em situação de atenção no momento.'));
    return;
  }

  students.forEach((student) => {
    const item = el('li');
    const avatar = el('span', 'teacher-dashboard-page__avatar', userInitials(student.name));
    avatar.setAttribute('aria-hidden', 'true');

    const body = el('div', 'teacher-dashboard-page__item-body');
    body.append(
      el('strong', '', student.name),
      el('span', '', student.className),
      el('small', 'teacher-dashboard-page__risk', `${formatPercent(student.progress)} do curso · última atividade ${new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(Math.round((new Date(student.lastAccess).getTime() - Date.now()) / 86400000), 'day')}`),
    );

    const link = el('a', '', 'Acompanhar');
    link.href = `#/teacher/students?aluno=${student.id}`;
    link.setAttribute('aria-label', `Acompanhar ${student.name}`);

    item.append(avatar, body, link);
    list.append(item);
  });
}

export default {
  title: 'Área do professor',
  html,

  mount(root) {
    const page = root.querySelector('.teacher-dashboard-page');
    const content = page.querySelector('[data-content]');
    const loading = page.querySelector('[data-loading]');
    const error = page.querySelector('[data-error]');
    const retry = page.querySelector('[data-retry]');
    const userName = auth.getUser()?.name;
    let active = true;

    page.querySelector('[data-teacher-name]').textContent = userName ?? 'professor(a)';

    const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    page.querySelector('[data-today]').textContent = `${today.charAt(0).toLocaleUpperCase('pt-BR')}${today.slice(1)} · acompanhe o andamento das suas turmas.`;

    async function load() {
      loading.hidden = false;
      error.hidden = true;
      content.hidden = true;
      try {
        const data = await getTeacherDashboard();
        if (!active) return;

        const { stats, classes, lessons, assessments, upcomingLessons, pendingAssessments, attentionStudents } = data;
        const analysisLessons = lessons ?? [];

        page.querySelector('[data-stat-classes]').textContent = stats.activeClasses;
        page.querySelector('[data-stat-classes-meta]').textContent = `${classes.length} turma(s) no total`;
        page.querySelector('[data-stat-students]').textContent = stats.students;
        page.querySelector('[data-stat-students-meta]').textContent = `Progresso médio de ${formatPercent(stats.averageProgress)}`;
        page.querySelector('[data-stat-lessons]').textContent = stats.publishedLessons;
        page.querySelector('[data-stat-lessons-meta]').textContent = `${analysisLessons.filter((item) => item.status !== 'publicada').length} em preparação`;
        page.querySelector('[data-stat-reviews]').textContent = stats.pendingReviews;
        page.querySelector('[data-stat-reviews-meta]').textContent = `${stats.openAssessments} avaliação(ões) em aberto`;

        renderAgenda(page.querySelector('[data-agenda]'), upcomingLessons);
        renderReviews(page.querySelector('[data-reviews]'), pendingAssessments);
        renderClasses(page.querySelector('[data-classes]'), classes);
        renderAttention(page.querySelector('[data-attention]'), attentionStudents);

        loading.hidden = true;
        content.hidden = false;
      } catch (cause) {
        console.error('Erro ao carregar a área do professor:', cause);
        if (!active) return;
        loading.hidden = true;
        error.hidden = false;
      }
    }

    retry.addEventListener('click', load);
    load();

    return () => {
      active = false;
      retry.removeEventListener('click', load);
    };
  },
};
