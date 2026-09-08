/**
 * Master E2E Test Suite Runner for ZhanFinance (JF-1C)
 * Executes all live functional, security, and browser E2E test suites against production
 */

import { execSync } from 'child_process';

console.log(`======================================================================`);
console.log(`ZHANFINANCE LIVE PRODUCTION FULL E2E SUITE RUNNER`);
console.log(`Targets:`);
console.log(`  Backend:  https://zhanfinance.fly.dev/api`);
console.log(`  Frontend: https://mrsgemaseny.github.io/JF-1C`);
console.log(`======================================================================\n`);

const results = {};

function runSuite(name, cmd) {
  console.log(`\n======================================================================`);
  console.log(`>>> [RUNNING] ${name}`);
  console.log(`======================================================================`);
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit' });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    results[name] = { status: 'PASS', duration: `${duration}s` };
    console.log(`>>> [PASS] ${name} (${duration}s)`);
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    results[name] = { status: 'FAIL / FINDINGS', duration: `${duration}s`, exitCode: err.status };
    console.log(`>>> [FAIL / FINDINGS] ${name} (${duration}s)`);
  }
}

// 1. Live Backend API Boundaries & Security Headers
runSuite('1. Backend API Boundaries & Security Headers', 'node e2e/api-live.mjs');

// 2. Playwright Live Browser Public E2E
runSuite('2. Browser Public Pages E2E (Playwright Chrome)', 'node e2e/frontend-live.mjs');

// 3. Playwright Live Authenticated User Journeys (Admin, Employee, Client)
runSuite('3. Browser Authenticated User Journeys (Playwright Chrome)', 'node e2e/authenticated-journeys-live.mjs');

// 4. Live IDOR & RBAC Security Audit
runSuite('4. RBAC & IDOR Security Audit Suite', 'node e2e/idor-live.mjs');

// 5. Live CRM Pipeline & Tasks Full Lifecycle
runSuite('5. CRM Pipeline & Tasks Full Lifecycle', 'node e2e/crm-lifecycle-live.mjs');

// 6. Live LMS Courses & Learner Progression Full Lifecycle
runSuite('6. LMS Courses & Learner Progression Full Lifecycle', 'node e2e/lms-lifecycle-live.mjs');

// 7. Live Chat & Notifications Full Lifecycle
runSuite('7. Chat & Real-Time Notifications Full Lifecycle', 'node e2e/chat-notifications-live.mjs');

// 8. Live Documents & Global Search Full Lifecycle
runSuite('8. Documents Management & Global Search Full Lifecycle', 'node e2e/documents-search-live.mjs');

// 9. Live Billing & Invoices Full Lifecycle
runSuite('9. Billing & Invoices Full Lifecycle', 'node e2e/billing-invoices-live.mjs');

console.log(`\n======================================================================`);
console.log(`COMPREHENSIVE E2E VERIFICATION SUMMARY`);
console.log(`======================================================================`);
console.table(results);
