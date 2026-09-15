/**
 * Live Two-Factor Authentication (2FA) Lifecycle E2E Suite
 * Target: https://zhanfinance.fly.dev/api
 */

import { BASE_URL, request, getAuthActors } from './auth-helper.mjs';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  if (passed) {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${name} — expected ${details.expected}, got ${details.actual}`);
  }
}

async function runTwoFactorTests() {
  console.log('===============================================================');
  console.log(`Starting Live 2FA Lifecycle Suite on ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, clientToken, empToken } = actors;

  // 1. Admin setup endpoint returns secret and QR code URI
  console.log('--- 1. Admin 2FA Setup Generation ---');
  const setupRes = await request('/v1/auth/2fa/setup', { method: 'GET' }, adminToken);
  const secret = setupRes.data?.data?.secret;
  const qrUri = setupRes.data?.data?.qrCodeUri;

  record('1. Admin Requests 2FA Setup (GET /v1/auth/2fa/setup)', setupRes.status === 200 && !!secret && !!qrUri, {
    expected: 'status 200 with secret and qrCodeUri',
    actual: `status ${setupRes.status}, secret: ${secret ? 'present' : 'null'}, qrUri: ${qrUri ? 'present' : 'null'}`
  });

  // 2. Client Role Boundary Rejection: Client cannot access 2FA setup (403 Forbidden)
  console.log('\n--- 2. Non-Admin Role Boundary Verification ---');
  const clientSetupRes = await request('/v1/auth/2fa/setup', { method: 'GET' }, clientToken);
  record('2. Client Forbidden From 2FA Setup (GET /v1/auth/2fa/setup)', clientSetupRes.status === 403, {
    expected: 403,
    actual: clientSetupRes.status
  });

  // 3. Employee Role Boundary Rejection: Employee cannot access 2FA setup (403 Forbidden)
  const empSetupRes = await request('/v1/auth/2fa/setup', { method: 'GET' }, empToken);
  record('3. Employee Forbidden From 2FA Setup (GET /v1/auth/2fa/setup)', empSetupRes.status === 403, {
    expected: 403,
    actual: empSetupRes.status
  });

  // 4. Invalid 2FA Verification code is rejected
  console.log('\n--- 3. Invalid 2FA Verification Handling ---');
  const verifyRes = await request('/v1/auth/2fa/verify', {
    method: 'POST',
    body: {
      preAuthToken: 'dummy-invalid-pre-auth-token-12345',
      code: '000000'
    }
  });
  record('4. Invalid PreAuthToken/Code Rejection (POST /v1/auth/2fa/verify)', verifyRes.status === 400 || verifyRes.status === 401 || verifyRes.status === 404, {
    expected: 'status 400, 401, or 404',
    actual: verifyRes.status
  });

  // 5. Unauthenticated call to setup is rejected (401 / 403)
  const unauthSetupRes = await request('/v1/auth/2fa/setup', { method: 'GET' });
  record('5. Unauthenticated Access Rejected (GET /v1/auth/2fa/setup)', unauthSetupRes.status === 401 || unauthSetupRes.status === 403, {
    expected: 'status 401 or 403',
    actual: unauthSetupRes.status
  });

  console.log('\n===============================================================');
  console.log(`Two-Factor Authentication Suite Completed: ${results.passed} passed, ${results.failed} failed`);
  console.log('===============================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTwoFactorTests().catch(err => {
  console.error('[FATAL] 2FA lifecycle error:', err);
  process.exit(1);
});
