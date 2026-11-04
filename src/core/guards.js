import { ROLES } from './roles.js';

/** Página inicial de cada profile, para onde ele vai depois do login. */
export function getHomePath(user) {
  return user?.role === ROLES.ADMIN ? '/admin/users' : '/home';
}

/**
 * Decide se o usuário pode abrir uma rota.
 * Retorna { allowed: true } ou { allowed: false, redirectTo: '/caminho' }.
 *
 * IMPORTANTE: isto só controla a navegação (conveniência). A proteção real
 * dos dados TEM que existir também no back-end, pois qualquer pessoa consegue
 * mexer no JavaScript do navegador.
 */
export function checkAccess(route, user) {
  if (route.public) {
    // Telas como login/register não fazem sentido para quem já está logado.
    if (route.guestOnly && user) {
      return { allowed: false, redirectTo: getHomePath(user) };
    }
    return { allowed: true };
  }

  if (!user) return { allowed: false, redirectTo: '/login' };

  if (route.roles && !route.roles.includes(user.role)) {
    return { allowed: false, redirectTo: getHomePath(user) };
  }

  return { allowed: true };
}
