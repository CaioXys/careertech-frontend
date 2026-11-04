/**
 * Layouts = a "moldura" que fica em volta das telas.
 *   auth -> telas públicas (login, register...)
 *   app  -> telas internas (menu + cabeçalho + conteúdo)
 * São carregados sob demanda (import dinâmico).
 */
export const layouts = {
  auth: () => import('./auth/auth-layout.js'),
  app: () => import('./app/app-layout.js'),
};
