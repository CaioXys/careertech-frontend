import { config } from '../core/config.js';
import { http } from '../core/http.js';
import {
  mockTeacherAssessments,
  mockTeacherClasses,
  mockTeacherLessons,
  mockTeacherStudents,
} from '../mocks/teacher.js';
import { delay } from '../utils/delay.js';

/**
 * Acesso aos dados da área do professor.
 * Mantém o mesmo contrato das demais telas: mocks agora, API quando VITE_USE_MOCKS=false.
 */

const clone = (value) => structuredClone(value);

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

const findClass = (id) => mockTeacherClasses.find((item) => item.id === Number(id));
const classStudents = (classId) => mockTeacherStudents.filter((student) => student.classId === Number(classId));

function averageProgress(classId, fallback) {
  const students = classStudents(classId);
  if (!students.length) return Number(fallback) || 0;
  return Math.round(students.reduce((total, student) => total + Number(student.progress || 0), 0) / students.length);
}

function enrichClass(item) {
  const students = classStudents(item.id);
  return {
    ...clone(item),
    studentsCount: students.length,
    progress: averageProgress(item.id, item.progress),
  };
}

function enrichStudent(item) {
  const classroom = findClass(item.classId);
  return {
    ...clone(item),
    className: classroom?.name ?? 'Turma não encontrada',
    classCode: classroom?.code ?? '',
  };
}

function enrichLesson(item) {
  const classroom = findClass(item.classId);
  return {
    ...clone(item),
    className: classroom?.name ?? 'Turma não encontrada',
    classCode: classroom?.code ?? '',
  };
}

function enrichAssessment(item) {
  const classroom = findClass(item.classId);
  return {
    ...clone(item),
    className: classroom?.name ?? 'Turma não encontrada',
    classCode: classroom?.code ?? '',
    totalStudents: classStudents(item.classId).length,
  };
}

function sortClasses(a, b) {
  const order = { ativa: 0, planejada: 1, encerrada: 2 };
  return (order[a.status] ?? 3) - (order[b.status] ?? 3) || a.name.localeCompare(b.name, 'pt-BR');
}

