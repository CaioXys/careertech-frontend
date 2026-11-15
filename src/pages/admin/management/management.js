import html from './management.html?raw';
import './management.css';
import { listNotices, listResource, publishNotice, removeResource, resolveReport, saveResource } from '../../../services/admin.service.js';

const entities = {
  tracks: {
    label: 'trilha',
    newLabel: 'Nova trilha',
    title: 'Trilhas de aprendizagem',
    intro: 'Organize as trilhas que estruturam o mapa de carreira.',
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'area', label: 'Área' },
      { key: 'etapas', label: 'Etapas' },
      { key: 'cursos', label: 'Cursos' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true, maxlength: 80 },
      { name: 'area', label: 'Área', type: 'text', required: true, maxlength: 60 },
      { name: 'etapas', label: 'Etapas', type: 'number', required: true, min: 1 },
      { name: 'cursos', label: 'Cursos', type: 'number', required: true, min: 0 },
      { name: 'status', label: 'Status', type: 'select', options: [['publicada', 'Publicada'], ['rascunho', 'Rascunho']] },
    ],
  },
  courses: {
    label: 'curso',
    newLabel: 'Novo curso',
    title: 'Cursos da plataforma',
    intro: 'Mantenha o catálogo de cursos publicado e atualizado.',
    columns: [
      { key: 'titulo', label: 'Título' },
      { key: 'area', label: 'Área' },
      { key: 'cargaHoraria', label: 'Carga horária' },
      { key: 'professores', label: 'Professores' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', required: true, maxlength: 100 },
      { name: 'area', label: 'Área', type: 'text', required: true, maxlength: 60 },
      { name: 'cargaHoraria', label: 'Carga horária (horas)', type: 'number', required: true, min: 1 },
      { name: 'professores', label: 'Professores', type: 'text', maxlength: 120 },
      { name: 'status', label: 'Status', type: 'select', options: [['publicado', 'Publicado'], ['rascunho', 'Rascunho']] },
    ],
  },
  challenges: {
    label: 'desafio',
    newLabel: 'Novo desafio',
    title: 'Desafios e testes de habilidade',
    intro: 'Vincule desafios e testes às trilhas e habilidades avaliadas.',
    columns: [
      { key: 'titulo', label: 'Título' },
      { key: 'trilha', label: 'Trilha' },
      { key: 'habilidade', label: 'Habilidade' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', required: true, maxlength: 100 },
      { name: 'trilha', label: 'Trilha', type: 'text', required: true, maxlength: 80 },
      { name: 'habilidade', label: 'Habilidade avaliada', type: 'text', required: true, maxlength: 80 },
      { name: 'tipo', label: 'Tipo', type: 'select', options: [['Teste', 'Teste'], ['Jogo', 'Jogo']] },
      { name: 'status', label: 'Status', type: 'select', options: [['publicado', 'Publicado'], ['rascunho', 'Rascunho']] },
    ],
  },
  openings: {
    label: 'vaga',
    newLabel: 'Nova vaga',
    title: 'Vagas de emprego',
    intro: 'Publique e encerre as oportunidades exibidas aos estudantes.',
    columns: [
      { key: 'cargo', label: 'Cargo' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'local', label: 'Local' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'cargo', label: 'Cargo', type: 'text', required: true, maxlength: 80 },
      { name: 'empresa', label: 'Empresa', type: 'text', required: true, maxlength: 80 },
      { name: 'modelo', label: 'Modelo de trabalho', type: 'select', options: [['Remoto', 'Remoto'], ['Híbrido', 'Híbrido'], ['Presencial', 'Presencial']] },
      { name: 'local', label: 'Local', type: 'text', maxlength: 80 },
      { name: 'status', label: 'Status', type: 'select', options: [['aberta', 'Aberta'], ['encerrada', 'Encerrada']] },
    ],
  },
  mentorships: {
    label: 'mentoria',
    newLabel: 'Nova mentoria',
    title: 'Mentorias',
    intro: 'Acompanhe as mentorias entre estudantes e profissionais.',
    columns: [
      { key: 'aluno', label: 'Estudante' },
      { key: 'mentor', label: 'Mentor' },
      { key: 'objetivo', label: 'Objetivo' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'aluno', label: 'Estudante', type: 'text', required: true, maxlength: 80 },
      { name: 'mentor', label: 'Mentor', type: 'text', required: true, maxlength: 80 },
      { name: 'objetivo', label: 'Objetivo', type: 'text', required: true, maxlength: 100 },
      { name: 'status', label: 'Status', type: 'select', options: [['ativa', 'Ativa'], ['encerrada', 'Encerrada']] },
    ],
  },
  reports: {
    title: 'Moderação de conteúdo',
    intro: 'Analise as denúncias e remova conteúdos que violem as regras da plataforma.',
    columns: [
      { key: 'tipo', label: 'Tipo' },
      { key: 'autor', label: 'Denunciado por' },
      { key: 'alvo', label: 'Conteúdo' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'criadoEm', label: 'Data', type: 'date' },
    ],
  },
};

const statusTones = {
  publicada: 'success',
  publicado: 'success',
  aberta: 'success',
  ativa: 'success',
  rascunho: 'pending',
  pendente: 'pending',
  encerrada: 'neutral',
  arquivada: 'neutral',
  'conteudo removido': 'danger',
};

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

function statusSlug(status) {
  return String(status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
}

const statusLabels = { 'conteudo removido': 'Conteúdo removido', arquivada: 'Arquivada' };

function statusBadge(status) {
  return element('span', `management-page__badge management-page__badge--${statusTones[status] ?? 'neutral'}`, statusLabels[status] ?? status ?? '—');
}

function itemName(item) {
  return item.nome ?? item.titulo ?? item.cargo ?? item.aluno ?? `#${item.id}`;
}

export default {
  title: 'Gerenciamento da plataforma',
  html,

  mount(root) {
    const page = root.querySelector('.management-page');
    const tabsContainer = page.querySelector('[role="tablist"]');
    const tabs = [...tabsContainer.querySelectorAll('[data-tab]')];
    const panelTitle = page.querySelector('[data-panel-title]');
    const panelIntro = page.querySelector('[data-panel-intro]');
    const newButton = page.querySelector('[data-new]');
    const notice = page.querySelector('[data-notice]');
    const tableWrap = page.querySelector('[data-table-wrap]');
    const table = page.querySelector('table');
    const tableHead = page.querySelector('[data-table-head]');
    const tableBody = page.querySelector('[data-table-body]');
    const empty = page.querySelector('[data-empty]');
    const noticesPanel = page.querySelector('[data-notices-panel]');
    const noticeForm = page.querySelector('[data-notice-form]');
    const noticeError = page.querySelector('[data-notice-error]');
    const noticeList = page.querySelector('[data-notice-list]');
    const editor = page.querySelector('[data-editor-dialog]');
    const editorForm = editor.querySelector('[data-editor-form]');
    const editorTitle = editor.querySelector('[data-editor-title]');
    const editorFields = editor.querySelector('[data-editor-fields]');
    const editorError = editor.querySelector('[data-editor-error]');
    const editorSubmit = editorForm.querySelector('button[type="submit"]');
    const confirmDialog = page.querySelector('[data-confirm-dialog]');
    const confirmMessage = confirmDialog.querySelector('[data-confirm-message]');
    const confirmYes = confirmDialog.querySelector('[data-confirm-yes]');

    const cache = {};
    let active = 'tracks';
    let loadVersion = 0;
    let confirmAction = null;

    const announce = (message, isError = false) => {
      notice.textContent = message;
      notice.classList.toggle('management-page__notice--error', isError);
      notice.hidden = !message;
    };

    function setPanelCopy(config) {
      panelTitle.textContent = config.title;
      panelIntro.textContent = config.intro;
    }

    function renderRows(kind, items) {
      const config = entities[kind];
      tableHead.replaceChildren(headRow(config));
      tableBody.replaceChildren();

      if (!items.length) {
        table.hidden = true;
        empty.hidden = false;
        empty.textContent = 'Nenhum registro encontrado.';
        return;
      }

      table.hidden = false;
      empty.hidden = true;
      items.forEach((item) => tableBody.append(row(kind, item)));
    }

    function headRow(config) {
      const rowElement = element('tr');
      config.columns.forEach((column) => rowElement.append(element('th', '', column.label)));
      rowElement.append(element('th', '', 'Ações'));
      return rowElement;
    }

    function cell(item, column) {
      const cellElement = element('td');
      if (column.type === 'status') cellElement.append(statusBadge(item[column.key]));
      else if (column.type === 'date') cellElement.textContent = formatDate(item[column.key]);
      else cellElement.textContent = item[column.key] ?? '—';
      return cellElement;
    }

    function row(kind, item) {
      const rowElement = element('tr');
      entities[kind].columns.forEach((column) => rowElement.append(cell(item, column)));
      const actions = element('td', 'management-page__row-actions');

      if (kind === 'reports') {
        const remove = element('button', 'management-page__action--danger', 'Remover conteúdo');
        remove.type = 'button';
        remove.dataset.report = 'remove';
        remove.dataset.id = String(item.id);
        const archive = element('button', '', 'Arquivar');
        archive.type = 'button';
        archive.dataset.report = 'archive';
        archive.dataset.id = String(item.id);
        const resolved = item.status !== 'pendente';
        remove.disabled = resolved;
        archive.disabled = resolved;
        actions.append(remove, archive);
      } else {
        const edit = element('button', 'management-page__action--primary', 'Editar');
        edit.type = 'button';
        edit.dataset.action = 'edit';
        edit.dataset.id = String(item.id);
        const remove = element('button', 'management-page__action--danger', 'Remover');
        remove.type = 'button';
        remove.dataset.action = 'remove';
        remove.dataset.id = String(item.id);
        actions.append(edit, remove);
      }

      rowElement.append(actions);
      return rowElement;
    }

    async function loadTable(kind) {
      const version = ++loadVersion;
      table.hidden = false;
      empty.hidden = true;
      tableHead.replaceChildren();
      tableBody.replaceChildren();
      const loadingRow = element('tr');
      const loadingCell = element('td', '', 'Carregando registros…');
      loadingCell.colSpan = (entities[kind].columns.length || 1) + 1;
      loadingRow.append(loadingCell);
      tableBody.append(loadingRow);

      try {
        const items = await listResource(kind);
        if (version !== loadVersion || active !== kind) return;
        cache[kind] = items;
        renderRows(kind, items);
      } catch (error) {
        if (version !== loadVersion || active !== kind) return;
        table.hidden = true;
        empty.hidden = false;
        empty.textContent = 'Não foi possível carregar os registros.';
        announce(error.message || 'Falha ao consultar os registros.', true);
      }
    }

    async function loadNotices() {
      const version = ++loadVersion;
      noticeList.replaceChildren(element('li', 'management-page__notice-item', 'Carregando comunicados…'));
      try {
        const notices = await listNotices();
        if (version !== loadVersion || active !== 'notices') return;
        noticeList.replaceChildren();
        if (!notices.length) {
          noticeList.append(element('li', 'management-page__notice-item', 'Nenhum comunicado publicado.'));
          return;
        }
        notices.forEach((item) => {
          const entry = element('li', 'management-page__notice-item');
          entry.append(
            element('strong', '', item.titulo),
            element('p', '', item.mensagem),
            element('span', '', `Exibição: ${formatDate(item.inicio)} a ${formatDate(item.fim)}`),
          );
          noticeList.append(entry);
        });
      } catch (error) {
        if (version !== loadVersion || active !== 'notices') return;
        noticeList.replaceChildren(element('li', 'management-page__notice-item', 'Não foi possível carregar os comunicados.'));
        announce(error.message || 'Falha ao consultar os comunicados.', true);
      }
    }

    function setActive(kind) {
      active = kind;
      announce('');
      tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === kind)));

      if (kind === 'notices') {
        setPanelCopy({ title: 'Comunicados', intro: 'Publique avisos que aparecem na tela inicial dos usuários e consulte o histórico.' });
        newButton.hidden = true;
        tableWrap.hidden = true;
        noticesPanel.hidden = false;
        loadNotices();
        return;
      }

      const config = entities[kind];
      setPanelCopy(config);
      noticesPanel.hidden = true;
      tableWrap.hidden = false;

      if (kind === 'reports') {
        newButton.hidden = true;
      } else {
        newButton.hidden = false;
        newButton.textContent = config.newLabel;
      }

      loadTable(kind);
    }

    function buildField(field, item) {
      const wrapper = element('label');
      const label = element('span');
      label.append(field.label);
      if (field.required) {
        const mark = element('span', '', ' *');
        mark.setAttribute('aria-hidden', 'true');
        label.append(mark);
      }

      let control;
      if (field.type === 'select') {
        control = element('select');
        field.options.forEach(([value, text]) => {
          const option = element('option', '', text);
          option.value = value;
          control.append(option);
        });
      } else {
        control = element('input');
        control.type = field.type;
        if (field.min !== undefined) control.min = String(field.min);
        if (field.maxlength) control.maxLength = field.maxlength;
      }
      control.name = field.name;
      control.required = Boolean(field.required);
      if (item && item[field.name] !== undefined) control.value = String(item[field.name]);
      else if (field.type === 'select') control.value = field.options[0][0];

      wrapper.append(label, control);
      return wrapper;
    }

    function openEditor(kind, item) {
      const config = entities[kind];
      editorTitle.textContent = item ? `Editar ${config.label}` : config.newLabel;
      editorFields.replaceChildren();
      config.fields.forEach((field) => editorFields.append(buildField(field, item)));
      editor.dataset.kind = kind;
      editor.dataset.id = item ? String(item.id) : '';
      editorError.textContent = '';
      editorError.hidden = true;
      editor.showModal();
      editorFields.querySelector('input, select')?.focus();
    }

    function askConfirm(message, action) {
      confirmMessage.textContent = message;
      confirmAction = action;
      confirmDialog.showModal();
    }

    newButton.addEventListener('click', () => {
      if (entities[active]) openEditor(active, null);
    });

    tabsContainer.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab && tab.dataset.tab !== active) setActive(tab.dataset.tab);
    });

    tableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const id = Number(button.dataset.id);

      if (button.dataset.report) {
        const item = cache.reports?.find((report) => report.id === id);
        const resolution = button.dataset.report;
        askConfirm(
          resolution === 'remove'
            ? `Remover o conteúdo denunciado "${item?.alvo ?? `#${id}`}"?`
            : `Arquivar a denúncia sobre "${item?.alvo ?? `#${id}`}"?`,
          async () => {
            await resolveReport(id, resolution);
            announce(resolution === 'remove' ? 'Conteúdo removido e denúncia encerrada.' : 'Denúncia arquivada.');
            await loadTable('reports');
          },
        );
        return;
      }

      const item = cache[active]?.find((current) => current.id === id);
      if (button.dataset.action === 'edit' && item) openEditor(active, item);
      if (button.dataset.action === 'remove' && item) {
        askConfirm(`Remover ${entities[active].label} "${itemName(item)}"?`, async () => {
          await removeResource(active, id);
          announce('Registro removido.');
          await loadTable(active);
        });
      }
    });

    editorForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!editorForm.reportValidity()) return;
      const kind = editor.dataset.kind;
      const id = editor.dataset.id;
      const data = new FormData(editorForm);
      const payload = {};
      for (const field of entities[kind].fields) {
        const raw = data.get(field.name);
        payload[field.name] = field.type === 'number' ? Number(raw) : String(raw);
      }
      if (id) payload.id = Number(id);

      editorSubmit.disabled = true;
      editorSubmit.textContent = 'Salvando…';
      editorError.hidden = true;
      try {
        await saveResource(kind, payload);
        editor.close();
        announce(id ? 'Registro atualizado.' : 'Registro criado.');
        await loadTable(kind);
      } catch (error) {
        editorError.textContent = error.message || 'Não foi possível salvar o registro.';
        editorError.hidden = false;
      } finally {
        editorSubmit.disabled = false;
        editorSubmit.textContent = 'Salvar';
      }
    });

    editor.querySelector('[data-cancel]').addEventListener('click', () => editor.close());

    confirmDialog.querySelector('[data-confirm-cancel]').addEventListener('click', () => {
      confirmAction = null;
      confirmDialog.close();
    });
    confirmDialog.addEventListener('close', () => { confirmAction = null; });
    confirmYes.addEventListener('click', async () => {
      const action = confirmAction;
      confirmAction = null;
      confirmDialog.close();
      if (!action) return;
      try {
        await action();
      } catch (error) {
        announce(error.message || 'Não foi possível concluir a ação.', true);
      }
    });

    noticeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!noticeForm.reportValidity()) return;
      const data = new FormData(noticeForm);
      const titulo = String(data.get('titulo') ?? '').trim();
      const mensagem = String(data.get('mensagem') ?? '').trim();
      const inicio = String(data.get('inicio') ?? '');
      const fim = String(data.get('fim') ?? '');
      noticeError.hidden = true;

      if (!titulo || !mensagem) {
        noticeError.textContent = 'Preencha o título e a mensagem do comunicado.';
        noticeError.hidden = false;
        return;
      }
      if (inicio && fim && fim < inicio) {
        noticeError.textContent = 'A data final não pode ser anterior à data inicial.';
        noticeError.hidden = false;
        return;
      }

      try {
        await publishNotice({ titulo, mensagem, inicio, fim });
        noticeForm.reset();
        announce('Comunicado publicado. Ele aparecerá na tela inicial dos usuários no período definido.');
        await loadNotices();
      } catch (error) {
        noticeError.textContent = error.message || 'Não foi possível publicar o comunicado.';
        noticeError.hidden = false;
      }
    });

    setActive('tracks');

    return () => {
      loadVersion += 1;
      confirmAction = null;
    };
  },
};
