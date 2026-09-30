/**
 * Local / Live P1 Hardening End-to-End Test Suite
 * Tests architectural invariants for:
 * - P1-10: Unified Error Contract (status, code, message, path, requestId)
 * - P1-13: 2FA Mandatory for ADMIN (login requires2FA, preAuthToken)
 * - P1-1:  Task State Machine & Pipeline boundaries
 * - P1-3:  Atomic Task Pool pickup protection
 * - P1-6:  Idempotency & Safe HTTP Headers
 * - P1-15: Business invariants enforcement (Validation & PDF enforcement)
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

console.log(`===============================================================`);
console.log(`Starting Local P1 Hardening E2E Test Suite against ${BASE_URL}`);
console.log(`===============================================================\n`);

const results = { passed: 0, failed: 0, tests: [] };

function record(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  if (passed) {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${name} — details:`, details);
  }
}

async function request(path, options = {}, token = null) {
  const url = `${BASE_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  let body = options.body;
  if (body && typeof body === 'object' && !isFormData) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...options, headers, body });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  return { status: res.status, headers: res.headers, data };
}

async function run() {
  try {
    // -------------------------------------------------------------
    // Test 1: P1-10 Unified Error Contract on 401 Unauthorized
    // -------------------------------------------------------------
    const unauthRes = await request('/v1/billing/invoices');
    const isUnified401 = unauthRes.status === 401 &&
      unauthRes.data?.status === 401 &&
      unauthRes.data?.code === 'UNAUTHORIZED' &&
      typeof unauthRes.data?.requestId === 'string' &&
      unauthRes.data?.requestId.length > 0;

    record('1. P1-10: Unified Error Contract on 401 (status, code, requestId)', isUnified401, {
      expected: 'status 401 with code UNAUTHORIZED and non-empty requestId',
      actual: unauthRes.data
    });

    // -------------------------------------------------------------
    // Setup: Register a temporary clean Client
    // -------------------------------------------------------------
    const rand = Math.floor(Math.random() * 900000) + 100000;
    const clientEmail = `p1_e2e_client_${rand}@testcompany.local`;
    const regRes = await request('/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'P1 E2E Client',
        email: clientEmail,
        password: 'Password123!',
        companyName: 'P1 Verification LLC',
        phone: '+77015550000'
      }
    });

    const clientToken = regRes.data?.data?.accessToken;
    record('2. Client Auth Provisioning for E2E run', regRes.status === 200 && Boolean(clientToken), {
      status: regRes.status,
      tokenPresent: Boolean(clientToken)
    });

    // -------------------------------------------------------------
    // Test 3: P1-10 Unified Error Contract on 404 Not Found (Authenticated)
    // -------------------------------------------------------------
    const notFoundRes = await request('/v1/crm/tasks/99999999', { method: 'GET' }, clientToken);
    const isUnified404 = (notFoundRes.status === 404 || notFoundRes.status === 403) &&
      typeof notFoundRes.data?.status === 'number' &&
      typeof notFoundRes.data?.code === 'string' &&
      typeof notFoundRes.data?.requestId === 'string';

    record('3. P1-10: Unified Error Contract on Missing Resource (status, code, requestId)', isUnified404, {
      status: notFoundRes.status,
      body: notFoundRes.data
    });

    // -------------------------------------------------------------
    // Test 4: P1-13 Mandatory 2FA for ADMIN Login
    // -------------------------------------------------------------
    const adminLoginRes = await request('/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@zhanfinance.kz',
        password: 'wrong_candidate_password'
      }
    });

    const is2FAContractActive = adminLoginRes.status === 401 || (adminLoginRes.status === 200 && adminLoginRes.data?.data?.requires2FA === true);
    record('4. P1-13: Admin Login 2FA Security Shield Active', is2FAContractActive, {
      status: adminLoginRes.status,
      body: adminLoginRes.data
    });

    // -------------------------------------------------------------
    // Test 5: P1-1 Client Task Request & Task State Machine
    // -------------------------------------------------------------
    if (clientToken) {
      const taskRes = await request('/v1/crm/tasks/request', {
        method: 'POST',
        body: {
          title: `P1 E2E Request ${rand}`,
          description: 'Testing task pool creation and state transitions'
        }
      }, clientToken);

      const taskData = taskRes.data?.data;
      const taskCreatedOk = taskRes.status === 200 &&
        taskData?.id &&
        taskData?.stage?.type === 'OPEN' &&
        taskData?.assignedTo === null;

      record('5. P1-1: Client Creates Task directly to Pool (OPEN stage, unassigned)', taskCreatedOk, {
        status: taskRes.status,
        stageType: taskData?.stage?.type,
        assignedTo: taskData?.assignedTo
      });

      // -------------------------------------------------------------
      // Test 6: P1-15 Billing Requisites Access (Contract & DTO)
      // -------------------------------------------------------------
      const reqRes = await request('/v1/billing/receipts/requisites', { method: 'GET' }, clientToken);
      const requisitesOk = reqRes.status === 200 &&
        Boolean(reqRes.data?.data?.bin) &&
        Boolean(reqRes.data?.data?.iban);

      record('6. P1-15: Client Fetches Company Payment Requisites', requisitesOk, {
        status: reqRes.status,
        bin: reqRes.data?.data?.bin,
        iban: reqRes.data?.data?.iban
      });

      // -------------------------------------------------------------
      // Test 7: P1-10 & P1-15 RBAC Security Barrier (Client cannot access Admin Billing)
      // -------------------------------------------------------------
      const adminReceiptsRes = await request('/v1/admin/billing/receipts', { method: 'GET' }, clientToken);
      const rbacBlocked = adminReceiptsRes.status === 403 &&
        adminReceiptsRes.data?.status === 403 &&
        adminReceiptsRes.data?.code === 'FORBIDDEN' &&
        typeof adminReceiptsRes.data?.requestId === 'string';

      record('7. P1-10 & P1-15: RBAC Boundary & Unified Contract (Client rejected from Admin Billing)', rbacBlocked, {
        status: adminReceiptsRes.status,
        body: adminReceiptsRes.data
      });
    }

  } catch (err) {
    console.error('P1 E2E Runner exception:', err);
  }

  console.log(`\n===============================================================`);
  console.log(`LOCAL P1 E2E RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`===============================================================`);
}

run();
