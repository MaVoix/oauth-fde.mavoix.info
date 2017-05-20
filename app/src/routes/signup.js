import keystone from 'keystone'
import bcrypt from 'bcrypt';
import validateEmail from '../validateEmail';

const User = keystone.list('User');
const SignUpToken = keystone.list('SignUpToken');

export default async (req, res) => {
  const {password, passwordConfirmation, email, firstname, lastname, birthdate, cgu, token} = req.body;

  console.log(password);
  console.log(passwordConfirmation);
  console.log(email);
  console.log(firstname);
  console.log(lastname);
  console.log(cgu);
  console.log(token);

  var error = {};

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
    error['token'] = true;
  }

  // check the cgu
  if (!cgu || cgu !== 'true') {
    error['cgu'] = true;
  }

  // check the birthdate
  if (!birthdate) {
    error['birthdate'] = true;
  }

  // check the firstname and lastname
  if (!firstname) {
    error['firstname'] = true;
  }
  if (!lastname) {
    error['lastname'] = true;
  }

  // check the password
  if (password != passwordConfirmation || password.length < 8) {
    error['password'] = true;
  }

  // check the email address
  if (!email || !validateEmail(email)) {
    error['email'] = true;
  }
  const existingUser = await User.model.findOne({email: email});
  if (!!existingUser) {
    error['email'] = true;
  }

  if (Object.keys(error).length !== 0) {
    return res.view.render('signup', {error: error, token: token, data: req.body});
  }

  // FIXME: create the account
  const newUser = await User.model({
    email: email,
    firstname: firstname,
    lastname: lastname,
    birthdate: birthdate,
    password: password,
  });

  await newUser.save();

  // FIXME: send email validation email

  // sign up is complete, this token must be discarded
  await validToken.remove();

  return res.view.render('signup', {success: true, user: newUser});
}
