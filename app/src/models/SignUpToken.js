import keystone from 'keystone';

const Types = keystone.Field.Types;

const SignUpToken = new keystone.List('SignUpToken', {
  noedit: true,
  // nocreate: true,
});

SignUpToken.add({
  token: { type: Types.Password, required: true, index: true, initial: true },
});

SignUpToken.register();
