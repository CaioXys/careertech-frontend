/**
 * Configurações vindas do arquivo .env (variáveis que começam com VITE_).
 * Veja .env.example.
 */
export const config = {
  // Por padrão usa dados falsos, até o back-end existir.
  useMocks: import.meta.env.VITE_USE_MOCKS !== 'false',
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
};
