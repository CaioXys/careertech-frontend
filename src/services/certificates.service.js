import { findCertificateByCode } from '../mocks/certificates.js';
import { delay } from '../utils/delay.js';

export async function verifyCertificate(code) {
  await delay(450);
  const certificate = findCertificateByCode(code);
  return certificate ? { ...certificate } : null;
}
