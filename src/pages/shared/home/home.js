import html from './home.html?raw';
import './home.css';
import { auth } from '../../../core/auth.js';
import { mockCourses } from '../../../mocks/courses.js';

function renderRecommendedCourses(root) {
  const list = root.querySelector('[data-recommended-courses]');

  for (const course of mockCourses) {
    const card = document.createElement('a');
    card.className = 'home-page__recommendation';
    card.href = `#/courses/${encodeURIComponent(course.id)}`;

    const icon = document.createElement('span');
    icon.className = 'home-page__recommendation-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '</>';

    const area = document.createElement('span');
    area.className = 'home-page__recommendation-area';
    area.textContent = course.area;

    const title = document.createElement('h3');
    title.textContent = course.title;

    const workload = document.createElement('p');
    const hours = Number(course.workloadHours);
    workload.textContent = Number.isFinite(hours) && hours > 0
      ? `${hours} ${hours === 1 ? 'hora' : 'horas'} de conteúdo`
      : 'Carga horária não informada';

    const cta = document.createElement('span');
    cta.className = 'home-page__recommendation-cta';
    cta.append('Conhecer curso');
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    cta.append(arrow);

    card.append(icon, area, title, workload, cta);
    list.append(card);
  }
}

export default {
  title: 'Início',
  html,

  mount(root) {
    const user = auth.getUser();
    const profile = user?.role === 'teacher' ? 'teacher' : 'student';
    const firstName = String(user?.name ?? '')
      .trim()
      .split(/\s+/)[0]
      .slice(0, 60);
    const name = firstName
      ? firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1)
      : profile === 'teacher' ? 'professor(a)' : 'estudante';

    root.querySelector('[data-home-name]').textContent = name;
    root.querySelector('[data-home-eyebrow]').textContent = profile === 'teacher'
      ? 'SEU ESPAÇO DE ENSINO'
      : 'SEU ESPAÇO DE APRENDIZAGEM';
    root.querySelector('[data-home-intro]').textContent = profile === 'teacher'
      ? 'Acompanhe suas turmas e organize as próximas atividades.'
      : 'Continue sua jornada e descubra seu próximo passo.';

    root.querySelectorAll('[data-home-profile]').forEach((section) => {
      section.hidden = section.dataset.homeProfile !== profile;
    });

    if (profile === 'student') renderRecommendedCourses(root);
  },
};
