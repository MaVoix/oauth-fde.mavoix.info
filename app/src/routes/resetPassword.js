import keystone from 'keystone';
import hash from '../hash';

const PasswordResetToken = keystone.list('PasswordResetToken');
const User = keystone.list('User');

export default async (req, res) => {
  const password = req.body.password;
  const passwordConfirmation = req.body.passwordConfirmation;
  const view = new keystone.View(req, res);

  if (password != passwordConfirmation || password.length < 8) {
    return view.render('update-password', {error: true, token: req.params.token});
  }

  const token = await PasswordResetToken.model.find({token: hash(req.params.token)});
  const user = await User.model.findById(token.user);

  user.password = password;
  await user.save();

  await token.remove({user: user});

  return view.render('update-password', {success: true});
}
