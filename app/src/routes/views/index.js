const keystone = require('keystone');
const passport = require('passport');
const login = require('connect-ensure-login');

module.exports.index = (req, res) => {
  var view = new keystone.View(req, res);
  var locals = res.locals;

  // locals.section is used to set the currently selected
  // item in the header navigation.
  locals.section = 'home';

  // Render the view
  view.render('index');
}

module.exports.loginForm = (req, res) => {
  var view = new keystone.View(req, res);
  view.render('login');
}

module.exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });

module.exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

module.exports.account = [
  login.ensureLoggedIn(),
  (req, res) => response.render('account', { user: req.user }),
];
