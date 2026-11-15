import html from './approvals.html?raw';
import './approvals.css';
import { getUser, listTeacherDocuments, listUsers, updateUserStatus } from '../../../services/users.service.js';

const statusLabels = { pendente: 'Pendente', ativo: 'Aprovado', rejeitado: 'Rejeitado' };

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

function definition(label, value) {
  const wrapper = element('div');
  wrapper.append(element('dt', '', label), element('dd', '', value ?? '—'));
  return wrapper;
}

export default {
  title: 'Aprovações de cadastro',
  html,

  mount(root) {
    const page = root.querySelector('.approvals-page');
    const queue = page.querySelector('[data-approval-queue]');
    const queueSummary = page.querySelector('[data-queue-summary]');
    const queueEmpty = page.querySelector('[data-queue-empty]');
    const notice = page.querySelector('[data-notice]');
    const reviewEmpty = page.querySelector('[data-review-empty]');
    const reviewBody = page.querySelector('[data-review-body]');
    const reviewName = page.querySelector('[data-review-name]');
    const reviewEmail = page.querySelector('[data-review-email]');
    const reviewStatus = page.querySelector('[data-review-status]');
    const reviewData = page.querySelector('[data-review-data]');
    const reviewDegrees = page.querySelector('[data-review-degrees]');
    const reviewDocuments = page.querySelector('[data-review-documents]');
    const reviewNotice = page.querySelector('[data-review-notice]');
    const approveButton = page.querySelector('[data-approve]');
    const rejectButton = page.querySelector('[data-reject]');
    const dialog = page.querySelector('[data-reject-dialog]');
    const rejectForm = dialog.querySelector('[data-reject-form]');
    const reason = dialog.querySelector('[name="motivo"]');

    let selectedId = null;
    let pendingRejectId = null;
    let loadVersion = 0;
    let reviewVersion = 0;

    const announce = (target, message, isError = false) => {
      target.textContent = message;
      target.classList.toggle('approvals-page__notice--error', isError);
      target.hidden = !message;
    };

    function selectItem(id) {
      selectedId = id;
      queue.querySelectorAll('[data-id]').forEach((button) => {
        button.setAttribute('aria-current', String(Number(button.dataset.id) === id));
      });
    }

    function showPlaceholder(message) {
      reviewEmpty.textContent = message;
      reviewEmpty.hidden = false;
      reviewBody.hidden = true;
      approveButton.disabled = true;
      rejectButton.disabled = true;
    }

    function renderQueue(users) {
      queue.replaceChildren();
      queueEmpty.hidden = users.length > 0;
      queueSummary.textContent = users.length === 1 ? '1 cadastro pendente' : `${users.length} cadastros pendentes`;

      users.forEach((user) => {
        const item = element('li');
        const button = element('button', 'approvals-page__queue-item');
        button.type = 'button';
        button.dataset.id = String(user.id);
        button.append(
          element('span', 'approvals-page__queue-name', user.nome),
          element('span', 'approvals-page__queue-meta', `${user.email} · ${formatDate(user.criadoEm)}`),
        );
        if (user.id === selectedId) button.setAttribute('aria-current', 'true');
        item.append(button);
        queue.append(item);
      });
    }

    function renderReview(user, documents) {
      reviewEmpty.hidden = true;
      reviewBody.hidden = false;
      reviewName.textContent = user.nome ?? '—';
      reviewEmail.textContent = user.email ?? '—';
      reviewStatus.textContent = statusLabels[user.status] ?? user.status;

      reviewData.replaceChildren(
        definition('Nome completo', user.nome),
        definition('E-mail', user.email),
        definition('Telefone', user.telefone),
        definition('CPF', user.cpf),
        definition('RG', user.rg),
        definition('Data de nascimento', formatDate(user.nascimento)),
        definition('Cadastrado em', formatDate(user.criadoEm)),
      );

      const degrees = user.licenciaturas ?? [];
      reviewDegrees.replaceChildren();
      if (degrees.length) {
        degrees.forEach((degree) => {
          const item = element('li');
          item.append(
            element('strong', '', degree.curso),
            element('span', '', `${degree.instituicao} · conclusão em ${degree.conclusao}`),
          );
          reviewDegrees.append(item);
        });
      } else {
        reviewDegrees.append(element('li', '', 'Nenhuma licenciatura informada.'));
      }

      reviewDocuments.replaceChildren();
      if (documents.length) {
        documents.forEach((document) => {
          const item = element('li', 'approvals-page__document');
          const copy = element('div');
          copy.append(
            element('strong', '', document.nome),
            element('span', '', `${document.tipo} · ${document.formato} · ${document.tamanho} · enviado em ${formatDate(document.enviadoEm)}`),
          );
          const open = element('button', '', 'Visualizar');
          open.type = 'button';
          open.addEventListener('click', () => announce(reviewNotice, `Documento "${document.nome}" disponível para visualização demonstrativa.`));
          item.append(copy, open);
          reviewDocuments.append(item);
        });
      } else {
        reviewDocuments.append(element('li', '', 'Nenhum documento enviado.'));
      }

      announce(reviewNotice, '');
      approveButton.disabled = false;
      rejectButton.disabled = false;
      approveButton.dataset.id = String(user.id);
      rejectButton.dataset.id = String(user.id);
    }

    async function openReview(id) {
      const version = ++reviewVersion;
      selectItem(id);
      showPlaceholder('Carregando dados do cadastro…');
      try {
        const [user, documents] = await Promise.all([getUser(id), listTeacherDocuments(id)]);
        if (version !== reviewVersion) return;
        renderReview(user, documents);
      } catch (error) {
        if (version !== reviewVersion) return;
        showPlaceholder('Não foi possível carregar este cadastro.');
        announce(reviewNotice, error.message || 'Falha ao consultar os dados do cadastro.', true);
      }
    }

    async function loadQueue() {
      const version = ++loadVersion;
      queueSummary.textContent = 'Carregando cadastros…';
      announce(notice, '');
      try {
        const result = await listUsers({ role: 'professor', status: 'pendente', page: 1, limit: 50 });
        if (version !== loadVersion) return;
        const users = result.data ?? [];
        if (selectedId && !users.some((user) => user.id === selectedId)) {
          selectedId = null;
          showPlaceholder('Selecione um cadastro na lista para visualizar os dados e os documentos enviados.');
        }
        renderQueue(users);
      } catch (error) {
        if (version !== loadVersion) return;
        renderQueue([]);
        queueSummary.textContent = 'Fila indisponível';
        announce(notice, error.message || 'Não foi possível carregar os cadastros pendentes.', true);
      }
    }

    async function changeStatus(id, status, motivo) {
      approveButton.disabled = true;
      rejectButton.disabled = true;
      try {
        await updateUserStatus(id, status, motivo);
        announce(notice, status === 'ativo' ? 'Cadastro aprovado. O professor já pode atuar na plataforma.' : 'Cadastro rejeitado. O motivo foi registrado.');
        selectedId = null;
        showPlaceholder('Selecione um cadastro na lista para visualizar os dados e os documentos enviados.');
        await loadQueue();
      } catch (error) {
        approveButton.disabled = false;
        rejectButton.disabled = false;
        announce(reviewNotice, error.message || 'Não foi possível atualizar o cadastro.', true);
      }
    }

    queue.addEventListener('click', (event) => {
      const button = event.target.closest('[data-id]');
      if (button) openReview(Number(button.dataset.id));
    });

    approveButton.addEventListener('click', () => {
      if (!selectedId) return;
      changeStatus(selectedId, 'ativo');
    });

    rejectButton.addEventListener('click', () => {
      if (!selectedId) return;
      pendingRejectId = selectedId;
      reason.value = '';
      reason.setCustomValidity('');
      dialog.showModal();
      reason.focus();
    });

    dialog.addEventListener('close', () => { pendingRejectId = null; });
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
    rejectForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const motivo = reason.value.trim();
      if (!motivo) {
        reason.setCustomValidity('Informe o motivo da rejeição.');
        reason.reportValidity();
        return;
      }
      reason.setCustomValidity('');
      const id = pendingRejectId;
      dialog.close();
      if (id) changeStatus(id, 'rejeitado', motivo);
    });
    reason.addEventListener('input', () => reason.setCustomValidity(''));

    showPlaceholder('Selecione um cadastro na lista para visualizar os dados e os documentos enviados.');
    loadQueue();

    return () => {
      loadVersion += 1;
      reviewVersion += 1;
    };
  },
};
