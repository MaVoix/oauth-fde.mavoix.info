import keystone from 'keystone'

const User = keystone.list('User');

export default async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const challenge = req.body.challenge;
  const user = await User.model.findOne({email: email});

  // user does not exist
  if (!user) {
    if (!!challenge) {
      return res.redirect('/login?error=Wrong+credentials+provided&challenge=' + challenge);
    } else {
      return res.redirect('/login?error=Wrong+credentials+provided');
    }
  }

  user._.password.compare(password, (err, result) => {
    console.log(err, result);
    if (result) {
      // password matches: let's sign the user in
      keystone.session.signinWithUser(user, req, res, () => {
        if (!!req.body.challenge) {
          res.redirect('/consent?challenge=' + req.body.challenge);
        } else {
          res.redirect('/account');
        }
      });
    } else {
      // password does not match
      if (!!challenge) {
        res.redirect('/login?error=Wrong+credentials+provided&challenge=' + challenge);
      } else {
        res.redirect('/login?error=Wrong+credentials+provided');
      }
    }
  })
}
