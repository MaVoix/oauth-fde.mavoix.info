import keystone from 'keystone'

export default (r, w) => {
  new keystone.View(r, w).render(
    'login',
    {
      error: r.query.error,
      // user,
      challenge: r.query.challenge
    }
  );
}