function sortLessons(a, b) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function sortAssessments(a, b) {
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

function sortStudents(a, b) {
  return a.name.localeCompare(b.name, 'pt-BR');
}

export async function listTeacherClasses(filters = {}) {
  if (!config.useMocks) return http.get('/teacher/classes');
  await delay();
  const term = normalize(filters.busca);
  return mockTeacherClasses
    .map(enrichClass)
    .filter((item) =>
      (!filters.status || item.status === filters.status) &&
      (!term || [item.name, item.course, item.code, item.period].some((value) => normalize(value).includes(term))),
    )
    .sort(sortClasses);
}

export async function createTeacherClass(payload) {
  if (!config.useMocks) return http.post('/teacher/classes', payload);
  await delay();
  const nextId = Math.max(0, ...mockTeacherClasses.map((item) => item.id)) + 1;
  const classroom = {
    id: nextId,
    name: payload.name,
    courseId: Number(payload.courseId) || null,
    course: payload.course,
    code: payload.code,
    period: payload.period,
    shift: payload.shift,
    schedule: payload.schedule,
    room: payload.room,
    modality: payload.modality ?? 'Presencial',
    status: payload.status ?? 'ativa',
    progress: 0,
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    area: payload.area ?? 'Desenvolvimento',
    nextLesson: null,
  };
  mockTeacherClasses.unshift(classroom);
  return enrichClass(classroom);
}

export async function listTeacherLessons(filters = {}) {
  if (!config.useMocks) return http.get('/teacher/lessons');
  await delay();
  const term = normalize(filters.busca);
  return mockTeacherLessons
    .map(enrichLesson)
    .filter((item) =>
      (!filters.status || item.status === filters.status) &&
      (!filters.classId || item.classId === Number(filters.classId)) &&
      (!term || [item.title, item.module, item.className, item.summary].some((value) => normalize(value).includes(term))),
    )
    .sort(sortLessons);
}

export async function createTeacherLesson(payload) {
  if (!config.useMocks) return http.post('/teacher/lessons', payload);
  await delay();
  const now = new Date().toISOString();
  const nextId = Math.max(0, ...mockTeacherLessons.map((item) => item.id)) + 1;
  const lesson = {
    id: nextId,
    classId: Number(payload.classId),
    title: payload.title,
    module: payload.module,
    type: payload.type,
    durationMin: Number(payload.durationMin) || 0,
    status: payload.status,
    publishedAt: payload.status === 'publicada' ? payload.publishedAt ?? now : payload.publishedAt ?? null,
    updatedAt: now,
    summary: payload.summary ?? '',
  };
  mockTeacherLessons.unshift(lesson);
  return enrichLesson(lesson);
}

export async function updateTeacherLesson(id, payload) {
  if (!config.useMocks) return http.patch(`/teacher/lessons/${id}`, payload);
  await delay();
  const lesson = mockTeacherLessons.find((item) => item.id === Number(id));
  if (!lesson) throw new Error('Aula não encontrada.');
  Object.assign(lesson, {
    classId: Number(payload.classId ?? lesson.classId),
    title: payload.title ?? lesson.title,
    module: payload.module ?? lesson.module,
    type: payload.type ?? lesson.type,
    durationMin: payload.durationMin !== undefined ? Number(payload.durationMin) : lesson.durationMin,
    status: payload.status ?? lesson.status,
    summary: payload.summary ?? lesson.summary,
    updatedAt: new Date().toISOString(),
  });
  if (lesson.status === 'publicada' && !lesson.publishedAt) lesson.publishedAt = new Date().toISOString();
  return enrichLesson(lesson);
}

export async function updateTeacherLessonStatus(id, status) {
  if (!config.useMocks) return http.patch(`/teacher/lessons/${id}/status`, { status });
  return updateTeacherLesson(id, { status });
}

export async function deleteTeacherLesson(id) {
  if (!config.useMocks) return http.delete(`/teacher/lessons/${id}`);
  await delay();
  const index = mockTeacherLessons.findIndex((item) => item.id === Number(id));
  if (index < 0) throw new Error('Aula não encontrada.');
  mockTeacherLessons.splice(index, 1);
  return null;
}

export async function listTeacherAssessments(filters = {}) {
  if (!config.useMocks) return http.get('/teacher/assessments');
  await delay();
  const term = normalize(filters.busca);
  return mockTeacherAssessments
    .map(enrichAssessment)
    .filter((item) =>
      (!filters.status || item.status === filters.status) &&
      (!filters.classId || item.classId === Number(filters.classId)) &&
      (!term || [item.title, item.className, item.description].some((value) => normalize(value).includes(term))),
    )
    .sort(sortAssessments);
}

export async function createTeacherAssessment(payload) {
  if (!config.useMocks) return http.post('/teacher/assessments', payload);
  await delay();
  const nextId = Math.max(0, ...mockTeacherAssessments.map((item) => item.id)) + 1;
  const assessment = {
    id: nextId,
    classId: Number(payload.classId),
    title: payload.title,
    type: payload.type,
    status: payload.status ?? 'aberta',
    dueDate: payload.dueDate,
    weight: Number(payload.weight) || 0,
    submissions: 0,
    graded: 0,
    average: null,
    description: payload.description ?? '',
  };
  mockTeacherAssessments.unshift(assessment);
  return enrichAssessment(assessment);
}

export async function updateTeacherAssessmentStatus(id, status) {
  if (!config.useMocks) return http.patch(`/teacher/assessments/${id}/status`, { status });
  await delay();
  const assessment = mockTeacherAssessments.find((item) => item.id === Number(id));
  if (!assessment) throw new Error('Avaliação não encontrada.');
  assessment.status = status;
  return enrichAssessment(assessment);
}

const submissionCache = new Map();

function buildSubmissions(assessment) {
  const students = classStudents(assessment.classId).sort(sortStudents);
  const baseAverage = Number(assessment.average) || 7.5;
  const due = new Date(assessment.dueDate).getTime();

  return students.map((student, index) => {
    const submitted = index < assessment.submissions;
    const graded = submitted && index < assessment.graded;
    const grade = graded
      ? Math.max(0, Math.min(10, Number((baseAverage + ((index % 5) - 2) * 0.3).toFixed(1))))
      : null;
    return {
      studentId: student.id,
      name: student.name,
      email: student.email,
      submitted,
      submittedAt: submitted ? new Date(due - (index + 1) * 86400000).toISOString() : null,
      status: !submitted ? 'nao_enviada' : graded ? 'corrigida' : 'enviada',
      grade,
    };
  });
}

function getSubmissions(assessment) {
  if (!submissionCache.has(assessment.id)) submissionCache.set(assessment.id, buildSubmissions(assessment));
  return submissionCache.get(assessment.id);
}

export async function listTeacherAssessmentSubmissions(id) {
  if (!config.useMocks) return http.get(`/teacher/assessments/${id}/submissions`);
  await delay();
  const assessment = mockTeacherAssessments.find((item) => item.id === Number(id));
  if (!assessment) throw new Error('Avaliação não encontrada.');
  return { assessment: enrichAssessment(assessment), submissions: clone(getSubmissions(assessment)) };
}

export async function gradeTeacherSubmission(assessmentId, studentId, grade) {
  if (!config.useMocks) {
    return http.post(`/teacher/assessments/${assessmentId}/submissions/${studentId}/grade`, { grade });
  }
  await delay();
  const assessment = mockTeacherAssessments.find((item) => item.id === Number(assessmentId));
  if (!assessment) throw new Error('Avaliação não encontrada.');
  const numericGrade = Number(grade);
  if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 10) {
    throw new Error('Informe uma nota entre 0 e 10.');
  }
  const submissions = getSubmissions(assessment);
  const submission = submissions.find((item) => item.studentId === Number(studentId));
  if (!submission) throw new Error('Entrega não encontrada.');
  if (!submission.submitted) throw new Error('O aluno ainda não enviou esta avaliação.');
  submission.grade = Number(numericGrade.toFixed(1));
  submission.status = 'corrigida';
  const graded = submissions.filter((item) => item.status === 'corrigida');
  assessment.graded = graded.length;
  assessment.average = graded.length
    ? Number((graded.reduce((total, item) => total + item.grade, 0) / graded.length).toFixed(1))
    : null;
  return { assessment: enrichAssessment(assessment), submissions: clone(submissions) };
}

