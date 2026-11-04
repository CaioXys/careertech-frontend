import { config } from './config.js';
import { session } from './session.js';

/**
 * Cliente HTTP para falar com o back-end (quando existir).
 * - Já envia o token JWT no cabeçalho Authorization (papel do "interceptor").
 * - Se a API responder 401 (sessão inválida/expirada), avisa o app via evento.
 */
async function request(method, path, body) {
  const token = session.getToken();

  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('careertech:unauthorized'));
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Erro ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const http = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
