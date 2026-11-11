import { ROLES } from './roles.js';

/** Itens do menu principal de cada profile (usado pelo layout "app"). */
const shared = {
  home: { label: 'Início', path: '/home' },
  courses: { label: 'Cursos', path: '/courses' },
  classrooms: { label: 'Salas de aula', path: '/classrooms' },
  games: { label: 'Jogos', path: '/games' },
  aiChat: { label: 'Chat IA', path: '/ai-chat' },
  socialNetwork: { label: 'Rede social', path: '/social-network' },
  certifications: { label: 'Certificações', path: '/certifications' },
  profile: { label: 'Perfil', path: '/profile' },
};

export const menuByRole = {
  [ROLES.STUDENT]: [
    shared.home,
    { label: 'Questionário', path: '/career-quiz' },
    { label: 'Mapa de carreira', path: '/career-map' },
    shared.courses,
    shared.classrooms,
    shared.games,
    shared.aiChat,
    shared.socialNetwork,
    shared.certifications,
    shared.profile,
  ],
  [ROLES.TEACHER]: [
    shared.home,
    { label: 'Área do professor', path: '/teacher/dashboard' },
    { label: 'Turmas', path: '/teacher/classes' },
    { label: 'Aulas', path: '/teacher/lessons' },
    { label: 'Avaliações', path: '/teacher/assignments-assessments' },
    { label: 'Alunos', path: '/teacher/students' },
    shared.courses,
    shared.classrooms,
    shared.games,
    shared.aiChat,
    shared.socialNetwork,
    shared.certifications,
    shared.profile,
  ],
  [ROLES.ADMIN]: [
    { label: 'Usuários', path: '/admin/users' },
  ],
};
