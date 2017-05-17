import keystone from 'keystone'

export default (req, res) => {
  if (!!req.user) {
    return res.redirect('/account');
  }

  new keystone.View(req, res).render(
    'login',
    {
      error: req.query.error,
      challenge: req.query.challenge
    }
  );
}
