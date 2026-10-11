/**
 * DEMO / MOCK identity & biometric verification.
 *
 * - Nothing here contacts UIDAI or any government service.
 * - Real Aadhaar numbers and real biometrics are never accepted or stored.
 * - Results are returned as short-lived signed "proofs" so a client cannot simply claim
 *   status=VERIFIED when submitting an application.
 *
 * To integrate a real, authorised provider later, implement the same two functions
 * (verifyBiometric, verifyIdentity) in a new provider and select it in `provider()`.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const PROOF_SECRET = `${env.jwtSecret}:mock-proof`;
const MASKED_RE = /^X{4}-X{4}-\d{4}$/;

const signProof = (kind, userId, data) =>
  jwt.sign({ kind, uid: String(userId), demo: true, ...data }, PROOF_SECRET, { expiresIn: '30m' });

const mockProvider = {
  async verifyBiometric(userId) {
    // Simulated scan: a random sample id hashed so no biometric template is ever handled.
    const sampleHash = crypto.createHash('sha256').update(`DEMO-${crypto.randomBytes(16).toString('hex')}`).digest('hex');
    return { isDemo: true, status: 'VERIFIED', sampleHash, proof: signProof('biometric', userId, { sampleHash }) };
  },
  async verifyIdentity(userId, maskedReference) {
    const digitsOnly = String(maskedReference || '').replace(/\D/g, '');
    if (digitsOnly.length >= 9) {
      throw ApiError.validation([{ field: 'maskedReference', message: 'Do not enter a real Aadhaar number. Use the masked format XXXX-XXXX-1234' }]);
    }
    if (!MASKED_RE.test(maskedReference || '')) {
      throw ApiError.validation([{ field: 'maskedReference', message: 'Use the masked format XXXX-XXXX-1234' }]);
    }
    // Demo rule so the failure path can be shown: references ending 0000 "fail".
    const ok = !maskedReference.endsWith('0000');
    return {
      isDemo: true,
      status: ok ? 'VERIFIED' : 'FAILED',
      maskedReference,
      proof: ok ? signProof('identity', userId, { maskedReference }) : undefined,
    };
  },
};

function provider(flag) {
  if (!flag) throw new ApiError(501, 'Real verification providers are not configured. Enable the demo service with MOCK_* = true');
  return mockProvider;
}

const verifyBiometric = (userId) => provider(env.mock.biometric).verifyBiometric(userId);
const verifyIdentity = (userId, ref) => provider(env.mock.aadhaar).verifyIdentity(userId, ref);

// Validates a proof presented at submission time. Returns its payload.
function readProof(token, kind, userId) {
  const field = kind === 'biometric' ? 'biometricProof' : 'identityProof';
  try {
    const p = jwt.verify(token, PROOF_SECRET);
    if (p.kind !== kind || p.uid !== String(userId)) throw new Error('mismatch');
    return p;
  } catch {
    throw ApiError.validation([{ field, message: 'Verification expired or invalid. Please run the demo verification again' }]);
  }
}

module.exports = { verifyBiometric, verifyIdentity, readProof, MASKED_RE };
