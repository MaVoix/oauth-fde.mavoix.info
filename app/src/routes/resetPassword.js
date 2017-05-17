import keystone from 'keystone';
import bcrypt from 'bcrypt';

const PasswordResetToken = keystone.list('PasswordResetToken');
const User = keystone.list('User');

export default async (req, res) => {
  const password = req.body.password;
  const passwordConfirmation = req.body.passwordConfirmation;
  const view = new keystone.View(req, res);

  if (password != passwordConfirmation) {
    return view.render('reset-password', {error: true, token: req.params.token});
  }

  const tokens = await PasswordResetToken.model.find({expiration: {$gt: Date.now()}});

  for (var token of tokens) {
    if (bcrypt.compareSync(req.params.token, token.token)) {
      const user = await User.model.findById(token.user);

      user.password = password;
      await user.save();

      await PasswordResetToken.model.remove({user: user});

      return view.render('reset-password', {success: true});
    }
  }
}
