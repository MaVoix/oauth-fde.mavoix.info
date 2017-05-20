import keystone from 'keystone'

export default (req, res) => {
  if (!!req.user) {
    return res.redirect('/account');
  }

  res.view.render(
    'login',
    {
      error: req.query.error,
      challenge: req.query.challenge
    }
  );
}
