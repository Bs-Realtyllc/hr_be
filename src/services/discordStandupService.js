const crypto = require('crypto');
const Employee = require('../repositories/employee.repository');
const Standup = require('../models/Standup');

// Ed25519 SubjectPublicKeyInfo DER prefix for wrapping raw 32-byte public keys
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

exports.verifyDiscordSignature = (publicKeyHex, rawBody, signatureHex, timestamp) => {
  try {
    const keyDer = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]);
    const publicKey = crypto.createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
    const message = Buffer.concat([
      Buffer.from(timestamp, 'utf8'),
      Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8'),
    ]);
    return crypto.verify(null, message, publicKey, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
};

exports.findEmployeeByDiscordName = async (discordName) => {
  if (!discordName) return null;

  // 1. Exact match on the discord_username column (most reliable)
  const byUsername = await Employee.findByDiscordUsername(discordName);
  if (byUsername) {
    console.log(`[discord] Matched "${discordName}" via discord_username → ${byUsername.name}`);
    return byUsername;
  }

  // 2. Case-insensitive partial match on the name column (fallback)
  const byName = await Employee.findByNameLike(`%${discordName}%`);
  if (byName) {
    console.log(`[discord] Matched "${discordName}" via name fallback → ${byName.name}`);
    return byName;
  }

  return null;
};

exports.saveStandup = async (employeeId, yesterday, today, blockers) => {
  const date = new Date().toISOString().split('T')[0];
  await Standup.upsert({
    employee_id: employeeId,
    yesterday,
    today,
    blockers: blockers || 'None',
    standup_date: date,
  });
};
