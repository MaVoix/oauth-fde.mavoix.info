var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var passport = require('passport');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Setup Route Bindings
exports = module.exports = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  require('./auth');

  const views = require('./views');
  const oauth2 = require('./oauth2')

  // Views
  app.get('/', views.index);

  app.get('/login', views.loginForm);
  app.post('/login', views.login);
  app.get('/logout', views.logout);
  app.get('/account', views.account);

  app.get('/dialog/authorize', oauth2.authorization);
  app.post('/dialog/authorize/decision', oauth2.decision);
  app.post('/oauth/token', oauth2.token);

};
