import { config } from '../core/config.js';
import { http } from '../core/http.js';
import { mockUsers } from '../mocks/users.js';
import { delay } from '../utils/delay.js';

/**
 * As telas chamam estas funções sem precisar distinguir mocks da API real.
 * Para usar o back-end CareerTech, configure VITE_USE_MOCKS=false.
 */
export async function signIn({ email, password }) {
  if (config.useMocks) {
    await delay();
    const registeredUsers = JSON.parse(localStorage.getItem('careertech:registered-users') ?? '[]');
    const passwordOverrides = JSON.parse(localStorage.getItem('careertech:password-overrides') ?? '{}');
    const profileOverrides = JSON.parse(localStorage.getItem('careertech:profile-overrides') ?? '{}');
    const found = [...mockUsers, ...registeredUsers].find((u) => (
      (u.email === email || profileOverrides[String(u.id)]?.email === email)
      && (passwordOverrides[u.email] ?? u.password) === password
    ));
    if (!found) throw new Error('E-mail ou senha incorretos.');
    if (found.status === 'pendente') throw new Error('Seu cadastro ainda está em análise pelo administrador.');

    const { password: _omit, ...baseUser } = found; // never returns the password
    const user = { ...baseUser, ...(profileOverrides[String(baseUser.id)] ?? {}) };
    return { token: `mock-token-${user.role}`, user };
  }

  return http.post('/auth/login', { email, password });
}

/** Cria uma conta usando o mesmo contrato de cadastro da API CareerTech. */
export async function signUp(data) {
  if (!config.useMocks) return http.post('/auth/register', data);

  await delay();
  const registeredUsers = JSON.parse(localStorage.getItem('careertech:registered-users') ?? '[]');
  const email = data.email.trim().toLowerCase();
  const cpf = data.cpf.replace(/\D/g, '');
  if ([...mockUsers, ...registeredUsers].some((user) => user.email.toLowerCase() === email || user.cpf === cpf)) {
    throw new Error('Este e-mail já está cadastrado.');
  }

  const user = {
    id: Date.now(),
    name: data.nome.trim(),
    email,
    password: data.senha,
    role: data.tipo === 'professor' ? 'teacher' : 'student',
    cpf,
    status: data.tipo === 'professor' ? 'pendente' : 'ativo',
  };
  localStorage.setItem('careertech:registered-users', JSON.stringify([...registeredUsers, user]));

  return {
    user: { id: user.id, nome: user.name, email: user.email, role: data.tipo, status: data.tipo === 'professor' ? 'pendente' : 'ativo' },
    mensagem: data.tipo === 'professor'
      ? 'Cadastro enviado para aprovação. Você poderá entrar quando o administrador aprovar.'
      : 'Cadastro realizado com sucesso.',
  };
}

/** A recuperação de senha ainda não possui endpoint no backend. */
export async function requestPasswordReset(email) {
  if (!config.useMocks) {
    throw new Error('A recuperação automática de senha ainda não está disponível. Entre em contato com o suporte.');
  }

  await delay();
  return {
    mensagem: `Enviamos um código para ${email}. No protótipo, use 123456 para continuar.`,
  };
}

/** Confere o código temporário usado pelo fluxo demonstrativo. */
export async function verifyPasswordResetCode(email, code) {
  if (!config.useMocks) {
    throw new Error('A validação do código ainda não está disponível no serviço de autenticação.');
  }
  await delay();
  if (code !== '123456') throw new Error('Esse código não está correto. Confira seu e-mail e tente novamente.');
  return { email };
}

/** Atualiza a senha local no modo demonstrativo. */
export async function resetPassword(email, password) {
  if (!config.useMocks) {
    throw new Error('A alteração de senha ainda não está disponível no serviço de autenticação.');
  }
  await delay();
  const registeredUsers = JSON.parse(localStorage.getItem('careertech:registered-users') ?? '[]');
  const registeredUser = registeredUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (registeredUser) {
    registeredUser.password = password;
    localStorage.setItem('careertech:registered-users', JSON.stringify(registeredUsers));
  } else {
    const passwordOverrides = JSON.parse(localStorage.getItem('careertech:password-overrides') ?? '{}');
    passwordOverrides[email] = password;
    localStorage.setItem('careertech:password-overrides', JSON.stringify(passwordOverrides));
  }
  return { mensagem: 'Senha atualizada com sucesso.' };
}
