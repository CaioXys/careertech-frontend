export const STUDENT_PROGRESS_EVENT = 'careertech:student-progress-changed';

export function careerQuizStorageKey(user) {
  return `careertech:career-quiz:${user?.id ?? user?.email ?? 'student'}`;
}

export function readCareerQuiz(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(careerQuizStorageKey(user)) ?? 'null');
    if (!saved || typeof saved !== 'object') return null;
    return saved;
  } catch {
    return null;
  }
}

export function notifyStudentProgressChanged() {
  document.dispatchEvent(new CustomEvent(STUDENT_PROGRESS_EVENT));
}