export async function listTeacherStudents(filters = {}) {
  if (!config.useMocks) return http.get('/teacher/students');
  await delay();
  const term = normalize(filters.busca);
  return mockTeacherStudents
    .map(enrichStudent)
    .filter((item) =>
      (!filters.status || item.status === filters.status) &&
      (!filters.classId || item.classId === Number(filters.classId)) &&
      (!term || [item.name, item.email, item.className].some((value) => normalize(value).includes(term))),
    )
    .sort(sortStudents);
}

export async function getTeacherStudent(id) {
  if (!config.useMocks) return http.get(`/teacher/students/${id}`);
  await delay();
  const student = mockTeacherStudents.find((item) => item.id === Number(id));
  if (!student) throw new Error('Aluno não encontrado.');
  return enrichStudent(student);
}

export async function getTeacherDashboard() {
  if (!config.useMocks) return http.get('/teacher/dashboard');
  await delay();

  const classes = mockTeacherClasses.map(enrichClass).sort(sortClasses);
  const lessons = mockTeacherLessons.map(enrichLesson);
  const assessments = mockTeacherAssessments.map(enrichAssessment);
  const students = mockTeacherStudents.map(enrichStudent);

  const activeClasses = classes.filter((item) => item.status === 'ativa');
  const pendingAssessments = assessments
    .filter((item) => item.submissions > item.graded && item.status !== 'agendada')
    .sort(sortAssessments);
  const upcomingLessons = classes
    .filter((item) => item.nextLesson?.date)
    .sort((a, b) => new Date(a.nextLesson.date).getTime() - new Date(b.nextLesson.date).getTime());
  const attentionStudents = students
    .filter((item) => item.status === 'risco' || item.status === 'atencao')
    .sort((a, b) => a.progress - b.progress);

  const averageProgressValue = students.length
    ? Math.round(students.reduce((total, item) => total + item.progress, 0) / students.length)
    : 0;

  return {
    stats: {
      activeClasses: activeClasses.length,
      students: students.length,
      publishedLessons: lessons.filter((item) => item.status === 'publicada').length,
      openAssessments: assessments.filter((item) => item.status === 'aberta' || item.status === 'em_correcao').length,
      pendingReviews: assessments.reduce((total, item) => total + Math.max(0, item.submissions - item.graded), 0),
      averageProgress: averageProgressValue,
    },
    classes,
    lessons: clone(lessons),
    assessments,
    students,
    upcomingLessons: clone(upcomingLessons.slice(0, 4)),
    pendingAssessments: clone(pendingAssessments.slice(0, 4)),
    attentionStudents: clone(attentionStudents.slice(0, 4)),
  };
}
