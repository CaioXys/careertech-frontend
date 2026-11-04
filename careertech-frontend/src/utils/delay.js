/** Espera alguns milissegundos. Usado nos mocks para simular a demora de uma API. */
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
