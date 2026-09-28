/**
 * Live Billing Payment Receipts Lifecycle E2E Suite
 * Target: https://zhanfinance.fly.dev/api
 */

import { BASE_URL, request, getAuthActors, delay } from './auth-helper.mjs';

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
    console.error(`[FAIL] ${name} — expected ${details.expected}, got ${details.actual} (statusText: ${details.statusText || ''})`);
  }
}

async function runBillingPaymentReceiptsTests() {
  console.log('===============================================================');
  console.log(`Starting Live Billing Payment Receipts E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, clientToken, employeeToken } = actors;

  // 1. Client Requests Company Payment Requisites
  const requisitesRes = await request('/v1/billing/receipts/requisites', { method: 'GET' }, clientToken);
  const requisites = requisitesRes.data?.data;
  record('1. Client Fetches Requisites (GET /v1/billing/receipts/requisites)', 
    requisitesRes.status === 200 && requisites && requisites.bin && requisites.iban, {
    expected: 'status 200 with bin and iban',
    actual: `status ${requisitesRes.status}, bin: ${requisites?.bin}, iban: ${requisites?.iban}`
  });

  // 2. Client Queries My Receipts List
  const clientReceiptsRes = await request('/v1/billing/receipts', { method: 'GET' }, clientToken);
  record('2. Client Queries My Receipts (GET /v1/billing/receipts)', 
    clientReceiptsRes.status === 200 && Array.isArray(clientReceiptsRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${clientReceiptsRes.status}, count: ${clientReceiptsRes.data?.data?.length}`
  });

  // 3. Admin Queries All Receipts List
  const adminReceiptsRes = await request('/v1/admin/billing/receipts', { method: 'GET' }, adminToken);
  record('3. Admin Queries All Receipts (GET /v1/admin/billing/receipts)', 
    adminReceiptsRes.status === 200 && Array.isArray(adminReceiptsRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${adminReceiptsRes.status}, count: ${adminReceiptsRes.data?.data?.length}`
  });

  // 4. Admin Queries Receipts Filtered by AWAITING_REVIEW
  const adminAwaitingRes = await request('/v1/admin/billing/receipts?status=AWAITING_REVIEW', { method: 'GET' }, adminToken);
  record('4. Admin Filters Receipts by Status (GET /v1/admin/billing/receipts?status=AWAITING_REVIEW)', 
    adminAwaitingRes.status === 200 && Array.isArray(adminAwaitingRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${adminAwaitingRes.status}, count: ${adminAwaitingRes.data?.data?.length}`
  });

  // 5. Security & RBAC: Client CANNOT Access Admin Moderation Endpoint (403 Forbidden)
  const clientForbiddenRes = await request('/v1/admin/billing/receipts', { method: 'GET' }, clientToken);
  record('5. RBAC: Client Access To Admin Receipts Is Denied (403 Forbidden)', 
    clientForbiddenRes.status === 403, {
    expected: 403,
    actual: clientForbiddenRes.status
  });

  // 6. Security & RBAC: Employee CANNOT Access Admin Moderation Endpoint (403 Forbidden)
  const employeeForbiddenRes = await request('/v1/admin/billing/receipts', { method: 'GET' }, employeeToken);
  record('6. RBAC: Employee Access To Admin Receipts Is Denied (403 Forbidden)', 
    employeeForbiddenRes.status === 403, {
    expected: 403,
    actual: employeeForbiddenRes.status
  });

  // 7. Security: Anonymous Request Without Token Is Rejected (401 Unauthorized)
  const anonRes = await request('/v1/billing/receipts', { method: 'GET' }, null);
  record('7. Security: Unauthenticated Request Is Rejected (401 Unauthorized)', 
    anonRes.status === 401, {
    expected: 401,
    actual: anonRes.status
  });

  console.log('\n===============================================================');
  console.log(`Billing Payment Receipts Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runBillingPaymentReceiptsTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
