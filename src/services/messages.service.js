import { config } from '../core/config.js';
import { http } from '../core/http.js';
import { delay } from '../utils/delay.js';

export const MESSAGES_UNREAD_EVENT = 'careertech:messages-unread';

function countUnread(conversations) {
  return conversations.reduce((total, conversation) => total + (Number(conversation.naoLidas) || 0), 0);
}

function publishUnread(total) {
  document.dispatchEvent(new CustomEvent(MESSAGES_UNREAD_EVENT, { detail: total }));
  return total;
}

const contacts = [
  { id: 11, nome: 'Marina Costa', papel: 'Professora de Banco de Dados', iniciais: 'MC' },
  { id: 12, nome: 'Lucas Martins', papel: 'Professor de Lógica de Programação', iniciais: 'LM' },
  { id: 13, nome: 'Camila Ferreira', papel: 'Professora de HTML e CSS', iniciais: 'CF' },
  { id: 14, nome: 'Rafael Lima', papel: 'Professor de Algoritmos', iniciais: 'RL' },
  { id: 15, nome: 'Ana Souza', papel: 'Estudante de Front-end', iniciais: 'AS' },
];

let mockConversations = [
  {
    id: 1,
    contatoId: 11,
    naoLidas: 1,
    mensagens: [
      { id: 1, autor: 'contato', texto: 'Olá! Vi que você concluiu o módulo de modelagem de dados.', enviadoEm: '2026-11-14T13:20:00.000Z' },
      { id: 2, autor: 'eu', texto: 'Concluí sim! Fiquei com uma dúvida sobre chaves estrangeiras.', enviadoEm: '2026-11-14T13:32:00.000Z' },
      { id: 3, autor: 'contato', texto: 'Posso explicar na próxima aula. Traga um exemplo do seu projeto.', enviadoEm: '2026-11-14T13:35:00.000Z' },
      { id: 4, autor: 'contato', texto: 'Enquanto isso, revise o material da semana 3.', enviadoEm: '2026-11-15T09:05:00.000Z' },
    ],
  },
  {
    id: 2,
    contatoId: 12,
    naoLidas: 0,
    mensagens: [
      { id: 5, autor: 'eu', texto: 'Professor, o desafio de lógica vale XP extra?', enviadoEm: '2026-11-12T18:10:00.000Z' },
      { id: 6, autor: 'contato', texto: 'Vale! A primeira conclusão dá XP completo.', enviadoEm: '2026-11-12T18:22:00.000Z' },
    ],
  },
  {
    id: 3,
    contatoId: 15,
    naoLidas: 0,
    mensagens: [
      { id: 7, autor: 'contato', texto: 'Você vai participar do projeto em grupo de front-end?', enviadoEm: '2026-11-11T15:00:00.000Z' },
      { id: 8, autor: 'eu', texto: 'Sim! Já comecei a montar o layout.', enviadoEm: '2026-11-11T15:12:00.000Z' },
    ],
  },
];

const findContact = (id) => contacts.find((contact) => contact.id === Number(id));
const toConversation = (conversation) => ({
  ...conversation,
  contato: findContact(conversation.contatoId),
  mensagens: conversation.mensagens.map((message) => ({ ...message })),
});

export async function listConversations() {
  if (!config.useMocks) {
    const conversations = await http.get('/messages/conversations');
    publishUnread(countUnread(conversations));
    return conversations;
  }
  await delay();
  const conversations = mockConversations.map(toConversation);
  publishUnread(countUnread(conversations));
  return conversations;
}

export async function getUnreadCount() {
  const conversations = await listConversations();
  return countUnread(conversations);
}

export async function listMessages(conversationId) {
  if (!config.useMocks) return http.get(`/messages/conversations/${conversationId}/messages`);
  await delay();
  const conversation = mockConversations.find((item) => item.id === Number(conversationId));
  if (!conversation) throw new Error('Conversa não encontrada.');
  return conversation.mensagens.map((message) => ({ ...message }));
}

export async function sendMessage(conversationId, texto) {
  if (!config.useMocks) return http.post(`/messages/conversations/${conversationId}/messages`, { texto });
  await delay();
  const conversation = mockConversations.find((item) => item.id === Number(conversationId));
  if (!conversation) throw new Error('Conversa não encontrada.');
  const nextId = mockConversations.flatMap((item) => item.mensagens).reduce((max, message) => Math.max(max, message.id), 0) + 1;
  const message = { id: nextId, autor: 'eu', texto, enviadoEm: new Date().toISOString() };
  conversation.mensagens.push(message);
  return { ...message };
}

export async function markConversationRead(conversationId) {
  if (!config.useMocks) {
    const result = await http.patch(`/messages/conversations/${conversationId}/read`, { read: true });
    await getUnreadCount().catch(() => {});
    return result;
  }
  await delay(80);
  const conversation = mockConversations.find((item) => item.id === Number(conversationId));
  if (conversation) conversation.naoLidas = 0;
  publishUnread(countUnread(mockConversations));
  return { ok: true };
}

export async function listContacts() {
  if (!config.useMocks) return http.get('/messages/contacts');
  await delay();
  return contacts.map((contact) => ({ ...contact }));
}

export async function createConversation(contatoId) {
  if (!config.useMocks) return http.post('/messages/conversations', { contatoId });
  await delay();
  const existing = mockConversations.find((item) => item.contatoId === Number(contatoId));
  if (existing) return toConversation(existing);
  const nextId = mockConversations.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const conversation = { id: nextId, contatoId: Number(contatoId), naoLidas: 0, mensagens: [] };
  mockConversations.push(conversation);
  return toConversation(conversation);
}
