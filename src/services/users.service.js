import { config } from '../core/config.js';
import { http } from '../core/http.js';

// Dados locais para a tela continuar navegável no modo de protótipo.
let mockUsers = [
  { id: 1, nome: 'Ana Souza', email: 'ana.souza@careertech.dev', role: 'aluno', status: 'ativo', criadoEm: '2026-10-18T12:00:00.000Z' },
  {
    id: 2,
    nome: 'Rafael Lima',
    email: 'rafael.lima@careertech.dev',
    role: 'professor',
    status: 'pendente',
    criadoEm: '2026-11-08T12:00:00.000Z',
    telefone: '(11) 98888-1010',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    nascimento: '1990-04-12',
    licenciaturas: [
      { id: 1, curso: 'Licenciatura em Ciência da Computação', instituicao: 'USP', conclusao: 2014, status: 'pendente', comprovante: 'licenciatura-computacao.pdf' },
      { id: 2, curso: 'Licenciatura em Matemática', instituicao: 'UNESP', conclusao: 2018, status: 'pendente', comprovante: 'licenciatura-matematica.pdf' },
    ],
    documentos: [
      { id: 1, nome: 'Documento de identidade', tipo: 'RG', formato: 'PDF', tamanho: '1,2 MB', enviadoEm: '2026-11-08T12:10:00.000Z' },
      { id: 2, nome: 'Comprovante de licenciatura em Ciência da Computação', tipo: 'Licenciatura', formato: 'PDF', tamanho: '850 KB', enviadoEm: '2026-11-08T12:12:00.000Z' },
      { id: 3, nome: 'Comprovante de licenciatura em Matemática', tipo: 'Licenciatura', formato: 'PDF', tamanho: '790 KB', enviadoEm: '2026-11-08T12:14:00.000Z' },
      { id: 4, nome: 'Foto segurando documento', tipo: 'Identificação', formato: 'JPG', tamanho: '2,4 MB', enviadoEm: '2026-11-08T12:15:00.000Z' },
    ],
  },
  {
    id: 3,
    nome: 'Marina Costa',
    email: 'marina.costa@careertech.dev',
    role: 'professor',
    status: 'ativo',
    criadoEm: '2026-10-22T12:00:00.000Z',
    telefone: '(21) 97777-2020',
    cpf: '987.654.321-00',
    rg: '98.765.432-1',
    nascimento: '1987-09-03',
    licenciaturas: [
      { id: 3, curso: 'Licenciatura em Sistemas de Informação', instituicao: 'UFRJ', conclusao: 2010, status: 'aprovada', comprovante: 'licenciatura-si.pdf' },
    ],
    documentos: [
      { id: 5, nome: 'Documento de identidade', tipo: 'RG', formato: 'PDF', tamanho: '1,1 MB', enviadoEm: '2026-10-22T12:10:00.000Z' },
    ],
  },
  { id: 4, nome: 'João Martins', email: 'joao.martins@careertech.dev', role: 'aluno', status: 'bloqueado', criadoEm: '2026-09-30T12:00:00.000Z' },
  {
    id: 5,
    nome: 'Beatriz Oliveira',
    email: 'beatriz.oliveira@careertech.dev',
    role: 'professor',
    status: 'rejeitado',
    motivoRejeicao: 'Comprovação profissional ilegível.',
    criadoEm: '2026-11-02T12:00:00.000Z',
    telefone: '(31) 96666-3030',
    cpf: '111.222.333-44',
    rg: '11.222.333-4',
    nascimento: '1992-01-25',
    licenciaturas: [],
    documentos: [],
  },
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

export async function getUser(id) {
  if (!config.useMocks) return http.get(`/users/${id}`);
  const current = mockUsers.find((user) => user.id === Number(id));
  if (!current) throw new Error('Usuário não encontrado.');
  return { ...current };
}

export async function listTeacherDocuments(id) {
  if (!config.useMocks) return http.get(`/users/${id}/documents`);
  const current = mockUsers.find((user) => user.id === Number(id));
  if (!current) throw new Error('Usuário não encontrado.');
  return (current.documentos ?? []).map((document) => ({ ...document }));
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
