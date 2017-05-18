import keystone from 'keystone';

export default async (req, res) => {
  const password = req.body.password;
  const passwordConfirmation = req.body.passwordConfirmation;
  const view = new keystone.View(req, res);

  if (password != passwordConfirmation || password.length < 8) {
    return view.render('update-password', {error: true});
  }

  req.user.password = password;
  await req.user.save();

  return view.render('update-password', {success: true});
}
