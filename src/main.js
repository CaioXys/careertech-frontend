import './styles/reset.css';
import './styles/tokens.css';
import './styles/base.css';

import { startRouter } from './app/router.js';
import { auth } from './core/auth.js';
import { getHomePath } from './core/guards.js';
import { navigate } from './core/navigate.js';

// A API respondeu 401 (sessão expirada/inválida): encerra a sessão e volta ao login.
window.addEventListener('careertech:unauthorized', () => {
  auth.signOut();
  navigate('/login', { replace: true });
});

// Atalho só para desenvolvimento: no console do navegador, digite
//   careertech.loginAs('student')   |   'teacher'   |   'admin'
// Não existe no build de produção.
if (import.meta.env.DEV) {
  window.careertech = {
    async loginAs(role) {
      const { mockUsers } = await import('./mocks/users.js');
      const found = mockUsers.find((u) => u.role === role);
      if (!found) return console.warn(`Perfil "${role}" não existe. Use: student, teacher ou admin.`);
      const { password: _omit, ...user } = found;
      auth.setSession({ token: `mock-token-${role}`, user });
      const before = location.hash;
      navigate(getHomePath(user));
      // Se já estava na mesma URL, o hash não muda: força a releitura.
      if (location.hash === before) window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
  };
}

startRouter();
