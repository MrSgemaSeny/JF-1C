/**
 * Live Rate Limit Lifecycle E2E Suite (Bucket4j Enforcement)
 * Target: https://zhanfinance.fly.dev/api
 */

import { BASE_URL } from './auth-helper.mjs';

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

async function runRateLimitTests() {
  console.log('===============================================================');
  console.log(`Starting Live Rate Limit Lifecycle E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  // Test 1: Rapid check-email requests trigger 429 (Limit: 5 per minute)
  console.log('--- 1. Testing /api/v1/auth/check-email Rate Limiting ---');
  let hit429OnCheckEmail = false;
  let checkEmailStatuses = [];
  
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${BASE_URL}/v1/auth/check-email?email=test.rate${i}@example.com`, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    });
    checkEmailStatuses.push(res.status);
    if (res.status === 429) {
      hit429OnCheckEmail = true;
      break;
    }
  }

  record('1. Rapid requests to /api/v1/auth/check-email trigger HTTP 429', hit429OnCheckEmail, {
    expected: 'HTTP 429 encountered within 8 requests',
    actual: `Statuses: ${checkEmailStatuses.join(', ')}`
  });

  // Test 2: Rapid forgot-password requests trigger 429 (Limit: 3 per 15 minutes)
  console.log('\n--- 2. Testing /api/v1/auth/forgot-password Rate Limiting ---');
  let hit429OnForgotPassword = false;
  let forgotStatuses = [];

  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${BASE_URL}/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: `ratelimit.probe.${Date.now()}.${i}@example.com` })
    });
    forgotStatuses.push(res.status);
    if (res.status === 429) {
      hit429OnForgotPassword = true;
      break;
    }
  }

  record('2. Rapid requests to /api/v1/auth/forgot-password trigger HTTP 429', hit429OnForgotPassword, {
    expected: 'HTTP 429 encountered within 6 requests',
    actual: `Statuses: ${forgotStatuses.join(', ')}`
  });

  // Test 3: Public catalog endpoints are not throttled by auth rate limiter
  console.log('\n--- 3. Testing Public Endpoints Not Throttled by Auth Rate Limiter ---');
  const catalogRes = await fetch(`${BASE_URL}/v1/services`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  record('3. Public catalog /api/v1/services remains accessible (HTTP 200)', catalogRes.status === 200, {
    expected: 200,
    actual: catalogRes.status
  });

  console.log('\n===============================================================');
  console.log(`Rate Limit Lifecycle Suite Completed: ${results.passed} passed, ${results.failed} failed`);
  console.log('===============================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runRateLimitTests().catch(err => {
  console.error('[FATAL] Rate limit lifecycle error:', err);
  process.exit(1);
});
