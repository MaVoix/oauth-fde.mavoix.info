import keystone from 'keystone'

export default (req, res) => {
  if (!!req.user) {
    // FIXME: redirect to the /account page
    return res.redirect('/');
  }

  new keystone.View(req, res).render(
    'login',
    {
      error: req.query.error,
      challenge: req.query.challenge
    }
  );
}
