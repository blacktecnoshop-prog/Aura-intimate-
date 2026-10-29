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
  const args = process.argv.slice(2);
  const newPassword = args[0];

  if (!newPassword || newPassword.length < 8) {
    console.error('Error: Please provide a new master password of at least 8 characters.');
    console.error('Usage: npx tsx server/scripts/reset-owner.ts "YourNewPassword123"');
    process.exit(1);
  }

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`Error: store.json not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const store = JSON.parse(raw);

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newPasswordHash = hashPassword(newPassword, newSalt);
  const newRecoveryKey = `bts_rec_${crypto.randomBytes(16).toString('hex')}`;
  const newRecoveryKeyHash = hashPassword(newRecoveryKey, newSalt);

  store.admin = {
    salt: newSalt,
    passwordHash: newPasswordHash,
    recoveryKeyHash: newRecoveryKeyHash,
    setupCompleted: true,
    lastPasswordChange: new Date().toISOString(),
  };

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

  console.log('----------------------------------------------------');
  console.log('✓ Aura Intimates Owner Master Password Updated!');
  console.log('✓ Store data, products, categories, and prices preserved.');
  console.log(`✓ Generated Emergency Recovery Key: ${newRecoveryKey}`);
  console.log('✓ You can now sign in at the Owner Portal.');
  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('Failed to reset owner password:', err);
  process.exit(1);
});
