import html from './users.html?raw';
import './users.css';
import { session } from '../../../core/session.js';
import { listUsers, updateUserStatus } from '../../../services/users.service.js';

const labels = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador', pendente: 'Pendente', ativo: 'Ativo', bloqueado: 'Bloqueado', rejeitado: 'Rejeitado' };
const escapeText = (value) => String(value ?? '');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR').format(date);
}

export default {
  title: 'Gerenciador de usuário',
  html,

  mount(root) {
    const page = root.querySelector('.users-page');
    const form = page.querySelector('[data-user-filters]');
    const search = form.elements.busca;
    const role = form.elements.role;
    const status = form.elements.status;
    const tbody = page.querySelector('[data-user-rows]');
    const summary = page.querySelector('[data-summary]');
    const notice = page.querySelector('[data-notice]');
    const pagination = page.querySelector('[data-pagination]');
    const dialog = page.querySelector('[data-reject-dialog]');
    const reason = dialog.querySelector('[name="motivo"]');
    const currentUserId = Number(session.get()?.user?.id);
    let pageNumber = 1;
    const limit = 10;
    let queryVersion = 0;
    let debounce;
    let pendingRejectId = null;

    const announce = (message, isError = false) => {
      notice.textContent = message;
      notice.classList.toggle('users-page__notice--error', isError);
      notice.hidden = !message;
    };

    function actionButton(text, action, kind = '') {
      const button = element('button', `users-page__action ${kind}`.trim(), text);
      button.type = 'button';
      button.dataset.action = action;
      return button;
    }

    function renderUser(user) {
      const row = element('tr');
      const identity = element('td', 'users-page__identity');
      identity.append(element('strong', '', escapeText(user.nome)), element('span', '', escapeText(user.email)));
      const id = element('td', 'users-page__id', `#${user.id}`);
      const profile = element('td');
      profile.append(element('span', `users-page__role users-page__role--${user.role}`, labels[user.role] ?? user.role));
      const stateCell = element('td');
      const state = element('span', `users-page__status users-page__status--${user.status}`, labels[user.status] ?? user.status);
      stateCell.append(state);
      const date = element('td', 'users-page__date', formatDate(user.criadoEm));
      const actions = element('td', 'users-page__actions');
      actions.setAttribute('aria-label', `Ações para ${escapeText(user.nome)}`);

      const isSelf = user.id === currentUserId;
      if (user.status === 'pendente' && user.role === 'professor') {
        const approve = actionButton('Aprovar', 'approve', 'users-page__action--primary');
        const reject = actionButton('Rejeitar', 'reject', 'users-page__action--danger');
        approve.disabled = isSelf;
        reject.disabled = isSelf;
        actions.append(approve, reject);
      } else if (user.status === 'ativo') {
        const block = actionButton('Bloquear', 'block', 'users-page__action--quiet');
        block.disabled = isSelf;
        if (!isSelf) actions.append(block);
      } else if (user.status === 'bloqueado') {
        const unblock = actionButton('Desbloquear', 'unblock', 'users-page__action--primary');
        unblock.disabled = isSelf;
        if (!isSelf) actions.append(unblock);
      }
      if (user.status === 'rejeitado' && user.motivoRejeicao) actions.append(element('span', 'users-page__reason', `Motivo: ${user.motivoRejeicao}`));
      if (!actions.childElementCount) actions.append(element('span', 'users-page__no-action', isSelf ? 'Sua conta' : 'Sem ações'));

      row.append(identity, id, profile, stateCell, date, actions);
      return row;
    }

    function renderPagination(meta) {
      pagination.replaceChildren();
      const pages = Math.max(1, Math.ceil(meta.total / limit));
      const info = element('span', 'users-page__page-info', `Página ${meta.page} de ${pages}`);
      const previous = element('button', 'users-page__page-button', 'Anterior');
      previous.type = 'button';
      previous.disabled = meta.page <= 1;
      previous.addEventListener('click', () => { pageNumber -= 1; load(); });
      const next = element('button', 'users-page__page-button', 'Próxima');
      next.type = 'button';
      next.disabled = meta.page >= pages;
      next.addEventListener('click', () => { pageNumber += 1; load(); });
      pagination.append(previous, info, next);
    }

    async function load() {
      const version = ++queryVersion;
      tbody.replaceChildren();
      const loading = element('tr', 'users-page__message-row');
      const cell = element('td', '', 'Carregando usuários…');
      cell.colSpan = 6;
      loading.append(cell);
      tbody.append(loading);
      announce('');
      try {
        const result = await listUsers({ busca: search.value.trim(), role: role.value, status: status.value, page: pageNumber, limit });
        if (version !== queryVersion) return;
        const rows = result.data ?? [];
        tbody.replaceChildren();
        if (rows.length) rows.forEach((user) => tbody.append(renderUser(user)));
        else {
          const emptyRow = element('tr', 'users-page__message-row');
          const emptyCell = element('td', '', 'Nenhum usuário encontrado com esses filtros.');
          emptyCell.colSpan = 6;
          emptyRow.append(emptyCell);
          tbody.append(emptyRow);
        }
        const total = result.meta?.total ?? rows.length;
        summary.textContent = `${total} ${total === 1 ? 'usuário' : 'usuários'} encontrados`;
        renderPagination({ page: result.meta?.page ?? pageNumber, total });
      } catch (error) {
        if (version !== queryVersion) return;
        tbody.replaceChildren();
        const row = element('tr', 'users-page__message-row');
        const cell = element('td', '', 'Não foi possível carregar a lista. Tente novamente.');
        cell.colSpan = 6;
        row.append(cell);
        tbody.append(row);
        summary.textContent = 'Lista indisponível';
        announce(error.message || 'Falha ao consultar usuários.', true);
      }
    }

    async function changeStatus(button, id, nextStatus, motivo) {
      const original = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = 'Salvando…';
      }
      announce('');
      try {
        await updateUserStatus(id, nextStatus, motivo);
        announce(nextStatus === 'ativo' ? 'Status atualizado. A conta está ativa.' : nextStatus === 'bloqueado' ? 'Conta bloqueada.' : 'Cadastro rejeitado.');
        await load();
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
        announce(error.message || 'Não foi possível atualizar o status.', true);
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      pageNumber = 1;
      load();
    });
    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { pageNumber = 1; load(); }, 250);
    });
    role.addEventListener('change', () => { pageNumber = 1; load(); });
    status.addEventListener('change', () => { pageNumber = 1; load(); });
    page.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button || button.disabled) return;
      const row = button.closest('tr');
      const id = Number(row.querySelector('.users-page__id').textContent.slice(1));
      if (button.dataset.action === 'approve') changeStatus(button, id, 'ativo');
      if (button.dataset.action === 'block') changeStatus(button, id, 'bloqueado');
      if (button.dataset.action === 'unblock') changeStatus(button, id, 'ativo');
      if (button.dataset.action === 'reject') {
        pendingRejectId = id;
        reason.value = '';
        dialog.showModal();
        reason.focus();
      }
    });
    dialog.addEventListener('close', () => { pendingRejectId = null; });
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('submit', (event) => {
      event.preventDefault();
      const motivo = reason.value.trim();
      if (!motivo) { reason.setCustomValidity('Informe o motivo da rejeição.'); reason.reportValidity(); return; }
      reason.setCustomValidity('');
      const id = pendingRejectId;
      dialog.close();
      changeStatus(null, id, 'rejeitado', motivo);
    });
    reason.addEventListener('input', () => reason.setCustomValidity(''));

    load();
    return () => clearTimeout(debounce);
  },
};
