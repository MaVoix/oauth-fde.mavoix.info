import keystone from 'keystone'

export default async (req, res) => {
  console.log(req.session);
  req.session.isAuthenticated = false;
  req.session.user = null;
  console.log(req.session);
  res.redirect('/login');
}
