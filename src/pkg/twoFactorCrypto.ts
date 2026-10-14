import crypto from 'crypto';

const BACKUP_CODE_COUNT = 8;

function getEncryptionKey(): Buffer {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(Buffer.from(encryptedHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

function generateBackupCode(): string {
  const part = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${part()}-${part()}`;
}

export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const hashed = plain.map(hashBackupCode);
  return { plain, hashed };
}
