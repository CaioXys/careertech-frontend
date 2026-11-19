export const mockCertificates = [
  {
    code: 'CT-2026-LOGICA-2B7C',
    status: 'valid',
    studentName: 'Aluno Teste',
    courseTitle: 'Fundamentos da Computação e Lógica de Programação',
    institution: 'CareerTech',
    workloadHours: 40,
    issuedAt: '2026-09-28',
    completedAt: '2026-09-26',
    certificateType: 'Curso livre',
  },
  {
    code: 'CT-2026-ALGORITMOS-4D91',
    status: 'valid',
    studentName: 'Aluno Teste',
    courseTitle: 'Algoritmos e Estruturas de Dados',
    institution: 'CareerTech',
    workloadHours: 40,
    issuedAt: '2026-10-19',
    completedAt: '2026-10-17',
    certificateType: 'Curso livre',
  },
  {
    code: 'CT-2026-FRONT-8F3A',
    status: 'valid',
    studentName: 'Aluno Teste',
    courseTitle: 'HTML e CSS na Prática',
    institution: 'CareerTech',
    workloadHours: 30,
    issuedAt: '2026-10-12',
    completedAt: '2026-10-10',
    certificateType: 'Curso livre',
  },
  {
    code: 'CT-2025-UX-REVOGADO',
    status: 'revoked',
    studentName: 'Mariana Costa',
    courseTitle: 'UX para iniciantes',
    institution: 'CareerTech',
    workloadHours: 30,
    issuedAt: '2025-08-14',
    completedAt: '2025-08-10',
    certificateType: 'Curso livre',
    revokedAt: '2026-02-03',
  },
];

export const certificateCodesByCourseId = {
  1: 'CT-2026-LOGICA-2B7C',
  2: 'CT-2026-ALGORITMOS-4D91',
  4: 'CT-2026-FRONT-8F3A',
};

export function normalizeCertificateCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

export function findCertificateByCode(code) {
  const normalized = normalizeCertificateCode(code);
  return mockCertificates.find((certificate) => certificate.code === normalized) ?? null;
}
