import { listCourses } from './courses.service.js';
import { buildStudentProgress } from './student-progress.service.js';
import { readCareerQuiz } from '../utils/career-quiz-storage.js';
import { getDemoCourseProgress } from '../utils/course-progress.js';

const frontendCourseIds = [4, 26, 27];
const totalSteps = 6;

const fallbackPaths = [
  { label: 'Desenvolvimento', completed: 3, tone: 'teal' },
  { label: 'Banco de dados', completed: 2, tone: 'indigo' },
  { label: 'Infraestrutura', completed: 1, tone: 'amber' },
];

const quizAreaLabels = {
  pratico: 'Desenvolvimento e Engenharia',
  investigativo: 'Dados e Pesquisa',
  criativo: 'UX / UI Design',
  social: 'Educação e Pessoas',
  empreendedor: 'Negócios e Gestão',
  organizado: 'Operações e Planejamento',
};

const affinityTones = ['teal', 'indigo', 'amber'];

function getQuizAffinities(quiz) {
  const entries = Object.entries(quiz?.scores ?? {});
  const total = entries.reduce((sum, [, score]) => sum + Number(score || 0), 0);
  if (!total) return null;

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, score], index) => ({
      label: quizAreaLabels[key] ?? key,
      percent: Math.round((Number(score) / total) * 100),
      tone: affinityTones[index],
    }));
}

function getFallbackAffinities() {
  return fallbackPaths.map((path, index) => ({
    label: path.label,
    percent: Math.round(60 + (path.completed / 4) * 42),
    tone: affinityTones[index],
  }));
}

function formatDate(date, label) {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    weekday: label ?? date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toUpperCase()
      .slice(0, 3),
  };
}

function buildActivities(currentCourse, nextCourse) {
  const today = new Date();
  const later = new Date(today);
  later.setDate(later.getDate() + 2);

  return [
    {
      ...formatDate(today, 'HOJE'),
      title: `Aula: ${currentCourse.title}`,
      meta: 'Sala de aula · curso em andamento',
    },
    {
      ...formatDate(later),
      title: `Desafio: ${nextCourse.title}`,
      meta: 'Atividade · próxima etapa',
    },
  ];
}

function buildCourses(courses, quiz) {
  const byId = new Map(courses.map((course) => [Number(course.id), course]));
  const currentCourse = frontendCourseIds
    .map((id) => byId.get(id))
    .find(Boolean) ?? courses[0];
  const nextCourse = byId.get(frontendCourseIds[1])
    ?? courses.find((course) => course.id !== currentCourse.id)
    ?? currentCourse;
  const recommendedCourse = byId.get(frontendCourseIds[2])
    ?? courses.find((course) => course.id !== currentCourse.id && course.id !== nextCourse.id)
    ?? nextCourse;

  return {
    currentCourse,
    nextCourse,
    recommendedCourse,
    currentProgress: Math.round(getDemoCourseProgress(currentCourse.id)),
    currentModule: Math.min(totalSteps, Math.max(1, Math.ceil(getDemoCourseProgress(currentCourse.id) / 20))),
    recommendedSource: quiz ? 'Baseado no seu questionário' : 'Sugestão da trilha',
  };
}

export async function getStudentHomeData(user) {
  const courses = await listCourses();
  if (!courses.length) throw new Error('Nenhum curso encontrado.');

  const quiz = readCareerQuiz(user);
  const progress = buildStudentProgress(courses, user, quiz);
  const {
    currentCourse,
    nextCourse,
    recommendedCourse,
    currentProgress,
    currentModule,
    recommendedSource,
  } = buildCourses(courses, quiz);

  const currentStep = Math.min(totalSteps, progress.completedCourses || 1);
  const nextTitle = nextCourse.title.replace(/\s+do zero$/i, '');

  return {
    trail: {
      kicker: `SUA TRILHA · ${String(currentCourse.type ?? currentCourse.area ?? 'Desenvolvimento').toUpperCase()}`,
      title: `Você está na etapa ${currentStep} de ${totalSteps}.`,
      subtitle: `Falta pouco para destravar ${nextTitle}.`,
      courseTitle: currentCourse.title,
      rewardXp: 120,
      progress: currentProgress,
      continueHref: `/courses/${currentCourse.id}`,
    },
    stats: {
      xp: progress.xp,
      level: progress.level,
      missingXp: progress.missingXp,
      streak: progress.streak,
      studyHours: progress.studyHours,
      certificates: progress.certificates,
      certificatesInProgress: progress.certificatesInProgress,
    },
    courses: {
      current: {
        slot: 'current',
        course: currentCourse,
        status: 'EM ANDAMENTO',
        meta: `Módulo ${currentModule} de ${totalSteps}`,
        progress: currentProgress,
      },
      next: {
        slot: 'next',
        course: nextCourse,
        status: 'PRÓXIMO NA TRILHA',
        meta: `Libera ao concluir ${currentCourse.title}`,
        progress: 0,
      },
      recommended: {
        slot: 'recommended',
        course: recommendedCourse,
        status: 'RECOMENDADO PARA VOCÊ',
        meta: recommendedSource,
        progress: 0,
      },
    },
    careers: {
      source: quiz ? 'Resultado do seu questionário' : 'Sugestões com base nos cursos',
      items: getQuizAffinities(quiz) ?? getFallbackAffinities(),
    },
    activities: buildActivities(currentCourse, nextCourse),
  };
}
