/**
 * Live Global Search Lifecycle & Role Isolation E2E Suite
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

async function runSearchLifecycleTests() {
  console.log('===============================================================');
  console.log(`Starting Live Global Search Lifecycle Suite on ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, clientToken } = actors;

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const taskTitle = `Тестовый отчет НДФЛ ${rand}`;
  const companyName = `ТестКомпани ЛТД ${rand}`;

  // 1. Admin Creates Client for Search Test
  const createClientRes = await request('/v1/crm/clients', {
    method: 'POST',
    body: {
      companyName: companyName,
      contactPerson: `Иван Иванов ${rand}`,
      email: `ivan.${rand}@testsearch.com`,
      phone: '+77051112233',
      binIin: `${rand}123456`
    }
  }, adminToken);
  const clientId = createClientRes.data?.data?.id;

  // 2. Admin Creates Task for Search Test
  const createTaskRes = await request('/v1/crm/tasks', {
    method: 'POST',
    body: {
      title: taskTitle,
      description: 'Специальный поисковый тест документации',
      priority: 'HIGH',
      pipelineId: 1
    }
  }, adminToken);
  const taskId = createTaskRes.data?.data?.id;

  await delay(1500);

  // 3. Search by Cyrillic Keyword for Task
  const searchTaskRes = await request(`/v1/search?q=${encodeURIComponent('НДФЛ')}`, { method: 'GET' }, adminToken);
  const taskMatches = searchTaskRes.data?.data?.tasks || [];
  const foundTask = taskMatches.some(t => t.title && t.title.includes(taskTitle));

  record('1. Global Search Finds Task by Cyrillic Keyword', searchTaskRes.status === 200 && foundTask, {
    expected: `task containing "${taskTitle}" in results`,
    actual: foundTask ? 'found' : 'not found'
  });

  // 4. Search by Cyrillic Keyword for Client
  const searchClientRes = await request(`/v1/search?q=${encodeURIComponent('ТестКомпани')}`, { method: 'GET' }, adminToken);
  const clientMatches = searchClientRes.data?.data?.clients || [];
  const foundClient = clientMatches.some(c => c.companyName && c.companyName.includes(companyName));

  record('2. Global Search Finds Client by Cyrillic Keyword', searchClientRes.status === 200 && foundClient, {
    expected: `client containing "${companyName}" in results`,
    actual: foundClient ? 'found' : 'not found'
  });

  // 5. Non-existent query returns empty lists cleanly
  const nonExistentRes = await request('/v1/search?q=XYZ_NON_EXISTENT_999999', { method: 'GET' }, adminToken);
  const resTasks = nonExistentRes.data?.data?.tasks || [];
  const resClients = nonExistentRes.data?.data?.clients || [];

  record('3. Non-Existent Query Returns Empty Results Without Error', nonExistentRes.status === 200 && resTasks.length === 0 && resClients.length === 0, {
    expected: 'empty tasks and clients arrays',
    actual: `tasks: ${resTasks.length}, clients: ${resClients.length}`
  });

  // 6. Client Role Isolation: Client Cannot Search Admin Tasks
  const clientSearchRes = await request(`/v1/search?q=${encodeURIComponent(taskTitle)}`, { method: 'GET' }, clientToken);
  const clientTaskMatches = clientSearchRes.data?.data?.tasks || [];
  const clientSawAdminTask = clientTaskMatches.some(t => t.id === taskId);

  record('4. Role Isolation: Client Cannot View Unrelated Tasks in Search', clientSearchRes.status === 200 && !clientSawAdminTask, {
    expected: 'client results do not contain unrelated task',
    actual: clientSawAdminTask ? 'leaked into search results' : 'isolated'
  });

  // Cleanup
  if (taskId) {
    await request(`/v1/crm/tasks/${taskId}`, { method: 'DELETE' }, adminToken);
  }

  console.log('\n===============================================================');
  console.log(`Global Search Suite Completed: ${results.passed} passed, ${results.failed} failed`);
  console.log('===============================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runSearchLifecycleTests().catch(err => {
  console.error('[FATAL] Search lifecycle error:', err);
  process.exit(1);
});
