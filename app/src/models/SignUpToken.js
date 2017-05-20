import keystone from 'keystone';
import hash from '../hash';

const Types = keystone.Field.Types;

const SignUpToken = new keystone.List('SignUpToken', {
  noedit: true,
  nocreate: true,
  defaultColumns: 'token',
});

SignUpToken.add({
  token: { type: Types.Text, required: true, index: true, initial: true },
});

SignUpToken.schema.pre('save', function(next) {
  this.token = hash(this.token);
  next();
});

SignUpToken.register();
