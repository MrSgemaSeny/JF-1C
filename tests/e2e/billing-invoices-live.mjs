/**
 * Live Billing & Invoices Lifecycle E2E Suite
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

async function runBillingInvoicesTests() {
  console.log('===============================================================');
  console.log(`Starting Live Billing & Invoices E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, clientToken, clientId } = actors;

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const invoiceTitle = `E2E Monthly Bookkeeping ${rand}`;

  // 1. Admin Creates Invoice for Client
  const createInvRes = await request('/v1/billing/invoices', {
    method: 'POST',
    body: {
      clientId: clientId,
      title: invoiceTitle,
      amount: 150000.00,
      status: 'ISSUED',
      dueDate: '2026-12-31'
    }
  }, adminToken);
  const invoiceId = createInvRes.data?.data?.id;
  record('1. Admin Creates Invoice (POST /v1/billing/invoices)', createInvRes.status === 200 && !!invoiceId, {
    expected: 'status 200 with invoice id',
    actual: `status ${createInvRes.status}, id: ${invoiceId}`
  });

  if (!invoiceId) {
    console.error('Abort: Invoice creation failed.');
    return;
  }

  // 2. Client Queries Invoices List
  const clientInvoicesRes = await request('/v1/billing/invoices', { method: 'GET' }, clientToken);
  const clientInvoices = clientInvoicesRes.data?.data || [];
  const foundInvoice = clientInvoices.find(inv => inv.id === invoiceId);
  record('2. Client Queries Invoices List (GET /v1/billing/invoices)', clientInvoicesRes.status === 200 && !!foundInvoice, {
    expected: 'invoice found in client list',
    actual: foundInvoice ? 'found' : 'not found'
  });

  // 3. Admin Updates Invoice Details
  const updatedAmount = 175000.00;
  const updateInvRes = await request(`/v1/billing/invoices/${invoiceId}`, {
    method: 'PUT',
    body: {
      clientId: clientId,
      title: `${invoiceTitle} (Adjusted)`,
      amount: updatedAmount,
      status: 'PAID',
      dueDate: '2026-12-31'
    }
  }, adminToken);
  record('3. Admin Updates Invoice (PUT /v1/billing/invoices/{id})', updateInvRes.status === 200 && updateInvRes.data?.data?.status === 'PAID', {
    expected: "status == 'PAID'",
    actual: `status: ${updateInvRes.data?.data?.status}`
  });

  // 4. Admin Deletes Invoice
  const deleteInvRes = await request(`/v1/billing/invoices/${invoiceId}`, { method: 'DELETE' }, adminToken);
  record('4. Admin Deletes Invoice (DELETE /v1/billing/invoices/{id})', deleteInvRes.status === 200, {
    expected: 200,
    actual: deleteInvRes.status
  });

  // 5. Verify Invoice Removed From Invoices List
  const verifyListRes = await request('/v1/billing/invoices', { method: 'GET' }, adminToken);
  const remainingInvoices = verifyListRes.data?.data || [];
  const stillExists = remainingInvoices.some(inv => inv.id === invoiceId);
  record('5. Verify Invoice Removed From Invoices List', verifyListRes.status === 200 && !stillExists, {
    expected: 'invoice no longer present',
    actual: stillExists ? 'still present' : 'removed'
  });

  console.log('\n===============================================================');
  console.log(`Billing & Invoices Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runBillingInvoicesTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
