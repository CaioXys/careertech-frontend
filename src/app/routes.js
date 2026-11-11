import { ROLES } from '../core/roles.js';

/**
 * TABELA DE ROTAS: liga cada endereço (#/caminho) a uma tela.
 *
 *   path      endereço. ":id" vira parâmetro (ex.: /courses/:id -> ctx.params.id)
 *   layout    'auth' (telas públicas) ou 'app' (área logada)
 *   public    true = abre sem login
 *   guestOnly true = só para quem NÃO está logado (login, register)
 *   roles     perfis que podem abrir (se omitido, qualquer usuário logado)
 *   load      import dinâmico da tela (só baixa o código quando a rota é aberta)
 *
 * A ordem importa: a primeira rota que combina vence. A '*' (404) fica por último.
 * Para criar uma tela nova:  npm run new:page -- grupo/name-da-tela
 */
const { STUDENT, TEACHER, ADMIN } = ROLES;
const STUDENT_AND_TEACHER = [STUDENT, TEACHER];

export const routes = [
  // ---------- Públicas ----------
  { path: '/login', layout: 'auth', public: true, guestOnly: true, load: () => import('../pages/auth/login/login.js') },
  { path: '/register', layout: 'auth', public: true, guestOnly: true, load: () => import('../pages/auth/register/register.js') },
  { path: '/forgot-password', layout: 'auth', public: true, guestOnly: true, load: () => import('../pages/auth/forgot-password/forgot-password.js') },

  // ---------- Aluno + Professor (telas compartilhadas) ----------
  { path: '/home', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/home/home.js') },
  { path: '/profile', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/profile/profile.js') },
  { path: '/courses', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/courses/courses.js') },
  { path: '/courses/:id', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/course-details/course-details.js') },
  { path: '/classrooms', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/classrooms/classrooms.js') },
  { path: '/classrooms/:id', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/classroom/classroom.js') },
  { path: '/ai-chat', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/ai-chat/ai-chat.js') },
  { path: '/games', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/games/games.js') },
  { path: '/social-network', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/social-network/social-network.js') },
  { path: '/certifications', layout: 'app', roles: STUDENT_AND_TEACHER, load: () => import('../pages/shared/certifications/certifications.js') },

  // ---------- Somente Aluno ----------
  { path: '/career-quiz', layout: 'app', roles: [STUDENT], load: () => import('../pages/student/career-quiz/career-quiz.js') },
  { path: '/career-map', layout: 'app', roles: [STUDENT], load: () => import('../pages/student/career-map/career-map.js') },

  // ---------- Somente Professor ----------
  { path: '/teacher/dashboard', layout: 'app', roles: [TEACHER], load: () => import('../pages/teacher/teacher-dashboard/teacher-dashboard.js') },
  { path: '/teacher/classes', layout: 'app', roles: [TEACHER], load: () => import('../pages/teacher/classes/classes.js') },
  { path: '/teacher/lessons', layout: 'app', roles: [TEACHER], load: () => import('../pages/teacher/lessons/lessons.js') },
  { path: '/teacher/assignments-assessments', layout: 'app', roles: [TEACHER], load: () => import('../pages/teacher/assignments-assessments/assignments-assessments.js') },
  { path: '/teacher/students', layout: 'app', roles: [TEACHER], load: () => import('../pages/teacher/students/students.js') },

  // ---------- Somente Administrador ----------
  { path: '/admin/users', layout: 'app', roles: [ADMIN], load: () => import('../pages/admin/users/users.js') },

  // ---------- 404 (sempre a última) ----------
  { path: '*', layout: 'auth', public: true, load: () => import('../pages/errors/not-found/not-found.js') },
];
