import keystone from 'keystone';

const Types = keystone.Field.Types;

const OAuthAccessToken = new keystone.List('OAuthAccessToken', {
  noedit: true,
  nocreate: true,
  label: 'AccessToken'
});

OAuthAccessToken.add({
  accessToken: { type: String },
  accessTokenExpiresOn: { type: Date },
  client : { type: Types.Relationship, ref: 'OAuthClient' },  // `client` and `user` are required in multiple places, for example `getAccessToken()`
  refreshToken: { type: String },
  refreshTokenExpiresOn: { type: Date },
  user : { type: Types.Relationship, ref: 'OAuthUser' },
});

OAuthAccessToken.register();
