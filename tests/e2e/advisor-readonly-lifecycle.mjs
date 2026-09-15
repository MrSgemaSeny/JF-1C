/**
 * Live ADVISOR Read-Only Boundary Lifecycle E2E Suite
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
    console.error(`[FAIL] ${name} — expected ${details.expected}, got ${details.actual}`);
  }
}

async function runAdvisorLifecycleTests() {
  console.log('===============================================================');
  console.log(`Starting Live ADVISOR Read-Only Lifecycle Suite on ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, adminId } = actors;

  // 1. Create a dedicated employee and promote to ADVISOR
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const advisorEmail = `e2e.advisor.${rand}@testmail.com`;
  const regRes = await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `E2E Advisor ${rand}`,
      email: advisorEmail,
      password: 'TestPass123',
      role: 'EMPLOYEE',
      phone: '+77010000099'
    }
  });

  // Admin approves employee
  const pendingRes = await request('/v1/admin/employees/pending', { method: 'GET' }, adminToken);
  const pendingList = pendingRes.data?.data || [];
  const targetUser = pendingList.find(u => u.email === advisorEmail);
  const targetId = targetUser?.id || regRes.data?.data?.id;

  if (targetId) {
    await request(`/v1/admin/employees/${targetId}/approve`, { method: 'POST' }, adminToken);
    await delay(1000);
    // Promote to ADVISOR
    await request(`/v1/admin/employees/${targetId}/promote-to-advisor`, { method: 'POST' }, adminToken);
    await delay(1000);
  }

  // Advisor logs in
  const loginRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: advisorEmail, password: 'TestPass123' }
  });
  const advisorToken = loginRes.token;

  record('1. Provision and Authenticate ADVISOR Actor', !!advisorToken, {
    expected: 'valid JWT token for ADVISOR',
    actual: advisorToken ? 'token received' : 'failed'
  });

  if (!advisorToken) {
    console.error('Abort: Advisor authentication failed');
    return;
  }

  // 2. Read Access: CRM Tasks (GET /api/v1/crm/tasks -> 200 OK)
  const getTasksRes = await request('/v1/crm/tasks', { method: 'GET' }, advisorToken);
  record('2. ADVISOR Can Read CRM Tasks (GET /api/v1/crm/tasks)', getTasksRes.status === 200, {
    expected: 200,
    actual: getTasksRes.status
  });

  // 3. Read Access: CRM Clients (GET /api/v1/crm/clients -> 200 OK)
  const getClientsRes = await request('/v1/crm/clients', { method: 'GET' }, advisorToken);
  record('3. ADVISOR Can Read CRM Clients (GET /api/v1/crm/clients)', getClientsRes.status === 200, {
    expected: 200,
    actual: getClientsRes.status
  });

  // 4. Read Access: Documents (GET /api/v1/documents -> 200 OK)
  const getDocsRes = await request('/v1/documents', { method: 'GET' }, advisorToken);
  record('4. ADVISOR Can Read Documents (GET /api/v1/documents)', getDocsRes.status === 200, {
    expected: 200,
    actual: getDocsRes.status
  });

  // 5. Read Access: Dashboard (GET /api/v1/crm/dashboard/admin -> 200 OK)
  const getDashRes = await request('/v1/crm/dashboard/admin', { method: 'GET' }, advisorToken);
  record('5. ADVISOR Can Read Admin Analytics (GET /api/v1/crm/dashboard/admin)', getDashRes.status === 200, {
    expected: 200,
    actual: getDashRes.status
  });

  // 6. Mutation Boundary Rejection: Create Client (POST /api/v1/crm/clients -> 403 Forbidden)
  const createClientRes = await request('/v1/crm/clients', {
    method: 'POST',
    body: { companyName: 'Advisor Illegal Client', contactPerson: 'Hacker' }
  }, advisorToken);
  record('6. ADVISOR Forbidden to Create Client (POST /api/v1/crm/clients)', createClientRes.status === 403, {
    expected: 403,
    actual: createClientRes.status
  });

  // 7. Mutation Boundary Rejection: Delete Document (DELETE /api/v1/documents/999999 -> 403 Forbidden)
  const deleteDocRes = await request('/v1/documents/999999', { method: 'DELETE' }, advisorToken);
  record('7. ADVISOR Forbidden to Delete Document (DELETE /api/v1/documents/{id})', deleteDocRes.status === 403, {
    expected: 403,
    actual: deleteDocRes.status
  });

  console.log('\n===============================================================');
  console.log(`ADVISOR Read-Only Suite Completed: ${results.passed} passed, ${results.failed} failed`);
  console.log('===============================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAdvisorLifecycleTests().catch(err => {
  console.error('[FATAL] Advisor lifecycle error:', err);
  process.exit(1);
});
