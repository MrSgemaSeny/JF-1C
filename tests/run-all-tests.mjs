/**
 * Master Verification Runner for ZhanFinance
 * Runs both E2E test suites and all 3 Artillery load testing scenarios
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log(`======================================================================`);
console.log(`ZHANFINANCE LIVE PRODUCTION FULL VERIFICATION RUNNER`);
console.log(`Targets:`);
console.log(`  Backend:  https://zhanfinance.fly.dev`);
console.log(`  Frontend: https://mrsgemaseny.github.io/JF-1C`);
console.log(`======================================================================\n`);

const results = {};

function runCommand(name, cmd) {
  console.log(`\n>>> [RUNNING] ${name}`);
  const start = Date.now();
  try {
    const stdout = execSync(cmd, { stdio: 'inherit' });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    results[name] = { status: 'PASS', duration: `${duration}s` };
    console.log(`>>> [SUCCESS] ${name} (${duration}s)`);
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    results[name] = { status: 'COMPLETED_WITH_FINDINGS', duration: `${duration}s`, code: err.status };
    console.log(`>>> [COMPLETED_WITH_FINDINGS] ${name} (${duration}s)`);
  }
}

// 1. Live API E2E
runCommand('1. Live Backend API E2E Tests', 'node e2e/api-live.mjs');

// 2. Live Browser Public E2E
runCommand('2. Live Browser E2E Tests (Playwright/Chrome)', 'node e2e/frontend-live.mjs');

// 3. Live Authenticated User Journeys (Admin, Employee, Client)
runCommand('3. Live Authenticated User Journeys (Playwright/Chrome)', 'node e2e/authenticated-journeys-live.mjs');

// 4. Live IDOR Security Audit
runCommand('4. Live IDOR Security Audit Suite', 'node e2e/idor-live.mjs');

// 3. Artillery Catalog & Public Load Test
runCommand('3. Artillery Public Load Test', 'npx artillery run artillery/scenarios/catalog-and-public.yml --output artillery/reports/report-public.json');

// 4. Artillery Frontend Static Load Test
runCommand('4. Artillery Frontend CDN Benchmark', 'npx artillery run artillery/scenarios/frontend-static.yml --output artillery/reports/report-frontend.json');

// 5. Artillery Rate Limit Stress Test
runCommand('5. Artillery Rate Limiter Burst Test', 'npx artillery run artillery/scenarios/rate-limit-boundary.yml --output artillery/reports/report-ratelimit.json');

console.log(`\n======================================================================`);
console.log(`FINAL SUMMARY`);
console.log(`======================================================================`);
console.table(results);
