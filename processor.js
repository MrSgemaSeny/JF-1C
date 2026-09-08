const tokens = {
  admin: null,
  employee: null,
  client: null
};

async function getTokens() {
  if (!tokens.admin) {
    try {
      const res = await fetch('https://zhanfinance.fly.dev/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          email: process.env.ADMIN_EMAIL || 'admin@zhanfinance.kz',
          password: process.env.ADMIN_PASSWORD || 'TestPass123'
        })
      });
      if (res.ok) {
        const d = await res.json();
        tokens.admin = d?.data?.accessToken;
      }
    } catch (e) {}
  }
  if (!tokens.employee) {
    try {
      const res = await fetch('https://zhanfinance.fly.dev/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          email: 'artillery.idor.emp.63835@testmail.com',
          password: 'TestPass123'
        })
      });
      if (res.ok) {
        const d = await res.json();
        tokens.employee = d?.data?.accessToken;
      }
    } catch (e) {}
  }
  if (!tokens.client) {
    try {
      const res = await fetch('https://zhanfinance.fly.dev/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          email: 'artillery.idor.clientA.25316@testmail.com',
          password: 'TestPass123'
        })
      });
      if (res.ok) {
        const d = await res.json();
        tokens.client = d?.data?.accessToken;
      }
    } catch (e) {}
  }
  return tokens;
}

module.exports = {
  setAdminAuth: function (context, ee, next) {
    const callback = typeof next === 'function' ? next : (typeof ee === 'function' ? ee : null);
    getTokens().then(t => {
      context.vars = context.vars || {};
      context.vars.adminToken = t.admin;
      context.vars.authToken = t.admin;
      if (callback) callback();
    }).catch(() => {
      if (callback) callback();
    });
  },

  setEmployeeAuth: function (context, ee, next) {
    const callback = typeof next === 'function' ? next : (typeof ee === 'function' ? ee : null);
    getTokens().then(t => {
      context.vars = context.vars || {};
      context.vars.empToken = t.employee;
      context.vars.authToken = t.employee;
      if (callback) callback();
    }).catch(() => {
      if (callback) callback();
    });
  },

  setClientAuth: function (context, ee, next) {
    const callback = typeof next === 'function' ? next : (typeof ee === 'function' ? ee : null);
    getTokens().then(t => {
      context.vars = context.vars || {};
      context.vars.cliToken = t.client;
      context.vars.authToken = t.client;
      if (callback) callback();
    }).catch(() => {
      if (callback) callback();
    });
  },

  attachAuthHeader: function (requestParams, context, ee, next) {
    if (context.vars.authToken) {
      requestParams.headers = requestParams.headers || {};
      requestParams.headers['Authorization'] = 'Bearer ' + context.vars.authToken;
      requestParams.headers['Cookie'] = 'accessToken=' + context.vars.authToken;
    }
    return next();
  },

  generateEmpEmail: function (contextOrParams, eeOrContext, nextOrEe, maybeNext) {
    const next = typeof maybeNext === 'function' ? maybeNext : nextOrEe;
    const context = (maybeNext ? eeOrContext : contextOrParams) || {};
    context.vars = context.vars || {};
    const rand = Math.floor(Math.random() * 90000) + 10000;
    context.vars.empEmail = `artillery.emp.${rand}@testmail.com`;
    context.vars.empRand = rand;
    if (typeof next === 'function') return next();
  },

  generateCliEmail: function (contextOrParams, eeOrContext, nextOrEe, maybeNext) {
    const next = typeof maybeNext === 'function' ? maybeNext : nextOrEe;
    const context = (maybeNext ? eeOrContext : contextOrParams) || {};
    context.vars = context.vars || {};
    const rand = Math.floor(Math.random() * 90000) + 10000;
    context.vars.cliEmail = `artillery.cli.${rand}@testmail.com`;
    if (typeof next === 'function') return next();
  },

  extractPendingEmpId: function (requestParams, response, context, ee, next) {
    try {
      const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      const list = body && Array.isArray(body.data) ? body.data : [];
      const target = list.find(e => e.email && e.email.toLowerCase() === (context.vars.empEmail || '').toLowerCase());
      if (target) {
        context.vars.pendingEmpId = target.id;
      } else if (list.length > 0) {
        context.vars.pendingEmpId = list[0].id;
      }
    } catch (err) {}
    return next();
  }
};
