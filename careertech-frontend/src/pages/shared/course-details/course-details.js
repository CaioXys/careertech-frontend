import html from './course-details.html?raw';
import './course-details.css';

export default {
  title: 'Detalhe do curso (lessons)',
  html,

  /**
   * Chamado depois que o HTML foi inserido na página.
   * @param {HTMLElement} root  elemento onde a tela foi depasswordda
   * @param {{ params: Record<string, string>, query: URLSearchParams }} ctx
   *        params = parâmetros da rota (ex.: /courses/:id -> ctx.params.id)
   * @returns {Function | void} função de limpeza opcional, chamada ao sair da tela
   */
  mount(root, ctx) {
    // Exemplo: root.querySelector('form')?.addEventListener('submit', (e) => { ... });

    return () => {
      // remova aqui listeners globais (window/document), timers, etc.
    };
  },
};
