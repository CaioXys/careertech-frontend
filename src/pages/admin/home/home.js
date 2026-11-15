import html from './home.html?raw';
import './home.css';
import { auth } from '../../../core/auth.js';
import { getAdminOverview, listNotices, publishNotice } from '../../../services/admin.service.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR').format(date);
}

export default {
  title: 'Início',
  html,

  mount(root) {
    const page = root.querySelector('.admin-home-page');
    const nameTarget = page.querySelector('[data-admin-name]');
    const notice = page.querySelector('[data-notice]');
    const form = page.querySelector('[data-notice-form]');
    const formError = page.querySelector('[data-notice-error]');
    const noticeList = page.querySelector('[data-notice-list]');

    const user = auth.getUser();
    const firstName = String(user?.name ?? '').trim().split(/\s+/)[0];
    nameTarget.textContent = firstName
      ? firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1)
      : 'administrador(a)';

    const announce = (message, isError = false) => {
      notice.textContent = message;
      notice.classList.toggle('admin-home-page__notice--error', isError);
      notice.hidden = !message;
    };

    async function loadOverview() {
      try {
        const overview = await getAdminOverview();
        Object.entries(overview).forEach(([key, value]) => {
          const target = page.querySelector(`[data-overview="${key}"]`);
          if (target) target.textContent = String(value);
        });
      } catch (error) {
        announce(error.message || 'Não foi possível carregar os indicadores.', true);
      }
    }

    async function loadNotices() {
      noticeList.replaceChildren(element('li', 'admin-home-page__notice-item', 'Carregando comunicados…'));
      try {
        const notices = await listNotices();
        noticeList.replaceChildren();
        if (!notices.length) {
          noticeList.append(element('li', 'admin-home-page__notice-item', 'Nenhum comunicado publicado.'));
          return;
        }
        notices.forEach((item) => {
          const entry = element('li', 'admin-home-page__notice-item');
          entry.append(
            element('strong', '', item.titulo),
            element('p', '', item.mensagem),
            element('span', '', `Exibição: ${formatDate(item.inicio)} a ${formatDate(item.fim)}`),
          );
          noticeList.append(entry);
        });
      } catch (error) {
        noticeList.replaceChildren(element('li', 'admin-home-page__notice-item', 'Não foi possível carregar os comunicados.'));
        announce(error.message || 'Falha ao consultar os comunicados.', true);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const titulo = String(data.get('titulo') ?? '').trim();
      const mensagem = String(data.get('mensagem') ?? '').trim();
      const inicio = String(data.get('inicio') ?? '');
      const fim = String(data.get('fim') ?? '');
      formError.hidden = true;

      if (!titulo || !mensagem) {
        formError.textContent = 'Preencha o título e a mensagem do comunicado.';
        formError.hidden = false;
        return;
      }
      if (inicio && fim && fim < inicio) {
        formError.textContent = 'A data final não pode ser anterior à data inicial.';
        formError.hidden = false;
        return;
      }

      try {
        await publishNotice({ titulo, mensagem, inicio, fim });
        form.reset();
        announce('Comunicado publicado. Ele aparecerá na tela inicial dos usuários no período definido.');
        await loadNotices();
      } catch (error) {
        formError.textContent = error.message || 'Não foi possível publicar o comunicado.';
        formError.hidden = false;
      }
    });

    loadOverview();
    loadNotices();
  },
};
