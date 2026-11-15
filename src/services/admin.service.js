import { config } from '../core/config.js';
import { http } from '../core/http.js';
import { mockCourses } from '../mocks/courses.js';
import { listUsers } from './users.service.js';
import { delay } from '../utils/delay.js';

const state = {
  tracks: [
    { id: 1, nome: 'Desenvolvimento Front-end', area: 'Desenvolvimento', etapas: 4, cursos: 12, status: 'publicada' },
    { id: 2, nome: 'Desenvolvimento Back-end', area: 'Desenvolvimento', etapas: 5, cursos: 15, status: 'publicada' },
    { id: 3, nome: 'Ciência de Dados', area: 'Dados', etapas: 4, cursos: 11, status: 'rascunho' },
    { id: 4, nome: 'Segurança da Informação', area: 'Infraestrutura', etapas: 3, cursos: 9, status: 'publicada' },
  ],
  courses: mockCourses.map((course) => ({
    id: course.id,
    titulo: course.title,
    area: course.area,
    cargaHoraria: course.workloadHours,
    professores: course.teachers.join(', '),
    status: 'publicado',
  })),
  challenges: [
    { id: 1, titulo: 'Desafio de lógica', trilha: 'Desenvolvimento Front-end', habilidade: 'Lógica de programação', tipo: 'Teste', status: 'publicado' },
    { id: 2, titulo: 'Caça-bugs de CSS', trilha: 'Desenvolvimento Front-end', habilidade: 'Estilização', tipo: 'Jogo', status: 'publicado' },
    { id: 3, titulo: 'Quiz de bancos relacionais', trilha: 'Desenvolvimento Back-end', habilidade: 'SQL', tipo: 'Teste', status: 'rascunho' },
    { id: 4, titulo: 'Rota segura', trilha: 'Segurança da Informação', habilidade: 'Criptografia', tipo: 'Jogo', status: 'publicado' },
  ],
  openings: [
    { id: 1, cargo: 'Estágio em Front-end', empresa: 'Nova Web', modelo: 'Remoto', local: 'Brasil', status: 'aberta' },
    { id: 2, cargo: 'Desenvolvedor Júnior', empresa: 'Tech Sul', modelo: 'Híbrido', local: 'Porto Alegre, RS', status: 'aberta' },
    { id: 3, cargo: 'Analista de Dados', empresa: 'DataMine', modelo: 'Presencial', local: 'São Paulo, SP', status: 'encerrada' },
  ],
  mentorships: [
    { id: 1, aluno: 'Ana Souza', mentor: 'Marina Costa', objetivo: 'Carreira em Back-end', status: 'ativa' },
    { id: 2, aluno: 'João Martins', mentor: 'Rafael Lima', objetivo: 'Fundamentos de programação', status: 'ativa' },
    { id: 3, aluno: 'Beatriz Oliveira', mentor: 'Marina Costa', objetivo: 'Preparação para entrevistas', status: 'encerrada' },
  ],
  reports: [
    { id: 1, tipo: 'Publicação', autor: 'João Martins', alvo: 'Publicação #128', motivo: 'Conteúdo ofensivo', status: 'pendente', criadoEm: '2026-11-13T10:00:00.000Z' },
    { id: 2, tipo: 'Comentário', autor: 'Ana Souza', alvo: 'Comentário #45', motivo: 'Spam', status: 'pendente', criadoEm: '2026-11-14T16:30:00.000Z' },
  ],
  notices: [
    { id: 1, titulo: 'Manutenção programada', mensagem: 'A plataforma ficará indisponível no domingo, das 2h às 4h.', inicio: '2026-11-14', fim: '2026-11-16', criadoEm: '2026-11-13T09:00:00.000Z' },
    { id: 2, titulo: 'Novos cursos disponíveis', mensagem: 'Confira as novas trilhas de Ciência de Dados e Segurança.', inicio: '2026-11-10', fim: '2026-11-30', criadoEm: '2026-11-10T09:00:00.000Z' },
  ],
};

const endpoints = {
  tracks: '/admin/tracks',
  courses: '/admin/courses',
  challenges: '/admin/challenges',
  openings: '/admin/openings',
  mentorships: '/admin/mentorships',
  reports: '/admin/reports',
};

export async function getAdminOverview() {
  if (!config.useMocks) return http.get('/admin/overview');
  await delay();
  const users = await listUsers({ page: 1, limit: 100 });
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recent = users.data.filter((user) => {
    const created = new Date(user.criadoEm).getTime();
    return Number.isFinite(created) && created >= monthAgo;
  });
  return {
    totalUsuarios: users.meta?.total ?? users.data.length,
    novosCadastros: recent.length,
    cursosAtivos: state.courses.filter((course) => course.status === 'publicado').length,
    aprovacoesPendentes: users.data.filter((user) => user.role === 'professor' && user.status === 'pendente').length,
    denunciasPendentes: state.reports.filter((report) => report.status === 'pendente').length,
  };
}

export async function listResource(kind) {
  if (!config.useMocks) return http.get(endpoints[kind]);
  await delay();
  return state[kind].map((item) => ({ ...item }));
}

export async function saveResource(kind, item) {
  if (!config.useMocks) {
    return item.id ? http.put(`${endpoints[kind]}/${item.id}`, item) : http.post(endpoints[kind], item);
  }

  await delay();
  const collection = state[kind];
  if (item.id) {
    const index = collection.findIndex((current) => current.id === Number(item.id));
    if (index < 0) throw new Error('Registro não encontrado.');
    collection[index] = { ...collection[index], ...item, id: Number(item.id) };
    return { ...collection[index] };
  }

  const nextId = collection.reduce((max, current) => Math.max(max, current.id), 0) + 1;
  const created = { ...item, id: nextId };
  collection.unshift(created);
  return { ...created };
}

export async function removeResource(kind, id) {
  if (!config.useMocks) return http.delete(`${endpoints[kind]}/${id}`);
  await delay();
  const index = state[kind].findIndex((item) => item.id === Number(id));
  if (index < 0) throw new Error('Registro não encontrado.');
  state[kind].splice(index, 1);
  return { ok: true };
}

export async function resolveReport(id, resolution) {
  if (!config.useMocks) return http.patch(`${endpoints.reports}/${id}`, { resolution });
  await delay();
  const index = state.reports.findIndex((report) => report.id === Number(id));
  if (index < 0) throw new Error('Denúncia não encontrada.');
  state.reports[index] = {
    ...state.reports[index],
    status: resolution === 'removido' ? 'conteudo removido' : 'arquivada',
  };
  return { ...state.reports[index] };
}

export async function listNotices() {
  if (!config.useMocks) return http.get('/admin/notices');
  await delay();
  return state.notices.map((notice) => ({ ...notice }));
}

export async function publishNotice(payload) {
  if (!config.useMocks) return http.post('/admin/notices', payload);
  await delay();
  const nextId = state.notices.reduce((max, notice) => Math.max(max, notice.id), 0) + 1;
  const notice = { ...payload, id: nextId, criadoEm: new Date().toISOString() };
  state.notices.unshift(notice);
  return { ...notice };
}
