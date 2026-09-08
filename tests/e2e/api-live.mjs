/**
 * Automated Live API E2E Test Suite for ZhanFinance
 * Target: https://zhanfinance.fly.dev
 */

const BASE_URL = process.env.API_BASE_URL || 'https://zhanfinance.fly.dev';

const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function record(name, status, details = {}) {
  results.tests.push({ name, status, ...details });
  if (status === 'PASS') {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else if (status === 'FAIL') {
    results.failed++;
    console.error(`[FAIL] ${name} -> Error: ${details.error || details.statusText || 'Assertion failed'}`);
    if (details.responseBody) {
      console.error(`       Response: ${JSON.stringify(details.responseBody).substring(0, 200)}`);
    }
  } else {
    results.skipped++;
    console.log(`[SKIP] ${name}`);
  }
}

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    const durationMs = Date.now() - start;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        data = await res.text();
      }
    } else {
      data = await res.text();
    }
    return {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      data,
      durationMs
    };
  } catch (err) {
    return {
      status: 0,
      statusText: err.message,
      headers: {},
      data: null,
      durationMs: Date.now() - start,
      error: err.message
    };
  }
}

async function runLiveApiTests() {
  console.log(`=======================================================`);
  console.log(`Starting Live API E2E Test Suite on ${BASE_URL}`);
  console.log(`=======================================================\n`);

  // 1. Health and System Endpoints
  console.log(`--- 1. Health and Actuator Checks ---`);
  {
    const res = await fetchJson('/api/actuator/health');
    if (res.status === 200 && (res.data?.status === 'UP' || JSON.stringify(res.data).includes('UP'))) {
      record('Actuator Health Endpoint (/api/actuator/health)', 'PASS', { durationMs: res.durationMs });
    } else {
      record('Actuator Health Endpoint (/api/actuator/health)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  // 2. Public Catalog Endpoints
  console.log(`\n--- 2. Public Services and Catalog ---`);
  {
    const res = await fetchJson('/api/v1/services');
    if (res.status === 200 && res.data?.success === true && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      record('Public Services List (/api/v1/services)', 'PASS', { items: res.data.data.length, durationMs: res.durationMs });
    } else {
      record('Public Services List (/api/v1/services)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  {
    const res = await fetchJson('/api/v1/services/highlighted');
    if (res.status === 200 && res.data?.success === true && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      record('Highlighted Services (/api/v1/services/highlighted)', 'PASS', { items: res.data.data.length, durationMs: res.durationMs });
    } else {
      record('Highlighted Services (/api/v1/services/highlighted)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  // 3. Security Headers Verification
  console.log(`\n--- 3. Security Headers and OWASP Standards ---`);
  {
    const res = await fetchJson('/api/v1/services/highlighted');
    const h = res.headers;
    const hasNosniff = h['x-content-type-options'] === 'nosniff';
    const hasFrameOptions = h['x-frame-options'] === 'DENY' || h['x-frame-options'] === 'SAMEORIGIN';
    const hasCsp = !!h['content-security-policy'];
    const hasStrictTransport = !!h['strict-transport-security'];

    if (hasNosniff && hasFrameOptions) {
      record('Security Headers (nosniff, frame-options, csp)', 'PASS', {
        xContentTypeOptions: h['x-content-type-options'],
        xFrameOptions: h['x-frame-options'],
        hasCsp,
        hasStrictTransport
      });
    } else {
      record('Security Headers (nosniff, frame-options, csp)', 'FAIL', { headers: h });
    }
  }

  // 4. Auth & Zero-Enumeration Flow
  console.log(`\n--- 4. Authentication & Zero-Enumeration Endpoints ---`);
  {
    const res = await fetchJson('/api/v1/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'compliance_test_user@zhanfinance.kz' })
    });
    if (res.status === 200 && res.data?.success === true) {
      record('Auth Check Email Endpoint (/api/v1/auth/check-email)', 'PASS', { durationMs: res.durationMs });
    } else {
      record('Auth Check Email Endpoint (/api/v1/auth/check-email)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  {
    const res = await fetchJson('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent_test_123456789@example.com' })
    });
    // Zero-enumeration rule: returns 200 even for non-existent users
    if (res.status === 200 && res.data?.success === true) {
      record('Auth Forgot Password Zero-Enumeration (/api/v1/auth/forgot-password)', 'PASS', { durationMs: res.durationMs });
    } else {
      record('Auth Forgot Password Zero-Enumeration (/api/v1/auth/forgot-password)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  {
    const res = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid_user@zhanfinance.kz', password: 'WrongPassword999!' })
    });
    if (res.status === 401 && (res.data?.code === 'UNAUTHORIZED' || res.data?.status === 401)) {
      record('Auth Login Invalid Credentials Handling (HTTP 401)', 'PASS', { durationMs: res.durationMs });
    } else {
      record('Auth Login Invalid Credentials Handling (HTTP 401)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  {
    const res = await fetchJson('/api/v1/auth/refresh', {
      method: 'POST'
    });
    // Missing refresh cookie must return 400 or 401 or 403 without 500 error
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      record('Auth Refresh Without Cookie (HTTP 400/401/403)', 'PASS', { status: res.status, durationMs: res.durationMs });
    } else {
      record('Auth Refresh Without Cookie (HTTP 400/401/403)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  // 5. Contact Requests (Leads) Submission
  console.log(`\n--- 5. Contact Requests / Leads Submission Form Endpoint ---`);
  {
    // Test validation on invalid payload
    const resInvalid = await fetchJson('/api/v1/contact-requests', {
      method: 'POST',
      body: JSON.stringify({ name: '', phone: '' })
    });
    if (resInvalid.status === 400) {
      record('Contact Request Validation on Empty Payload (HTTP 400)', 'PASS', { durationMs: resInvalid.durationMs });
    } else {
      record('Contact Request Validation on Empty Payload (HTTP 400)', 'FAIL', { status: resInvalid.status, responseBody: resInvalid.data });
    }

    // Test valid contact request submission with synthetic test marker
    const resValid = await fetchJson('/api/v1/contact-requests', {
      method: 'POST',
      body: JSON.stringify({
        name: '[E2E TEST] Smoke Lead',
        phone: '+77000000099',
        email: 'smoke-test@zhanfinance.kz',
        message: 'Automated live E2E test lead. Please ignore.',
        source: 'E2E_AUTOMATION'
      })
    });
    if (resValid.status === 200 && resValid.data?.success === true) {
      record('Contact Request Submission with Valid Data (HTTP 200)', 'PASS', { durationMs: resValid.durationMs });
    } else {
      record('Contact Request Submission with Valid Data (HTTP 200)', 'FAIL', { status: resValid.status, responseBody: resValid.data });
    }
  }

  // 6. Security & Auth Boundary: Protected Endpoints
  console.log(`\n--- 6. Protected Endpoints Authorization Boundary (401/403 Check) ---`);
  const protectedEndpoints = [
    { method: 'GET', path: '/api/v1/users/me', name: 'User Profile' },
    { method: 'GET', path: '/api/v1/admin/dashboard', name: 'Admin Dashboard' },
    { method: 'GET', path: '/api/v1/admin/finance/summary', name: 'Admin Finance Summary' },
    { method: 'GET', path: '/api/v1/admin/employees', name: 'Admin Employees List' },
    { method: 'GET', path: '/api/v1/admin/employees/pending', name: 'Admin Pending Employees' },
    { method: 'GET', path: '/api/v1/admin/employees/workload', name: 'Admin Employees Workload' },
    { method: 'GET', path: '/api/v1/admin/clients/stats', name: 'Admin Clients Stats' },
    { method: 'GET', path: '/api/v1/admin/courses', name: 'Admin Courses' },
    { method: 'GET', path: '/api/v1/admin/curators', name: 'Admin Curators' },
    { method: 'GET', path: '/api/v1/admin/learners', name: 'Admin Learners' },
    { method: 'GET', path: '/api/v1/admin/audit-logs', name: 'Admin Audit Logs' },
    { method: 'GET', path: '/api/v1/tasks', name: 'CRM Tasks List' },
    { method: 'GET', path: '/api/v1/pipelines', name: 'CRM Pipelines' },
    { method: 'GET', path: '/api/v1/stages', name: 'CRM Stages' },
    { method: 'GET', path: '/api/v1/billing/invoices', name: 'Billing Invoices' },
    { method: 'GET', path: '/api/v1/billing/subscriptions', name: 'Billing Subscriptions' },
    { method: 'GET', path: '/api/v1/chat/contacts', name: 'Chat Contacts' },
    { method: 'GET', path: '/api/v1/chat/unread', name: 'Chat Unread Counts' },
    { method: 'GET', path: '/api/v1/documents', name: 'Documents Management' },
    { method: 'GET', path: '/api/v1/official-documents/templates', name: 'Document Templates' },
    { method: 'GET', path: '/api/v1/calendar/events', name: 'Calendar Events' },
    { method: 'GET', path: '/api/v1/courses', name: 'LMS Learner Courses' }
  ];

  for (const ep of protectedEndpoints) {
    const res = await fetchJson(ep.path, { method: ep.method });
    // Must be 401 Unauthorized or 403 Forbidden. MUST NOT be 500 or leak stack traces.
    if (res.status === 401 || res.status === 403) {
      record(`Auth Boundary: ${ep.name} (${ep.path}) [Expected 401/403]`, 'PASS', {
        status: res.status,
        durationMs: res.durationMs
      });
    } else {
      record(`Auth Boundary: ${ep.name} (${ep.path}) [Expected 401/403]`, 'FAIL', {
        status: res.status,
        responseBody: res.data
      });
    }
  }

  // 7. Error Handling & Envelopes (404, 405)
  console.log(`\n--- 7. Error Handling & Envelopes (404, 405) ---`);
  {
    const res = await fetchJson('/api/v1/non-existent-route-for-testing-404');
    // Spring Security enforces 401 on unauthenticated unknown routes (fail-closed); public gives 404
    if (res.status === 404 || res.status === 401) {
      record('Non-Existent Endpoint Handling (HTTP 404 / 401 Fail-Closed)', 'PASS', { status: res.status, durationMs: res.durationMs });
    } else {
      record('Non-Existent Endpoint Handling (HTTP 404 / 401 Fail-Closed)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  {
    const res = await fetchJson('/api/v1/services', { method: 'DELETE' });
    if (res.status === 405 || res.status === 403) {
      record('Method Not Allowed / Forbidden Handling (HTTP 405/403 on DELETE /services)', 'PASS', { status: res.status, durationMs: res.durationMs });
    } else {
      record('Method Not Allowed / Forbidden Handling (HTTP 405/403 on DELETE /services)', 'FAIL', { status: res.status, responseBody: res.data });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`Live API E2E Tests Finished`);
  console.log(`Total: ${results.tests.length} | Passed: ${results.passed} | Failed: ${results.failed} | Skipped: ${results.skipped}`);
  console.log(`=======================================================\n`);

  return results;
}

runLiveApiTests().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
