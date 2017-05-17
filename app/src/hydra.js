import Hydra from 'hydra-js';

export default new Hydra({
  client: {
    id: process.env.HYDRA_CLIENT_ID, // id of the client you want to use, defaults to this env var
    secret: process.env.HYDRA_CLIENT_SECRET, // secret of the client you want to use, defaults to this env var
  },
  auth: {
    tokenHost: process.env.HYDRA_URL, // hydra url, defaults to this env var
    authorizePath: '/oauth2/auth', // hydra authorization endpoint, defaults to '/oauth2/auth'
    tokenPath: '/oauth2/token', // hydra token endpoint, defaults to '/oauth2/token'
  },
  scope: 'hydra.keys.get' // scope of the authorization, defaults to 'hydra.keys.get'
});
