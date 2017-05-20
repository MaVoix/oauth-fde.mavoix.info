import keystone from 'keystone';
import hash from '../../hash';

const PasswordResetToken = keystone.list('PasswordResetToken');

export default async (req, res) => {
  const token = await PasswordResetToken.model.find({token: hash(req.params.token)});

  if (!!token) {
    return res.view.render('update-password', {token: req.params.token});
  }

  // FIXME: proper error page/message
  return res.redirect('/');
}
