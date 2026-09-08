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
  }
};
