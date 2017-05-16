import keystone from 'keystone';

const Types = keystone.Field.Types;

const OAuthUser = new keystone.List('OAuthUser', {
  label: 'User',
});

OAuthUser.add({
  name: { type: Types.Name, required: true, initial: true },
  password: { type: Types.Password, required: true, initial: true },
  email: { type: Types.Email, required: true, initial: true },
  birthdate: { type: Types.Date, required: true, initial: true }
});

OAuthUser.register();
