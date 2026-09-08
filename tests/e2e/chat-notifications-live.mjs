/**
 * Live Chat & Real-Time Notifications Lifecycle E2E Suite
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

async function runChatNotificationsTests() {
  console.log('===============================================================');
  console.log(`Starting Live Chat & Notifications E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, adminId, empToken, empId } = actors;

  // 1. Check Notifications Endpoint
  const notifRes = await request('/v1/notifications', { method: 'GET' }, adminToken);
  record('1. Admin Queries Notifications (GET /v1/notifications)', notifRes.status === 200 && Array.isArray(notifRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${notifRes.status}`
  });

  // 2. Mark All Notifications As Read
  const readAllRes = await request('/v1/notifications/read-all', { method: 'POST' }, adminToken);
  record('2. Admin Marks All Notifications As Read (POST /v1/notifications/read-all)', readAllRes.status === 200, {
    expected: 200,
    actual: readAllRes.status
  });

  // 3. Query Chat Contacts
  const contactsRes = await request('/v1/chat/contacts', { method: 'GET' }, adminToken);
  record('3. Admin Queries Chat Contacts (GET /v1/chat/contacts)', contactsRes.status === 200 && Array.isArray(contactsRes.data?.data), {
    expected: 'status 200 with array',
    actual: `status ${contactsRes.status}`
  });

  // 4. Admin Sends Direct Chat Message to Employee
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const messageContent = `E2E automated chat message verification ${rand}`;
  const sendMsgRes = await request(`/v1/chat/${empId}`, {
    method: 'POST',
    body: { content: messageContent }
  }, adminToken);
  const sentMsgId = sendMsgRes.data?.data?.id;
  record('4. Admin Sends Chat Message to Employee (POST /v1/chat/{empId})', sendMsgRes.status === 200 && !!sentMsgId, {
    expected: 'status 200 with message id',
    actual: `status ${sendMsgRes.status}, id: ${sentMsgId}`
  });

  // 5. Employee Checks Unread Messages Count
  const unreadBeforeRes = await request('/v1/chat/unread', { method: 'GET' }, empToken);
  const unreadCountBefore = unreadBeforeRes.data?.data;
  record('5. Employee Detects Unread Message Count (GET /v1/chat/unread)', unreadBeforeRes.status === 200 && unreadCountBefore > 0, {
    expected: 'unread count > 0',
    actual: `unread count: ${unreadCountBefore}`
  });

  // 6. Employee Reads Chat History with Admin
  const historyRes = await request(`/v1/chat/${adminId}`, { method: 'GET' }, empToken);
  const messages = historyRes.data?.data || [];
  const foundMsg = messages.find(m => m.content === messageContent);
  record('6. Employee Reads Chat History (GET /v1/chat/{adminId})', historyRes.status === 200 && !!foundMsg, {
    expected: 'sent message found in history',
    actual: foundMsg ? 'found' : 'not found'
  });

  // 7. Employee Marks Messages as Read
  const markReadRes = await request(`/v1/chat/${adminId}/read`, { method: 'PUT' }, empToken);
  record('7. Employee Marks Conversation As Read (PUT /v1/chat/{adminId}/read)', markReadRes.status === 200, {
    expected: 200,
    actual: markReadRes.status
  });

  // 8. Employee Verifies Unread Count is Decreased/Zero
  const unreadAfterRes = await request('/v1/chat/unread', { method: 'GET' }, empToken);
  const unreadCountAfter = unreadAfterRes.data?.data;
  record('8. Employee Verifies Unread Count Reset (GET /v1/chat/unread)', unreadAfterRes.status === 200 && unreadCountAfter < unreadCountBefore, {
    expected: `unread count < ${unreadCountBefore}`,
    actual: `unread count: ${unreadCountAfter}`
  });

  console.log('\n===============================================================');
  console.log(`Chat & Notifications Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runChatNotificationsTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
