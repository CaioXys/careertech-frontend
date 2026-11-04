/**
 * Navega para outra tela. O app usa rotas com "#" (ex.: index.html#/login),
 * o que funciona em qualquer hospedagem estática sem configuração.
 *
 *   navigate('/courses');
 *   navigate('/login', { replace: true }); // não deixa a página atual no histórico
 */
export function navigate(path, { replace = false } = {}) {
  if (replace) {
    location.replace(`#${path}`);
  } else {
    location.hash = path;
  }
}
