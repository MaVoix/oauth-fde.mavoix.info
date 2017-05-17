import keystone from 'keystone';
import hydra from '../../hydra';

// This endpoint is hit when hydra initiates the consent flow
export default (r, w) => {
  const view = new keystone.View(r, w);

  console.log(r.user);


  if (!r.user) {
    // The user is not authenticated yet, so redirect him to the log in page
    return w.redirect('/login?error=Please+log+in&challenge=' + r.query.challenge);
  } else if (r.query.error) {
    // An error occurred (at hydra)
    return view.render('error', { error: { name: r.query.error, message: r.query.error_description } });
  }

  // admin are special accounts that cannot be used with OAuth but only for the KeystoneJS admin
  if (r.user.isAdmin) {
    return view.render('error', { error: { name: 'invalid_account', message: 'admin accounts cannot use OAuth' } });
  }

  // Ok, the user is authenticated! Let's show the consent screen!
  hydra.verifyConsentChallenge(r.query.challenge).then(({ challenge }) => {
    // challenge contains informations such as requested scopes, client id, ...
    // Here you could, for example, allow clients to force a user's consent. Since you're able to
    // say which scopes a client can request in hydra, you could allow this for a few highly priviledged clients!
    //
    // if (challenge.scp.find((s) => s === 'force-consent')) {
    //   resolveConsent(r, w, r.query.challenge, challenge.scp)
    //   return Promise.resolve()
    // }

    // render the consent screen
    view.render('consent', { scopes: challenge.scp });

    return Promise.resolve();
  });
}
