module.exports = {
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
    } catch (err) {
      // fallback handled gracefully
    }
    return next();
  }
};
