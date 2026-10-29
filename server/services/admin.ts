import crypto from 'crypto';
import { Request } from 'express';

export interface VerifyResult {
  isMatch: boolean;
  matchType?: 'scrypt' | 'trimmed_scrypt' | 'env' | 'legacy_scrypt32' | 'legacy_sha256';
  failureReason?: string;
  diagnostics: {
    inputLength: number;
    hasWhitespacePadding: boolean;
    storedHashLength: number;
    storedSaltLength: number;
    hasStoredHash: boolean;
    hasStoredSalt: boolean;
    isSetupCompleted: boolean;
    bufferLengthsMatch: boolean;
    envPasswordConfigured: boolean;
  };
}

/**
 * Standard scrypt password hashing (64-byte key output in hex = 128 characters)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Timing-safe scrypt password verification helper
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const key = crypto.scryptSync(password, salt, 64);
    const target = Buffer.from(hash, 'hex');
    if (key.length !== target.length) return false;
    return crypto.timingSafeEqual(key, target);
  } catch {
    return false;
  }
}

/**
 * Cryptographic password verification with comprehensive diagnostics
 * Verifies standard scrypt, handles unintended whitespace padding, legacy formats,
 * and environment variable overrides without leaking credentials.
 */
export function verifyPasswordWithDiagnostics(
  inputPassword: string | undefined | null,
  storedHash: string | undefined | null,
  storedSalt: string | undefined | null,
  setupCompleted: boolean,
  envPassword?: string
): VerifyResult {
  const pwd = typeof inputPassword === 'string' ? inputPassword : '';
  const hash = typeof storedHash === 'string' ? storedHash.trim() : '';
  const salt = typeof storedSalt === 'string' ? storedSalt.trim() : '';
  const envPwd = typeof envPassword === 'string' && envPassword.length >= 8 ? envPassword : undefined;

  const keyLen64Bytes = 64;
  const expectedHexLength = keyLen64Bytes * 2; // 128 chars

  const diagnostics = {
    inputLength: pwd.length,
    hasWhitespacePadding: pwd.length > 0 && (pwd !== pwd.trim()),
    storedHashLength: hash.length,
    storedSaltLength: salt.length,
    hasStoredHash: Boolean(hash),
    hasStoredSalt: Boolean(salt),
    isSetupCompleted: Boolean(setupCompleted),
    bufferLengthsMatch: hash.length === expectedHexLength,
    envPasswordConfigured: Boolean(envPwd),
  };

  if (!pwd) {
    return {
      isMatch: false,
      failureReason: 'EMPTY_INPUT_PASSWORD',
      diagnostics,
    };
  }

  // 1. Direct scrypt verification with timing-safe comparison
  if (hash && salt) {
    try {
      const computedKey = crypto.scryptSync(pwd, salt, keyLen64Bytes);
      const targetBuffer = Buffer.from(hash, 'hex');

      if (computedKey.length === targetBuffer.length) {
        if (crypto.timingSafeEqual(computedKey, targetBuffer)) {
          return {
            isMatch: true,
            matchType: 'scrypt',
            diagnostics,
          };
        }
      } else {
        diagnostics.bufferLengthsMatch = false;
      }
    } catch (err: any) {
      return {
        isMatch: false,
        failureReason: `SCRYPT_EXECUTION_ERROR: ${err?.message || 'unknown'}`,
        diagnostics,
      };
    }

    // 2. Check if trimmed input matches (in case owner accidentally copied leading/trailing whitespace)
    if (diagnostics.hasWhitespacePadding) {
      try {
        const computedKeyTrimmed = crypto.scryptSync(pwd.trim(), salt, keyLen64Bytes);
        const targetBuffer = Buffer.from(hash, 'hex');
        if (computedKeyTrimmed.length === targetBuffer.length && crypto.timingSafeEqual(computedKeyTrimmed, targetBuffer)) {
          return {
            isMatch: true,
            matchType: 'trimmed_scrypt',
            diagnostics,
          };
        }
      } catch {
        // ignore
      }
    }

    // 3. Fallback for legacy 32-byte scrypt (64 hex characters)
    if (hash.length === 64) {
      try {
        const computed32 = crypto.scryptSync(pwd, salt, 32);
        const targetBuffer = Buffer.from(hash, 'hex');
        if (computed32.length === targetBuffer.length && crypto.timingSafeEqual(computed32, targetBuffer)) {
          return {
            isMatch: true,
            matchType: 'legacy_scrypt32',
            diagnostics,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  // 4. Check against ADMIN_PASSWORD environment override
  if (envPwd) {
    if (pwd === envPwd || pwd.trim() === envPwd) {
      return {
        isMatch: true,
        matchType: 'env',
        diagnostics,
      };
    }
  }

  // Determine specific reason for failure
  let failureReason = 'CREDENTIAL_HASH_MISMATCH';
  if (!hash || !salt) {
    failureReason = 'MISSING_STORED_CREDENTIALS';
  } else if (!diagnostics.bufferLengthsMatch) {
    failureReason = `HASH_LENGTH_MISMATCH_EXPECTED_${expectedHexLength}_GOT_${hash.length}`;
  }

  return {
    isMatch: false,
    failureReason,
    diagnostics,
  };
}

/**
 * Structured diagnostic logger for failed owner authentication.
 * Formatted to capture exact operational state and root cause without leaking credentials or raw hashes.
 */
export function logAuthFailureDiagnostic(
  req: Request,
  result: VerifyResult,
  clientIp: string,
  rateLimitLocked: boolean
): void {
  const sanitizedLog = {
    event: 'OWNER_AUTH_FAILURE',
    timestamp: new Date().toISOString(),
    ip: clientIp,
    userAgent: req.headers['user-agent'] || 'Unknown',
    failureReason: result.failureReason,
    rateLimitLocked,
    diagnostics: {
      inputPasswordLength: result.diagnostics.inputLength,
      inputHasWhitespacePadding: result.diagnostics.hasWhitespacePadding,
      storedHashPresent: result.diagnostics.hasStoredHash,
      storedHashChars: result.diagnostics.storedHashLength,
      storedSaltPresent: result.diagnostics.hasStoredSalt,
      storedSaltChars: result.diagnostics.storedSaltLength,
      setupCompleted: result.diagnostics.isSetupCompleted,
      envOverrideActive: result.diagnostics.envPasswordConfigured,
      bufferLengthsMatch: result.diagnostics.bufferLengthsMatch,
    },
  };

  console.warn('[AUTH_DIAGNOSTIC]', JSON.stringify(sanitizedLog));
}

/**
 * Generates a cryptographically strong Emergency Master Recovery Key and its scrypt hash.
 */
export function generateNewRecoveryKey(salt: string): { key: string; hash: string } {
  const key = `bts_rec_${crypto.randomBytes(16).toString('hex')}`;
  const hash = hashPassword(key, salt);
  return { key, hash };
}

/**
 * Validates a recovery key against stored hash or server environment secrets.
 */
export function validateRecoveryKey(
  inputKey: string | undefined | null,
  storedRecoveryHash: string | undefined | null,
  salt: string | undefined | null,
  envSecret?: string
): { isValid: boolean; authMethod?: 'recovery_key' | 'environment_setup_secret' } {
  if (!inputKey || typeof inputKey !== 'string') {
    return { isValid: false };
  }

  const cleanedKey = inputKey.trim();

  // 1. Check against environment secrets (ADMIN_SETUP_SECRET, ADMIN_RECOVERY_KEY, OWNER_SECRET)
  if (envSecret && cleanedKey === envSecret.trim()) {
    return { isValid: true, authMethod: 'environment_setup_secret' };
  }

  // 2. Check against stored scrypt hash
  if (storedRecoveryHash && salt && verifyPassword(cleanedKey, storedRecoveryHash, salt)) {
    return { isValid: true, authMethod: 'recovery_key' };
  }

  return { isValid: false };
}
