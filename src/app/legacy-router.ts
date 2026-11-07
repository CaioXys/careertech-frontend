import { auth } from '../core/auth.js';
import { getHomePath } from '../core/guards.js';
import { navigate } from '../core/navigate.js';
import { startRouter as startLegacyRouter } from './router.js';

let started = false;

export function startRouter(): void {
  if (started) return;
  started = true;

  window.addEventListener('careertech:unauthorized', () => {
    auth.signOut();
    navigate('/login', { replace: true });
  });

  // Atalho para testar os perfis com os dados falsos durante o desenvolvimento.
  if (import.meta.env.DEV) {
    window.careertech = {
      async loginAs(role: string) {
        const { mockUsers } = await import('../mocks/users.js');
        const found = mockUsers.find((user) => user.role === role);
        if (!found) {
          console.warn(`Perfil "${role}" não existe. Use: student, teacher ou admin.`);
          return;
        }

        const { password: _omit, ...user } = found;
        auth.setSession({ token: `mock-token-${role}`, user });
        const previousHash = location.hash;
        navigate(getHomePath(user));
        if (location.hash === previousHash) window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    };
  }

  startLegacyRouter();
}

declare global {
  interface Window {
    careertech?: { loginAs: (role: string) => Promise<void> };
  }
}
