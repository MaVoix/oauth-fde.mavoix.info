import keystone from 'keystone'
import bcrypt from 'bcrypt'

const User = keystone.list('User');

export default async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const challenge = req.body.challenge;
  const user = await User.model.findOne({email: email});

  if (!!user && bcrypt.compare(user.password, password)) {
    keystone.session.signinWithUser(user, req, res, () => {
      if (!!req.body.challenge) {
        res.redirect('/consent?challenge=' + req.body.challenge);
      } else {
        res.redirect('/account');
      }
    });
  } else {
    res.redirect('/login?error=Wrong+credentials+provided&challenge=' + challenge)
  }
}
