import html from './messages.html?raw';
import './messages.css';
import {
  createConversation,
  listContacts,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from '../../../services/messages.service.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  return new Intl.DateTimeFormat('pt-BR', sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit' }).format(date);
}

function initials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('') || '—';
}

export default {
  title: 'Mensagens',
  html,

  mount(root) {
    const page = root.querySelector('.messages-page');
    const notice = page.querySelector('[data-notice]');
    const search = page.querySelector('[data-conversation-search]');
    const conversationList = page.querySelector('[data-conversation-list]');
    const conversationEmpty = page.querySelector('[data-conversation-empty]');
    const threadEmpty = page.querySelector('[data-thread-empty]');
    const threadBody = page.querySelector('[data-thread-body]');
    const contactInitials = page.querySelector('[data-contact-initials]');
    const contactName = page.querySelector('[data-contact-name]');
    const contactRole = page.querySelector('[data-contact-role]');
    const messageList = page.querySelector('[data-message-list]');
    const messageForm = page.querySelector('[data-message-form]');
    const messageInput = page.querySelector('[data-message-input]');
    const messageError = page.querySelector('[data-message-error]');
    const sendButton = page.querySelector('[data-message-form] button[type="submit"]');
    const newButton = page.querySelector('[data-new-conversation]');
    const newDialog = page.querySelector('[data-new-dialog]');
    const contactList = page.querySelector('[data-contact-list]');

    let conversations = [];
    let activeId = null;
    let searchTerm = '';
    let messageVersion = 0;

    const announce = (message, isError = false) => {
      notice.textContent = message;
      notice.classList.toggle('messages-page__notice--error', isError);
      notice.hidden = !message;
    };

    const findConversation = (id) => conversations.find((conversation) => conversation.id === Number(id));

    function lastMessage(conversation) {
      const messages = conversation.mensagens ?? [];
      if (!messages.length) return 'Nenhuma mensagem ainda.';
      const last = messages[messages.length - 1];
      return `${last.autor === 'eu' ? 'Você: ' : ''}${last.texto}`;
    }

    function renderConversations() {
      const term = searchTerm.toLocaleLowerCase('pt-BR');
      const visible = conversations.filter((conversation) =>
        !term || String(conversation.contato?.nome ?? '').toLocaleLowerCase('pt-BR').includes(term));
      conversationList.replaceChildren();
      conversationEmpty.hidden = visible.length > 0;

      visible.forEach((conversation) => {
        const item = element('li');
        const button = element('button', 'messages-page__conversation');
        button.type = 'button';
        button.dataset.id = String(conversation.id);
        if (conversation.id === activeId) button.setAttribute('aria-current', 'true');

        const avatar = element('span', 'messages-page__avatar', conversation.contato?.iniciais ?? initials(conversation.contato?.nome));
        avatar.setAttribute('aria-hidden', 'true');

        const copy = element('span', 'messages-page__conversation-copy');
        copy.append(
          element('strong', '', conversation.contato?.nome ?? 'Contato'),
          element('small', '', lastMessage(conversation)),
        );

        const meta = element('span', 'messages-page__conversation-meta');
        const messages = conversation.mensagens ?? [];
        meta.append(element('time', '', messages.length ? formatTime(messages[messages.length - 1].enviadoEm) : ''));
        if (conversation.naoLidas > 0) {
          meta.append(element('span', 'messages-page__unread', String(conversation.naoLidas)));
        }

        button.append(avatar, copy, meta);
        item.append(button);
        conversationList.append(item);
      });
    }

    function renderThread(conversation, messages) {
      threadEmpty.hidden = true;
      threadBody.hidden = false;
      contactInitials.textContent = conversation.contato?.iniciais ?? initials(conversation.contato?.nome);
      contactName.textContent = conversation.contato?.nome ?? 'Contato';
      contactRole.textContent = conversation.contato?.papel ?? '';

      messageList.replaceChildren();
      if (!messages.length) {
        messageList.append(element('li', 'messages-page__empty', 'Nenhuma mensagem ainda. Envie a primeira.'));
        return;
      }

      messages.forEach((message) => {
        const item = element('li', `messages-page__message${message.autor === 'eu' ? ' messages-page__message--mine' : ''}`);
        item.append(
          element('p', '', message.texto),
          element('time', '', formatTime(message.enviadoEm)),
        );
        messageList.append(item);
      });
      messageList.scrollTop = messageList.scrollHeight;
    }

    async function openConversation(id) {
      const conversation = findConversation(id);
      if (!conversation) return;
      activeId = conversation.id;
      conversation.naoLidas = 0;
      renderConversations();
      announce('');
      messageError.hidden = true;
      markConversationRead(conversation.id).catch(() => {});

      const version = ++messageVersion;
      try {
        const messages = await listMessages(conversation.id);
        if (version !== messageVersion) return;
        conversation.mensagens = messages;
        renderThread(conversation, messages);
        renderConversations();
      } catch (error) {
        if (version !== messageVersion) return;
        threadEmpty.hidden = false;
        threadBody.hidden = true;
        announce(error.message || 'Não foi possível carregar a conversa.', true);
      }
    }

    async function loadConversations() {
      conversationList.replaceChildren(element('li', 'messages-page__empty', 'Carregando conversas…'));
      try {
        conversations = await listConversations();
        renderConversations();
      } catch (error) {
        conversationList.replaceChildren();
        conversationEmpty.hidden = false;
        conversationEmpty.textContent = 'Não foi possível carregar as conversas.';
        announce(error.message || 'Falha ao consultar as conversas.', true);
      }
    }

    async function openNewDialog() {
      contactList.replaceChildren(element('li', 'messages-page__empty', 'Carregando contatos…'));
      newDialog.showModal();
      try {
        const contacts = await listContacts();
        contactList.replaceChildren();
        contacts.forEach((contact) => {
          const item = element('li');
          const button = element('button', 'messages-page__contact');
          button.type = 'button';
          button.dataset.contactId = String(contact.id);
          const avatar = element('span', 'messages-page__avatar', contact.iniciais ?? initials(contact.nome));
          avatar.setAttribute('aria-hidden', 'true');
          const copy = element('span');
          copy.append(element('strong', '', contact.nome), element('span', '', contact.papel));
          button.append(avatar, copy);
          item.append(button);
          contactList.append(item);
        });
      } catch (error) {
        contactList.replaceChildren(element('li', 'messages-page__empty', 'Não foi possível carregar os contatos.'));
        announce(error.message || 'Falha ao consultar os contatos.', true);
      }
    }

    conversationList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-id]');
      if (button) openConversation(Number(button.dataset.id));
    });

    search.addEventListener('input', () => {
      searchTerm = search.value.trim();
      renderConversations();
    });

    messageForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const texto = messageInput.value.trim();
      messageError.hidden = true;
      if (!texto) {
        messageError.textContent = 'Escreva uma mensagem antes de enviar.';
        messageError.hidden = false;
        messageInput.focus();
        return;
      }
      if (!activeId) return;

      sendButton.disabled = true;
      try {
        const message = await sendMessage(activeId, texto);
        const conversation = findConversation(activeId);
        if (conversation) {
          conversation.mensagens = [...(conversation.mensagens ?? []), message];
          renderThread(conversation, conversation.mensagens);
          renderConversations();
        }
        messageInput.value = '';
        messageInput.focus();
      } catch (error) {
        messageError.textContent = error.message || 'Não foi possível enviar a mensagem.';
        messageError.hidden = false;
      } finally {
        sendButton.disabled = false;
      }
    });

    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        messageForm.requestSubmit();
      }
    });

    newButton.addEventListener('click', openNewDialog);
    newDialog.querySelector('[data-new-close]').addEventListener('click', () => newDialog.close());

    contactList.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-contact-id]');
      if (!button) return;
      button.disabled = true;
      try {
        const conversation = await createConversation(Number(button.dataset.contactId));
        newDialog.close();
        if (!findConversation(conversation.id)) conversations.unshift(conversation);
        renderConversations();
        await openConversation(conversation.id);
      } catch (error) {
        announce(error.message || 'Não foi possível iniciar a conversa.', true);
        button.disabled = false;
      }
    });

    loadConversations();

    return () => {
      messageVersion += 1;
    };
  },
};
