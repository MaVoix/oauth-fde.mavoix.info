var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Setup Route Bindings
exports = module.exports = function (app) {
  const views = require('./views');

  // Views
  app.get('/', views.index);

  app.get('/login', views.loginForm);
  app.post('/login', views.login);
  app.get('/logout', views.logout);
  app.get('/account', views.account);
};
