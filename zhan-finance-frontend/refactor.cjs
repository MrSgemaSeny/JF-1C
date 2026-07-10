const fs = require('fs');

let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

// Add imports
code = code.replace(
  "import { BrowserRouter, Routes, Route } from 'react-router-dom';",
  "import { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport { lazy, Suspense } from 'react';\nimport { ErrorBoundary } from '@/shared/ui/ErrorBoundary';\nimport { Spinner } from '@/shared/ui/Spinner';"
);

// Replace page imports with lazy
const importRegex = /^import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+['"](@\/pages\/[^'"]+)['"];$/gm;
code = code.replace(importRegex, (match, p1, p2) => {
  if (p1 === 'DashboardRedirect') return match; // Keep this static
  return `const ${p1} = lazy(() => import('${p2}').then(m => ({ default: m.${p1} })));`;
});

// Remove existing Spinner import if we duplicated it
const spinnerRegex = /import\s+\{\s*Spinner\s*\}\s+from\s+['"]@\/shared\/ui\/Spinner['"];\n?/g;
code = code.replace(spinnerRegex, '');

// Wrap Routes in Suspense and ErrorBoundary
code = code.replace('<Routes>', '<ErrorBoundary>\n          <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="w-8 h-8 text-brand-green" /></div>}>\n          <Routes>');
code = code.replace('</Routes>', '</Routes>\n          </Suspense>\n          </ErrorBoundary>');

fs.writeFileSync('src/app/App.tsx', code);
console.log('App.tsx updated successfully.');
