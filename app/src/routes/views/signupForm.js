import keystone from 'keystone';
import bcrypt from 'bcrypt';

const SignUpToken = keystone.list('SignUpToken');

export default async (req, res) => {
  const token = req.params.token;

  // check the activation token
  const existingTokens = await SignUpToken.model.find();
  var validToken = null;
  for (const existingToken of existingTokens) {
    if (bcrypt.compareSync(token, existingToken.token)) {
      validToken = existingToken;
      break;
    }
  }

  if (!validToken) {
    req.flash('error', 'Erreur.');
		res.redirect('/');
    return;
  }

  return res.view.render('signup', {token: token, data: {}});
}
