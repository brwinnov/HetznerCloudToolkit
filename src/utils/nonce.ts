import * as crypto from 'crypto';

/** Cryptographically secure nonce for CSP script-src allowlisting. */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}
