import keystone from 'keystone'
import bcrypt from 'bcrypt'

const User = keystone.list('User');

export default async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const challenge = req.body.challenge;
  const user = await User.model.findOne({email: email});

  if (!!user && bcrypt.compare(user.password, password)) {
    req.session.isAuthenticated = true;
    req.session.user = user;
    res.redirect('/consent?challenge=' + req.body.challenge);
  } else {
    res.redirect('/login?error=Wrong+credentials+provided&challenge=' + challenge)
  }
}
