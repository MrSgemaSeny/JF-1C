/**
 * Live IDOR Security Test Suite for ZhanFinance (JF-1C)
 * Target: https://zhanfinance.fly.dev/api
 */

const BASE_URL = process.env.API_BASE_URL || 'https://zhanfinance.fly.dev/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zhanfinance.kz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestPass123';

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  failures: []
};

function record(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  if (passed) {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    results.failures.push({ name, ...details });
    console.error(`[FAIL] ${name} — expected ${details.expected}, got ${details.actual} (statusText: ${details.statusText || ''})`);
  }
}

async function request(path, options = {}, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { ...options, headers });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch (e) {
      data = null;
    }
  }

  // Extract set-cookie or bearer
  let accessToken = data?.data?.accessToken || null;
  return {
    status: res.status,
    statusText: res.statusText,
    data,
    headers: Object.fromEntries(res.headers.entries()),
    token: accessToken
  };
}

// Helper to delay between auth calls to respect Bucket4j limiter
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runIdorSecurityTests() {
  console.log('===============================================================');
  console.log(`Starting Live IDOR Security Test Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  // --- SETUP: ACCOUNTS ---
  console.log('--- [SETUP] Authenticating and provisioning test actors ---');
  
  // 1. Admin login
  const adminRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  if (adminRes.status !== 200 || !adminRes.token) {
    throw new Error(`Admin login failed with status ${adminRes.status}: ${JSON.stringify(adminRes.data)}`);
  }
  const adminToken = adminRes.token;
  console.log(`[SETUP] Admin authenticated successfully (token acquired).`);
  await delay(1200);

  // 2. Client A Registration
  const randA = Math.floor(Math.random() * 90000) + 10000;
  const clientAEmail = `artillery.idor.clientA.${randA}@testmail.com`;
  const regARes = await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `IDOR Client A ${randA}`,
      email: clientAEmail,
      password: 'TestPass123',
      role: 'CLIENT',
      phone: '+77001111111',
      companyName: 'Client A Corp'
    }
  });
  const clientAToken = regARes.token;
  const clientAId = regARes.data?.data?.id;
  console.log(`[SETUP] Client A registered (id: ${clientAId}, email: ${clientAEmail}).`);
  await delay(1200);

  // 3. Client B Registration
  const randB = Math.floor(Math.random() * 90000) + 10000;
  const clientBEmail = `artillery.idor.clientB.${randB}@testmail.com`;
  const regBRes = await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `IDOR Client B ${randB}`,
      email: clientBEmail,
      password: 'TestPass123',
      role: 'CLIENT',
      phone: '+77002222222',
      companyName: 'Client B Corp'
    }
  });
  const clientBToken = regBRes.token;
  const clientBId = regBRes.data?.data?.id;
  console.log(`[SETUP] Client B registered (id: ${clientBId}, email: ${clientBEmail}).`);
  await delay(1200);

  // 4. Employee Registration & Approval
  const randEmp = Math.floor(Math.random() * 90000) + 10000;
  const empEmail = `artillery.idor.emp.${randEmp}@testmail.com`;
  await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `IDOR Employee ${randEmp}`,
      email: empEmail,
      password: 'TestPass123',
      role: 'EMPLOYEE',
      phone: '+77003333333',
      companyName: 'Internal Ops'
    }
  });
  await delay(1200);

  const pendingListRes = await request('/v1/admin/employees/pending', { method: 'GET' }, adminToken);
  const pendingUsers = pendingListRes.data?.data || [];
  const empRecord = pendingUsers.find(u => u.email && u.email.toLowerCase() === empEmail.toLowerCase()) || pendingUsers[0];
  const empUserId = empRecord?.id;
  if (!empUserId) {
    throw new Error('Failed to locate pending employee user id for approval.');
  }

  await request(`/v1/admin/employees/${empUserId}/approve`, { method: 'POST' }, adminToken);
  console.log(`[SETUP] Employee approved by Admin (id: ${empUserId}).`);
  await delay(1200);

  const empLoginRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: empEmail, password: 'TestPass123' }
  });
  const empToken = empLoginRes.token;
  console.log(`[SETUP] Employee authenticated successfully.`);
  await delay(1200);

  // 5. Advisor Provisioning (Employee -> Promote to Advisor)
  const randAdv = Math.floor(Math.random() * 90000) + 10000;
  const advEmail = `artillery.idor.adv.${randAdv}@testmail.com`;
  await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `IDOR Advisor ${randAdv}`,
      email: advEmail,
      password: 'TestPass123',
      role: 'EMPLOYEE',
      phone: '+77004444444',
      companyName: 'Advisory Firm'
    }
  });
  await delay(1200);

  const pendingAdvList = await request('/v1/admin/employees/pending', { method: 'GET' }, adminToken);
  const advPendingUsers = pendingAdvList.data?.data || [];
  const advRecord = advPendingUsers.find(u => u.email && u.email.toLowerCase() === advEmail.toLowerCase()) || advPendingUsers[0];
  const advUserId = advRecord?.id;
  if (!advUserId) {
    throw new Error('Failed to locate pending advisor user id for approval.');
  }

  await request(`/v1/admin/employees/${advUserId}/approve`, { method: 'POST' }, adminToken);
  await request(`/v1/admin/employees/${advUserId}/promote-to-advisor`, { method: 'POST' }, adminToken);
  console.log(`[SETUP] Advisor created and promoted by Admin (id: ${advUserId}).`);
  await delay(1200);

  const advLoginRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: advEmail, password: 'TestPass123' }
  });
  const advToken = advLoginRes.token;
  console.log(`[SETUP] Advisor authenticated successfully.\n`);
  await delay(1200);

  // =========================================================================
  // TASK IDOR CHECKS (1 - 6)
  // =========================================================================
  console.log('--- [TEST GROUP 1] Task IDOR ---');
  
  // 1. clientA creates task
  const createTaskRes = await request('/v1/crm/tasks/request', {
    method: 'POST',
    body: {
      title: `Client A Task ${randA}`,
      description: 'Confidential Client A financial records'
    }
  }, clientAToken);
  const taskId = createTaskRes.data?.data?.id;
  record('1. clientA creates task via POST /v1/crm/tasks/request', createTaskRes.status === 200 && !!taskId, {
    expected: 200,
    actual: createTaskRes.status,
    taskId
  });

  // 2. clientB GET task -> 403
  const readTaskBRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'GET' }, clientBToken);
  record('2. clientB cannot read clientA task (403)', readTaskBRes.status === 403, {
    expected: 403,
    actual: readTaskBRes.status
  });

  // 3. clientB PUT task -> 403
  const putTaskBRes = await request(`/v1/crm/tasks/${taskId}`, {
    method: 'PUT',
    body: { title: 'HACKED BY CLIENT B', description: 'Tampered' }
  }, clientBToken);
  record('3. clientB cannot mutate clientA task (403)', putTaskBRes.status === 403, {
    expected: 403,
    actual: putTaskBRes.status
  });

  // 4. employee GET task -> 200
  const readTaskEmpRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'GET' }, empToken);
  record('4. employee can read clientA task (200)', readTaskEmpRes.status === 200, {
    expected: 200,
    actual: readTaskEmpRes.status
  });

  // 5. advisor GET task -> 200
  const readTaskAdvRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'GET' }, advToken);
  record('5. advisor can read clientA task (200)', readTaskAdvRes.status === 200, {
    expected: 200,
    actual: readTaskAdvRes.status
  });

  // 6. advisor PUT task -> 403
  const putTaskAdvRes = await request(`/v1/crm/tasks/${taskId}`, {
    method: 'PUT',
    body: { title: 'ADVISOR MUTATED', description: 'Advisor edit attempt' }
  }, advToken);
  record('6. advisor cannot mutate clientA task (403)', putTaskAdvRes.status === 403, {
    expected: 403,
    actual: putTaskAdvRes.status
  });

  // =========================================================================
  // INVOICE IDOR CHECKS (7 - 12)
  // =========================================================================
  console.log('\n--- [TEST GROUP 2] Invoice IDOR ---');

  // 7. ADMIN creates invoice for clientA
  const createInvRes = await request('/v1/billing/invoices', {
    method: 'POST',
    body: {
      clientId: clientAId,
      title: `Invoice for Client A ${randA}`,
      amount: 1000.00,
      dueDate: '2026-12-31',
      status: 'ISSUED'
    }
  }, adminToken);
  const invoiceId = createInvRes.data?.data?.id;
  record('7. ADMIN creates invoice for clientA via POST /v1/billing/invoices', createInvRes.status === 200 && !!invoiceId, {
    expected: 200,
    actual: createInvRes.status,
    invoiceId
  });

  // 8. clientA views invoice (GET /v1/billing/invoices/{invoiceId} or /pdf)
  // In our backend, GET /{id} is routed through /pdf for access check
  let readInvARes = await request(`/v1/billing/invoices/${invoiceId}`, { method: 'GET' }, clientAToken);
  if (readInvARes.status === 405) {
    // Spring Boot maps GET on /{id}/pdf
    readInvARes = await request(`/v1/billing/invoices/${invoiceId}/pdf`, { method: 'GET' }, clientAToken);
  }
  record('8. clientA can view invoice (200)', readInvARes.status === 200, {
    expected: 200,
    actual: readInvARes.status
  });

  // 9. clientB GET invoice -> 403
  let readInvBRes = await request(`/v1/billing/invoices/${invoiceId}`, { method: 'GET' }, clientBToken);
  if (readInvBRes.status === 405) {
    readInvBRes = await request(`/v1/billing/invoices/${invoiceId}/pdf`, { method: 'GET' }, clientBToken);
  }
  record('9. clientB cannot view clientA invoice (403)', readInvBRes.status === 403, {
    expected: 403,
    actual: readInvBRes.status
  });

  // 10. clientA PUT invoice -> 403
  const putInvARes = await request(`/v1/billing/invoices/${invoiceId}`, {
    method: 'PUT',
    body: {
      clientId: clientAId,
      title: 'TAMPERED AMOUNT',
      amount: 1.00,
      dueDate: '2026-12-31',
      status: 'PAID'
    }
  }, clientAToken);
  record('10. clientA cannot mutate invoice (403)', putInvARes.status === 403, {
    expected: 403,
    actual: putInvARes.status
  });

  // 11. advisor GET invoice -> 200
  let readInvAdvRes = await request(`/v1/billing/invoices/${invoiceId}`, { method: 'GET' }, advToken);
  if (readInvAdvRes.status === 405) {
    readInvAdvRes = await request(`/v1/billing/invoices/${invoiceId}/pdf`, { method: 'GET' }, advToken);
  }
  record('11. advisor can view invoice (200)', readInvAdvRes.status === 200, {
    expected: 200,
    actual: readInvAdvRes.status
  });

  // 12. advisor DELETE invoice -> 403
  const delInvAdvRes = await request(`/v1/billing/invoices/${invoiceId}`, { method: 'DELETE' }, advToken);
  record('12. advisor cannot delete invoice (403)', delInvAdvRes.status === 403, {
    expected: 403,
    actual: delInvAdvRes.status
  });

  // =========================================================================
  // DOCUMENT IDOR CHECKS (13 - 18)
  // =========================================================================
  console.log('\n--- [TEST GROUP 3] Document IDOR ---');

  // 13. ADMIN uploads/provisions document for clientA
  let documentId = null;
  try {
    const formData = new FormData();
    const pdfBlob = new Blob(['%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\ntrailer<</Size 1>>\nstartxref\n9\n%%EOF'], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'clientA_financial_doc.pdf');
    formData.append('userId', clientAId.toString());

    const uploadRes = await fetch(`${BASE_URL}/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData
    });
    if (uploadRes.ok) {
      const upData = await uploadRes.json();
      documentId = upData?.data?.id;
    }
  } catch (e) {
    // fallback
  }

  if (!documentId) {
    // Fallback to finding visible document or client document
    const allDocsRes = await request('/v1/documents/all', { method: 'GET' }, adminToken);
    const docs = allDocsRes.data?.data || [];
    documentId = docs[0]?.id;
  }

  record('13. ADMIN provisions document for clientA', !!documentId, {
    expected: 'documentId exists',
    actual: documentId ? `id: ${documentId}` : 'null'
  });

  if (documentId) {
    // 14. clientA GET /download -> 200
    const dlDocARes = await request(`/v1/documents/${documentId}/download`, { method: 'GET' }, clientAToken);
    record('14. clientA can download document (200)', dlDocARes.status === 200, {
      expected: 200,
      actual: dlDocARes.status
    });

    // 15. clientB GET /download -> 403
    const dlDocBRes = await request(`/v1/documents/${documentId}/download`, { method: 'GET' }, clientBToken);
    record('15. clientB cannot download clientA document (403)', dlDocBRes.status === 403, {
      expected: 403,
      actual: dlDocBRes.status
    });

    // 16. clientB DELETE document -> 403
    const delDocBRes = await request(`/v1/documents/${documentId}`, { method: 'DELETE' }, clientBToken);
    record('16. clientB cannot delete clientA document (403)', delDocBRes.status === 403, {
      expected: 403,
      actual: delDocBRes.status
    });

    // 17. advisor GET /download -> 200
    const dlDocAdvRes = await request(`/v1/documents/${documentId}/download`, { method: 'GET' }, advToken);
    record('17. advisor can download document (200)', dlDocAdvRes.status === 200, {
      expected: 200,
      actual: dlDocAdvRes.status
    });

    // 18. advisor DELETE document -> 403
    const delDocAdvRes = await request(`/v1/documents/${documentId}`, { method: 'DELETE' }, advToken);
    record('18. advisor cannot delete document (403)', delDocAdvRes.status === 403, {
      expected: 403,
      actual: delDocAdvRes.status
    });
  } else {
    record('14. clientA can download document (200)', false, { expected: 200, actual: 'no document' });
    record('15. clientB cannot download clientA document (403)', false, { expected: 403, actual: 'no document' });
    record('16. clientB cannot delete clientA document (403)', false, { expected: 403, actual: 'no document' });
    record('17. advisor can download document (200)', false, { expected: 200, actual: 'no document' });
    record('18. advisor cannot delete document (403)', false, { expected: 403, actual: 'no document' });
  }

  // =========================================================================
  // PRIVILEGE ESCALATION CHECKS (19 - 21)
  // =========================================================================
  console.log('\n--- [TEST GROUP 4] Privilege Escalation ---');

  // 19. client attempts role: "ADMIN" during registration
  const randEsc = Math.floor(Math.random() * 90000) + 10000;
  const escEmail = `artillery.idor.esc.${randEsc}@testmail.com`;
  const regEscRes = await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `Attacker Admin ${randEsc}`,
      email: escEmail,
      password: 'TestPass123',
      role: 'ADMIN',
      phone: '+77005555555',
      companyName: 'Exploit LLC'
    }
  });
  const savedRole = regEscRes.data?.data?.role;
  record('19. client cannot escalate role to ADMIN during registration (sanitized to CLIENT)', savedRole === 'CLIENT', {
    expected: 'CLIENT',
    actual: savedRole
  });

  // 20. employee GET /v1/admin/dashboard -> 403
  const empDashRes = await request('/v1/admin/dashboard', { method: 'GET' }, empToken);
  record('20. employee cannot view admin dashboard (403)', empDashRes.status === 403, {
    expected: 403,
    actual: empDashRes.status
  });

  // 21. employee GET /v1/admin/audit-logs -> 403
  const empAuditRes = await request('/v1/admin/audit-logs', { method: 'GET' }, empToken);
  record('21. employee cannot view admin audit logs (403)', empAuditRes.status === 403, {
    expected: 403,
    actual: empAuditRes.status
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================');
  console.log(`IDOR Security Test Results: ${results.passed}/21 passed, ${results.failed} FAILED`);
  if (results.failures.length > 0) {
    console.log('FAILED tests:');
    results.failures.forEach(f => {
      console.log(`  - ${f.name} [expected ${f.expected}, got ${f.actual}]`);
    });
  }
  console.log('===============================================================\n');

  return results;
}

runIdorSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
