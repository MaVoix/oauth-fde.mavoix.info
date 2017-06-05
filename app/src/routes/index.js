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

  app.get('/sign-up/:token', middleware.requireVisitor, middleware.view, routes.views.signupForm);
  app.post('/sign-up/:token', middleware.requireVisitor, middleware.view, require('./signup'));

  app.get('/login', middleware.view, routes.views.loginForm);
  app.get('/logout', middleware.requireUser, require('./logout'));
  app.post('/login', middleware.requireVisitor, require('./login'));

  app.get('/consent', middleware.requireUser,  middleware.view, routes.views.consentDialog);
  app.post('/consent', middleware.requireUser, require('./consent'));

  app.get('/lost-password', middleware.requireVisitor, middleware.view, routes.views.lostPasswordForm);
  app.post('/lost-password', middleware.requireVisitor, require('./lostPassword'));
  app.get('/reset-password/:token', middleware.requireVisitor, middleware.view, routes.views.resetPasswordForm);
  app.post('/reset-password/:token', middleware.requireVisitor, require('./resetPassword'));

  app.get('/update-password', middleware.requireUser, middleware.view, routes.views.updatePasswordForm);
  app.post('/update-password', middleware.requireUser, require('./updatePassword'));
  app.get('/account', middleware.requireUser, middleware.view, routes.views.account);

  app.get('/legal-terms', middleware.view, routes.views.legalTerms);
};
