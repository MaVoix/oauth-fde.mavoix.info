import keystone from 'keystone';
import middleware from './middleware';

const importRoutes = keystone.importer(__dirname);

const routes = {
  views: importRoutes('./views'),
};

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Setup Route Bindings
export default function(app) {
  app.get('/', routes.views.index);
  app.get('/login', routes.views.loginForm);
  app.get('/logout', require('./logout'));
  app.post('/login', require('./login'));
  app.get('/consent', routes.views.consentDialog);
  app.post('/consent', require('./consent'));
  app.get('/lost-password', routes.views.lostPasswordForm);
  app.post('/lost-password', require('./lostPassword'));
  app.get('/reset-password/:token', routes.views.resetPasswordForm);
  app.post('/reset-password/:token', require('./resetPassword'));
};
