import keystone from 'keystone'

export default (req, res) => new keystone.View(req, res).render('account', {user: req.user});
