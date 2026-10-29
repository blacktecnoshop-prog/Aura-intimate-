import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

async function main() {
  if (!fs.existsSync(STORE_PATH)) {
    console.error(`Error: store.json not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const store = JSON.parse(raw);

  if (!store.admin) {
    store.admin = {};
  }

  // Preserve existing salt or create a fresh one if missing
  const salt = store.admin.salt || crypto.randomBytes(16).toString('hex');
  store.admin.salt = salt;

  // Generate cryptographically secure 32-hex (128-bit) recovery key
  const newRecoveryKey = `bts_rec_${crypto.randomBytes(16).toString('hex')}`;
  const newRecoveryKeyHash = hashPassword(newRecoveryKey, salt);

  store.admin.recoveryKeyHash = newRecoveryKeyHash;
  store.admin.lastRecoveryKeyGenerated = new Date().toISOString();

  // If setup was not completed, mark it completed if a passwordHash exists
  if (store.admin.passwordHash) {
    store.admin.setupCompleted = true;
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

  console.log('================================================================');
  console.log('  AURA INTIMATES — EMERGENCY RECOVERY KEY GENERATED');
  console.log('================================================================');
  console.log('');
  console.log('Your new Master Recovery Key is:');
  console.log('');
  console.log(`  \x1b[32m\x1b[1m${newRecoveryKey}\x1b[0m`);
  console.log('');
  console.log('INSTRUCTIONS:');
  console.log('1. Copy and save this key in your password manager immediately.');
  console.log('2. This key is shown ONLY ONCE and is never stored in plaintext.');
  console.log('3. In store.json, only a cryptographic scrypt hash is stored.');
  console.log('4. All previous recovery keys are now permanently invalidated.');
  console.log('5. Use this key on the Owner Login screen ("Forgot Password")');
  console.log('   to reset your master password at any time without email OTP.');
  console.log('');
  console.log('✓ Store data, products, categories, and settings preserved 100%.');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Failed to generate recovery key:', err);
  process.exit(1);
});
