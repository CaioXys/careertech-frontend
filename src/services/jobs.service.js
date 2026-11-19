import { mockJobs } from '../mocks/jobs.js';
import { delay } from '../utils/delay.js';

export async function listJobs() {
  await delay();
  return mockJobs.map((job) => ({ ...job }));
}

export async function getJob(id) {
  await delay();
  const job = mockJobs.find((item) => item.id === id);
  if (!job) throw new Error('Vaga não encontrada.');
  return { ...job };
}
