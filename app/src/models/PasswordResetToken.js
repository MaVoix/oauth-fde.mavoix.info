import keystone from 'keystone';
import hash from '../hash';

const Types = keystone.Field.Types;

const PasswordResetToken = new keystone.List('PasswordResetToken', {
  noedit: true,
  nocreate: true,
  defaultColumns: 'name, expiration',
});

const EXPIRATION_DELAY = 86400000; // 24 hours in milliseconds

PasswordResetToken.add({
  user: { type: Types.Relationship, ref: 'User', required: true, initial: true },
  token: { type: Types.Text, required: true, initial: true },
  expiration: { type: Types.Datetime, required: true, default: () => Date.now() + EXPIRATION_DELAY },
});

PasswordResetToken.schema.pre('save', async function(next) {
  this.token = hash(this.token);

  // delete expired tokens
  await PasswordResetToken.model.remove({
    $or: [
      {user: this.user},
      {expiration: {$lt: Date.now()}}
    ]
  });

  next();
});

PasswordResetToken.register();
