import keystone from 'keystone';

const Types = keystone.Field.Types;

const OAuthClient = new keystone.List('OAuthClient', {
  noedit: true,
  nodelete: true,
  nocreate: true,
  label: 'Client',
});

OAuthClient.add({
  clientSecret: { type: String },
  redirectUris: { type: Types.TextArray },
});

OAuthClient.register();
