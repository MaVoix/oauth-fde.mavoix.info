import keystone from 'keystone'

export default async (req, res) => {
  keystone.session.signout(req, res, () => {
    res.redirect('/login');
  })
}
