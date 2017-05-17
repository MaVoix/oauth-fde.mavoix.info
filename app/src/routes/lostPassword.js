import keystone from 'keystone';
import srs from 'secure-random-string';

const User = keystone.list('User');
const PasswordResetToken = keystone.list('PasswordResetToken');

export default async (req, res) => {
  const email = req.body.email;
  const user = await User.model.findOne({email: email});
  const view = new keystone.View(req, res);

  if (!!user) {
    const token = PasswordResetToken.model({user: user, token: srs(32)});

    // FIXME: send the link with token by email
    console.log(token);

    await token.save();

    view.render('lost-password', {success: true, email: email});
  } else {
    view.render('lost-password', {success: false, error: true, email: email});
  }
}
