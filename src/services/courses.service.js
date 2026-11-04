import { config } from '../core/config.js';
import { http } from '../core/http.js';
import { mockCourses } from '../mocks/courses.js';
import { delay } from '../utils/delay.js';

/** Exemplo do padrão mock/API. Copie este arquivo para criar novos services. */

export async function listCourses() {
  if (config.useMocks) {
    await delay();
    return mockCourses;
  }
  return http.get('/courses');
}

export async function getCourse(id) {
  if (config.useMocks) {
    await delay();
    const course = mockCourses.find((c) => c.id === Number(id));
    if (!course) throw new Error('Curso não encontrado.');
    return course;
  }
  return http.get(`/courses/${id}`);
}
