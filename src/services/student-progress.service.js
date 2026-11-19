import { listCourses } from './courses.service.js';
import { readCareerQuiz } from '../utils/career-quiz-storage.js';
import { getDemoCourseProgress } from '../utils/course-progress.js';

const xpPerCourse = 150;
const studyHoursPerCourse = 4;
const certificateLimit = 6;
const completedCertificates = 2;
const interfaceCourseId = 4;

const medalCatalog = [
  {
    id: 'first-course',
    title: 'Primeiros passos',
    description: 'Conclua seu primeiro curso.',
    rewardXp: 100,
  },
  {
    id: 'logic',
    title: 'Mente lógica',
    description: 'Conclua 3 cursos de fundamentos e lógica.',
    rewardXp: 100,
  },
  {
    id: 'career-quiz',
    title: 'Explorador de carreira',
    description: 'Conclua o questionário vocacional.',
    rewardXp: 75,
  },
  {
    id: 'interface-builder',
    title: 'Construtor de interfaces',
    description: 'Conclua o curso HTML e CSS na prática.',
    rewardXp: 150,
  },
];

function hasQuizResult(quiz) {
  return Boolean(
    quiz
    && Array.isArray(quiz.answers)
    && quiz.answers.length
    && quiz.scores
    && Object.keys(quiz.scores).length,
  );
}

function getMedalProgress(medal, { completedCourses, quizCompleted, interfaceProgress }) {
  switch (medal.id) {
    case 'first-course':
      return Math.min(100, completedCourses * 100);
    case 'logic':
      return Math.min(100, Math.round((completedCourses / 3) * 100));
    case 'career-quiz':
      return quizCompleted ? 100 : 0;
    case 'interface-builder':
      return interfaceProgress;
    default:
      return 0;
  }
}

export function buildStudentProgress(courses, user, quiz = readCareerQuiz(user)) {
  const developmentCourses = courses.filter(
    (course) => String(course.type ?? course.area ?? '').toLowerCase() === 'desenvolvimento',
  );
  const completedCourses = Math.min(3, developmentCourses.length || 0);
  const quizCompleted = hasQuizResult(quiz);
  const hasInterfaceCourse = courses.some((course) => Number(course.id) === interfaceCourseId);
  const interfaceProgress = hasInterfaceCourse
    ? Math.round(getDemoCourseProgress(interfaceCourseId))
    : 0;
  const baseXp = completedCourses * xpPerCourse;

  const medals = medalCatalog.map((medal) => {
    const progress = getMedalProgress(medal, {
      completedCourses,
      quizCompleted,
      interfaceProgress,
    });
    return {
      ...medal,
      progress: Math.round(progress),
      unlocked: progress >= 100,
    };
  });

  const medalXp = medals
    .filter((medal) => medal.unlocked)
    .reduce((sum, medal) => sum + medal.rewardXp, 0);
  const xp = baseXp + medalXp;
  const level = Math.max(1, Math.floor(xp / xpPerCourse));
  const nextLevelXp = (level + 1) * xpPerCourse;
  const levelStartXp = level * xpPerCourse;
  const missingXp = Math.max(0, nextLevelXp - xp);
  const levelProgress = Math.min(100, Math.max(0, Math.round(((xp - levelStartXp) / xpPerCourse) * 100)));
  const certificateCourses = courses.slice(0, certificateLimit);
  const certificates = Math.min(completedCertificates, certificateCourses.length);
  const certificatesInProgress = Math.max(0, certificateCourses.length - certificates);
  const unlockedMedals = medals.filter((medal) => medal.unlocked).length;

  return {
    xp,
    baseXp,
    medalXp,
    level,
    nextLevelXp,
    missingXp,
    levelProgress,
    completedCourses,
    streak: Math.min(7, completedCourses + 2),
    studyHours: completedCourses * studyHoursPerCourse,
    certificates,
    certificatesInProgress,
    quizCompleted,
    medals,
    unlockedMedals,
    totalMedals: medals.length,
  };
}

export async function getStudentProgress(user) {
  const courses = await listCourses();
  return buildStudentProgress(courses, user);
}
