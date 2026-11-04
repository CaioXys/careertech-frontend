/**
 * Guarda a sessão ({ token, user }) no navegador.
 *
 * ATENÇÃO: localStorage é aceitável só para PROTÓTIPO. Com o back-end real,
 * o ideal é o token ficar em cookie httpOnly (o JavaScript nem consegue ler),
 * porque localStorage pode ser roubado se houver uma falha de XSS.
 */
const KEY = 'careertech:session';

export const session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  },
  set(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  getToken() {
    return this.get()?.token ?? null;
  },
};
