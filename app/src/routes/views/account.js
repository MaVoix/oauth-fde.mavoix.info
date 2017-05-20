import keystone from 'keystone'

export default (req, res) => res.view.render('account', {user: req.user});
