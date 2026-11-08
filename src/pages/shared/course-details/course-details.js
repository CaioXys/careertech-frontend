import html from './course-details.html?raw';
import './course-details.css';
import { getCourse } from '../../../services/courses.service.js';

export default {
  title: 'Detalhes do curso',
  html,

  mount(root, ctx) {
    const loading = root.querySelector('.course-details-page__loading');
    const error = root.querySelector('.course-details-page__error');
    const content = root.querySelector('.course-details-page__content');
    const title = root.querySelector('.course-details-page__title');
    const description = root.querySelector('.course-details-page__long-description');
    const workload = root.querySelector('.course-details-page__workload');
    const teachers = root.querySelector('.course-details-page__teachers');
    const startButton = root.querySelector('.course-details-page__start');
    const startStatus = root.querySelector('.course-details-page__start-status');
    let active = true;

    function handleStart() {
      startButton.textContent = 'Curso iniciado';
      startButton.disabled = true;
      startStatus.textContent = 'Você iniciou este curso.';
    }

    async function loadCourse() {
      const courseId = Number(ctx?.params?.id);
      if (!Number.isInteger(courseId) || courseId < 1) {
        loading.hidden = true;
        error.hidden = false;
        error.textContent = 'Curso não encontrado.';
        return;
      }

      try {
        const course = await getCourse(courseId);
        if (!active) return;

        title.textContent = course.title;
        description.textContent = course.longDescription ?? course.description;
        const hours = Number(course.workloadHours);
        workload.textContent = Number.isFinite(hours) && hours > 0
          ? `${hours} ${hours === 1 ? 'hora' : 'horas'}`
          : 'Não informada';
        const courseTeachers = Array.isArray(course.teachers) ? course.teachers : [];
        if (courseTeachers.length > 1) {
          const teacherList = document.createElement('ul');
          teacherList.className = 'course-details-page__teachers-list';
          courseTeachers.forEach((teacher) => {
            const teacherItem = document.createElement('li');
            teacherItem.textContent = teacher;
            teacherList.append(teacherItem);
          });
          teachers.replaceChildren(teacherList);
        } else {
          teachers.textContent = courseTeachers[0] ?? 'Não informado';
        }
        loading.hidden = true;
        content.hidden = false;
      } catch {
        if (!active) return;
        loading.hidden = true;
        error.hidden = false;
        error.textContent = 'Não foi possível carregar os dados deste curso.';
      }
    }

    startButton.addEventListener('click', handleStart);
    loadCourse();

    return () => {
      active = false;
      startButton.removeEventListener('click', handleStart);
    };
  },
};
