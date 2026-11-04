import { session } from './session.js';
import { signIn as signInRequest } from '../services/auth.service.js';

/** Fachada simples para o resto do app saber "quem está logado". */
export const auth = {
  getUser: () => session.get()?.user ?? null,
  isAuthenticated: () => Boolean(session.getToken()),

  /** Faz login (mock ou API real, conforme .env) e guarda a sessão. */
  async signIn(email, password) {
    const data = await signInRequest({ email, password });
    session.set(data);
    return data.user;
  },

  setSession: (data) => session.set(data),
  signOut: () => session.clear(),
};
