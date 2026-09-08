/**
 * Shared Authentication Helper for Live E2E Tests
 * Target: https://zhanfinance.fly.dev/api
 *
 * Implements token caching and automatic backoff for Bucket4j rate limits
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_CACHE_FILE = path.join(__dirname, '.auth-cache.json');

export const BASE_URL = process.env.API_BASE_URL || 'https://zhanfinance.fly.dev/api';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zhanfinance.kz';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestPass123';

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request(path, options = {}, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  let res;
  let attempts = 0;
  while (attempts < 4) {
    attempts++;
    res = await fetch(url, { ...options, headers, body });
    if (res.status === 429) {
      console.warn(`[WARN] 429 Too Many Requests on ${path}. Waiting 8s for Bucket4j refill (attempt ${attempts}/4)...`);
      await delay(8000);
      continue;
    }
    break;
  }

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

  return {
    status: res.status,
    statusText: res.statusText,
    data,
    headers: Object.fromEntries(res.headers.entries()),
    token: data?.data?.accessToken || null
  };
}

export async function getAuthActors() {
  // Check disk cache
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'));
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < 1000 * 60 * 30)) {
        // Verify admin token still valid
        const verifyRes = await request('/v1/users/me', { method: 'GET' }, cached.adminToken);
        if (verifyRes.status === 200) {
          return cached;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('[AUTH] Provisioning fresh authentication tokens...');

  // 1. Admin Login
  const adminRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  if (adminRes.status !== 200 || !adminRes.token) {
    throw new Error(`Admin login failed: ${adminRes.status} ${JSON.stringify(adminRes.data)}`);
  }
  const adminToken = adminRes.token;
  const adminId = adminRes.data?.data?.id;
  await delay(1200);

  // 2. Client Registration/Login
  const randClient = Math.floor(Math.random() * 90000) + 10000;
  const clientEmail = `e2e.client.${randClient}@testmail.com`;
  const clientRegRes = await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `E2E Client ${randClient}`,
      email: clientEmail,
      password: 'TestPass123',
      role: 'CLIENT',
      phone: '+77010000001',
      companyName: 'E2E Client Corp'
    }
  });
  const clientToken = clientRegRes.token;
  const clientId = clientRegRes.data?.data?.id;
  await delay(1200);

  // 3. Employee Registration & Admin Approval
  const randEmp = Math.floor(Math.random() * 90000) + 10000;
  const empEmail = `e2e.emp.${randEmp}@testmail.com`;
  await request('/v1/auth/register', {
    method: 'POST',
    body: {
      fullName: `E2E Employee ${randEmp}`,
      email: empEmail,
      password: 'TestPass123',
      role: 'EMPLOYEE',
      phone: '+77010000002'
    }
  });
  await delay(1200);

  // Admin approves employee
  const pendingRes = await request('/v1/admin/employees/pending', { method: 'GET' }, adminToken);
  const pendingUsers = pendingRes.data?.data || [];
  const pendingEmp = pendingUsers.find(u => u.email === empEmail) || pendingUsers[0];
  let empId = pendingEmp?.id;
  if (empId) {
    await request(`/v1/admin/employees/${empId}/approve`, { method: 'POST' }, adminToken);
    await delay(1200);
  }

  // Employee Login
  const empLoginRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: empEmail, password: 'TestPass123' }
  });
  const empToken = empLoginRes.token;
  if (!empId) empId = empLoginRes.data?.data?.id;
  await delay(1200);

  // 4. Learner Creation via Admin
  const randLearner = Math.floor(Math.random() * 90000) + 10000;
  const learnerEmail = `e2e.learner.${randLearner}@testmail.com`;
  await request('/v1/admin/learners', {
    method: 'POST',
    body: {
      fullName: `E2E Learner ${randLearner}`,
      email: learnerEmail,
      password: 'TestPass123',
      role: 'LEARNER'
    }
  }, adminToken);
  await delay(1200);

  // Learner Login
  const learnerLoginRes = await request('/v1/auth/login', {
    method: 'POST',
    body: { email: learnerEmail, password: 'TestPass123' }
  });
  const learnerToken = learnerLoginRes.token;
  const learnerId = learnerLoginRes.data?.data?.id;

  const result = {
    timestamp: Date.now(),
    adminToken,
    adminId,
    adminEmail: ADMIN_EMAIL,
    clientToken,
    clientId,
    clientEmail,
    empToken,
    empId,
    empEmail,
    learnerToken,
    learnerId,
    learnerEmail
  };

  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(result, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }

  return result;
}
