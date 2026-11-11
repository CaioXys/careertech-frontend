import { config } from '../core/config.js';
import { http } from '../core/http.js';

// Dados locais para a tela continuar navegável no modo de protótipo.
let mockUsers = [
  { id: 1, nome: 'Ana Souza', email: 'ana.souza@careertech.dev', role: 'aluno', status: 'ativo', criadoEm: '2026-10-18T12:00:00.000Z' },
  { id: 2, nome: 'Rafael Lima', email: 'rafael.lima@careertech.dev', role: 'professor', status: 'pendente', criadoEm: '2026-11-08T12:00:00.000Z' },
  { id: 3, nome: 'Marina Costa', email: 'marina.costa@careertech.dev', role: 'professor', status: 'ativo', criadoEm: '2026-10-22T12:00:00.000Z' },
  { id: 4, nome: 'João Martins', email: 'joao.martins@careertech.dev', role: 'aluno', status: 'bloqueado', criadoEm: '2026-09-30T12:00:00.000Z' },
  { id: 5, nome: 'Beatriz Oliveira', email: 'beatriz.oliveira@careertech.dev', role: 'professor', status: 'rejeitado', motivoRejeicao: 'Comprovação profissional ilegível.', criadoEm: '2026-11-02T12:00:00.000Z' },
  { id: 6, nome: 'Admin CareerTech', email: 'admin@careertech.dev', role: 'admin', status: 'ativo', criadoEm: '2026-01-10T12:00:00.000Z' },
];

export async function listUsers(filters = {}) {
  if (!config.useMocks) {
    const params = new URLSearchParams({ page: String(filters.page ?? 1), limit: String(filters.limit ?? 20) });
    for (const key of ['busca', 'role', 'status']) if (filters[key]) params.set(key, filters[key]);
    return http.get(`/users?${params}`);
  }

  const busca = (filters.busca ?? '').trim().toLocaleLowerCase('pt-BR');
  const filtered = mockUsers.filter((user) =>
    (!filters.role || user.role === filters.role) &&
    (!filters.status || user.status === filters.status) &&
    (!busca || user.nome.toLocaleLowerCase('pt-BR').includes(busca) || user.email.toLocaleLowerCase('pt-BR').includes(busca) || String(user.id).includes(busca)),
  );
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  return { data: filtered.slice((page - 1) * limit, page * limit), meta: { page, limit, total: filtered.length } };
}

export async function updateUserStatus(id, status, motivo) {
  if (!config.useMocks) return http.patch(`/users/${id}/status`, { status, ...(motivo ? { motivo } : {}) });

  const current = mockUsers.find((user) => user.id === id);
  if (!current) throw new Error('Usuário não encontrado.');
  const allowed = { pendente: ['ativo', 'rejeitado'], ativo: ['bloqueado'], bloqueado: ['ativo'], rejeitado: [] };
  if (!allowed[current.status].includes(status)) throw new Error(`Não é possível mudar de "${current.status}" para "${status}".`);
  Object.assign(current, { status, motivoRejeicao: status === 'rejeitado' ? motivo : null });
  return { ...current };
}
