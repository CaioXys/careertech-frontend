import { config } from '../core/config.js';
import { http } from '../core/http.js';
import { mockUsers } from '../mocks/users.js';
import { delay } from '../utils/delay.js';

/**
 * Padrão de TODOS os services: as telas chamam estas funções e não sabem
 * se os dados vêm do mock ou da API. Quando o back-end existir, só o
 * trecho "API real" é usado (VITE_USE_MOCKS=false) e as telas não mudam.
 *
 * Contrato esperado do back-end (a combinar com o time):
 *   POST /auth/login  { email, password }  ->  { token, user: { id, name, email, role } }
 */
export async function signIn({ email, password }) {
  if (config.useMocks) {
    await delay();
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('E-mail ou senha incorretos.');

    const { password: _omit, ...user } = found; // never returns the password
    return { token: `mock-token-${user.role}`, user };
  }

  return http.post('/auth/login', { email, password });
}
