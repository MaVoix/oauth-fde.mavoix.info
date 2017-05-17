var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);

const routes = {
  views: importRoutes('./views'),
};

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Setup Route Bindings
exports = module.exports = function (app) {
  app.get('/', routes.views.index);
  app.get('/login', routes.views.loginForm);
  app.get('/logout', require('./logout'));
  app.post('/login', require('./login'));
  app.get('/consent', routes.views.consentDialog);
  app.post('/consent', require('./consent'));
  // app.get('/logout', views.logout);
  // app.get('/account', views.account);
};
