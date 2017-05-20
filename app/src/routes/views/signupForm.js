import keystone from 'keystone';
import hash from '../../hash';

const SignUpToken = keystone.list('SignUpToken');

export default async (req, res) => {
  const token = req.params.token;

  // check the signup token
  const existingToken = await SignUpToken.model.findOne({token: hash(token)});
  if (!existingToken) {
    req.flash('error', 'Erreur.');
		res.redirect('/');
    return;
  }

  return res.view.render('signup', {token: token, data: {}});
}
