import keystone from 'keystone';
import srs from 'secure-random-string';
import Mailgun from 'mailgun-js';

const User = keystone.list('User');
const PasswordResetToken = keystone.list('PasswordResetToken');

export default async (req, res) => {
  const email = req.body.email;
  const user = await User.model.findOne({email: email});
  const view = new keystone.View(req, res);

  if (!!user) {
    const token = PasswordResetToken.model({user: user, token: srs(32)});
    const api_key = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    var mailgun = new Mailgun({apiKey: api_key, domain: domain});
    var data = {
      from: "no-reply@auth.mavoix.info",
      to: email,
      subject: "Réinitialiser votre mot de passe #MAVOIX",
      html: "Ajouter le HTML du mail ici."
    };

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
            res.render('error', { error : err});
            console.log("got an error: ", err);
        }
        //Else we can greet    and leave
        else {
            //Here "submitted.jade" is the view file for this landing page
            //We pass the variable "email" from the url parameter in an object rendered by Jade
            //res.render('submitted', { email : req.params.mail });
            console.log(body);
        }
    });
    console.log(token);

    await token.save();

    view.render('lost-password', {success: true, email: email});
  } else {
    view.render('lost-password', {success: false, error: true, email: email});
  }
}
