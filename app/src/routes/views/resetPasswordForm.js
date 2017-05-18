import keystone from 'keystone';
import bcrypt from 'bcrypt';

const PasswordResetToken = keystone.list('PasswordResetToken');

export default async (req, res) => {
  const tokens = await PasswordResetToken.model.find({expiration: {$gt: Date.now()}});

  for (var t of tokens) {
    if (bcrypt.compareSync(req.params.token, t.token)) {
      return new keystone.View(req, res).render('update-password', {token: req.params.token});
    }
  }

  // FIXME: proper error page/message
  return res.redirect('/');
}
