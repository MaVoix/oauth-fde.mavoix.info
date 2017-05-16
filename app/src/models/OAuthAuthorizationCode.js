import keystone from 'keystone';

const Types = keystone.Field.Types;

const OAuthAuthorizationCode = new keystone.List('OAuthAuthorizationCode', {
  noedit: true,
  nodelete: true,
  nocreate: true,
  label: 'AuthorizationCode',
});

OAuthAuthorizationCode.add({
  key: { type: String },
  client: { type: Types.Relationship, ref: 'OAuthClient' },
  redirectUri: { type: String },
  user: { type: Types.Relationship, ref: 'OAuthUser' },
});

OAuthAuthorizationCode.register();
