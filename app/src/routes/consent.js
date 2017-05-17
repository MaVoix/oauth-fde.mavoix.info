import hydra from '../hydra';

// This get's executed when we want to tell hydra that the user is authenticated and that he authorized the application
async function resolveConsent(r, w, challenge, scopes = []) {
  const user = r.session.user;
  const data = {};

  // Sometimes the body parser doesn't return an array, so let's fix that.
  if (!Array.isArray(scopes)) {
    scopes = [scopes];
  }
  // This is the openid 'profile' scope which should include some user profile data. (optional)
  if (scopes.indexOf('profile') >= 0) {
    data.name = user.name.first + " " + user.name.last;
    data.birthdate = user.birthdate;
  }

  // This is to fulfill the openid 'email' scope which returns the user's email address. (optional)
  if (scopes.indexOf('email') >= 0) {
    data.email = user.email;
  }

  // Make sure that the consent challenge is valid
  try {
    const decoded = await hydra.verifyConsentChallenge(challenge);
    const consentResponse = await hydra.generateConsentResponse(challenge, user.id, scopes, {}, data);

    w.redirect(decoded.challenge.redir + '&consent=' + consentResponse.consent);
  } catch (e) {
    // FIXME
    console.log(e);
  }
}

export default async (r, w) => {
  if (!r.session.isAuthenticated) {
    return w.redirect('/login?error=Please+log+in&challenge=' + r.body.challenge);
  }

  await resolveConsent(r, w, r.query.challenge, r.body.allowed_scopes);
}
