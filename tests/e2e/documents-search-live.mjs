/**
 * Live Documents & Global Search Lifecycle E2E Suite
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

async function runDocumentsSearchTests() {
  console.log('===============================================================');
  console.log(`Starting Live Documents & Search E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, clientToken, clientId } = actors;

  // 1. Fetch Document Templates
  const tmplRes = await request('/v1/document-templates', { method: 'GET' }, adminToken);
  record('1. Admin Queries Document Templates (GET /v1/document-templates)', tmplRes.status === 200 && Array.isArray(tmplRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${tmplRes.status}`
  });

  // 2. Upload Document for Client via multipart/form-data
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const fileName = `e2e_contract_${rand}.pdf`;
  const fileContent = `%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n2 0 obj<</Length 15>>stream\nE2E Document ${rand}\nendstream\nendobj\nxref\n0 3\ntrailer<</Size 3>>\nstartxref\n120\n%%EOF`;

  const formData = new FormData();
  const blob = new Blob([fileContent], { type: 'application/pdf' });
  formData.append('file', blob, fileName);
  formData.append('userId', clientId.toString());

  const uploadRes = await fetch(`${BASE_URL}/v1/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData
  });
  let uploadData = null;
  try {
    uploadData = await uploadRes.json();
  } catch (e) {}

  const documentId = uploadData?.data?.id;
  record('2. Admin Uploads Document for Client (POST /v1/documents/upload)', uploadRes.status === 200 && !!documentId, {
    expected: 'status 200 with document id',
    actual: `status ${uploadRes.status}, id: ${documentId}`
  });

  if (!documentId) {
    console.error('Abort: Document upload failed.');
    return;
  }

  // 3. Admin Queries All Visible Documents
  const allDocsRes = await request('/v1/documents/all', { method: 'GET' }, adminToken);
  const docsList = allDocsRes.data?.data || [];
  const foundDoc = docsList.find(d => d.id === documentId);
  record('3. Admin Verifies Document in All Documents (GET /v1/documents/all)', allDocsRes.status === 200 && !!foundDoc, {
    expected: 'uploaded document in list',
    actual: foundDoc ? 'found' : 'not found'
  });

  // 4. Update Document Status
  const updateStatusRes = await request(`/v1/documents/${documentId}/status?status=REVIEW`, {
    method: 'PATCH'
  }, adminToken);
  record('4. Admin Updates Document Status (PATCH /v1/documents/{id}/status?status=REVIEW)', updateStatusRes.status === 200 && updateStatusRes.data?.data?.status === 'REVIEW', {
    expected: "status == 'REVIEW'",
    actual: `status: ${updateStatusRes.data?.data?.status}`
  });

  // 5. Client Queries Their Own Documents
  const clientDocsRes = await request('/v1/documents', { method: 'GET' }, clientToken);
  const clientDocs = clientDocsRes.data?.data || [];
  const clientFoundDoc = clientDocs.find(d => d.id === documentId);
  record('5. Client Retrieves Assigned Document (GET /v1/documents)', clientDocsRes.status === 200 && !!clientFoundDoc, {
    expected: 'document found in client list',
    actual: clientFoundDoc ? 'found' : 'not found'
  });

  // 6. Download Document Stream and Validate Headers/Body
  const dlRes = await fetch(`${BASE_URL}/v1/documents/${documentId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${clientToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const dlText = await dlRes.text();
  record('6. Client Downloads Document Stream (GET /v1/documents/{id}/download)', dlRes.status === 200 && dlText.includes(`E2E Document ${rand}`), {
    expected: 'status 200 with original content',
    actual: `status ${dlRes.status}, contains content: ${dlText.includes(`E2E Document ${rand}`)}`
  });

  // 7. Global Search Query
  const searchQuery = fileName.substring(0, 12);
  const searchRes = await request(`/v1/search?q=${encodeURIComponent(searchQuery)}`, { method: 'GET' }, adminToken);
  record('7. Global Search Across Records (GET /v1/search?q=...)', searchRes.status === 200 && searchRes.data?.data !== null, {
    expected: 'status 200 with search response',
    actual: `status ${searchRes.status}`
  });

  // 8. Delete Document
  const deleteRes = await request(`/v1/documents/${documentId}`, { method: 'DELETE' }, adminToken);
  record('8. Admin Cleans Up Document (DELETE /v1/documents/{id})', deleteRes.status === 200, {
    expected: 200,
    actual: deleteRes.status
  });

  // 9. Verify Document Gone
  const verifyDelRes = await request(`/v1/documents/${documentId}/download`, { method: 'GET' }, clientToken);
  record('9. Verify Document 404/Removed After Deletion', verifyDelRes.status === 404 || verifyDelRes.status === 403, {
    expected: '404 or 403',
    actual: verifyDelRes.status
  });

  console.log('\n===============================================================');
  console.log(`Documents & Search Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runDocumentsSearchTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
