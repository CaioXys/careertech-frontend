import html from './auth-layout.html?raw';
import './auth-layout.css';

export default {
  html,
  /** Chamado depois que o HTML do layout entrou na página. */
  mount(root) {
    return { outlet: root.querySelector('[data-outlet]'), destroy() {} };
  },
};
