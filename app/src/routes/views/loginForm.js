import keystone from 'keystone'

export default (req, res) => {
  new keystone.View(req, res).render(
    'login',
    {
      error: req.query.error,
      challenge: req.query.challenge
    }
  );
}
