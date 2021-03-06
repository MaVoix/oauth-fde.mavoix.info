var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var User = new keystone.List('User', {
  track: { createdAt: true, updatedAt: true },
});

User.add({
  name: { type: Types.Name, required: true },
  email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
  password: { type: Types.Password, initial: true, required: true },
    birthdate: { type: Types.Date, required: true, initial: true }
}, 'Permissions', {
  isAdmin: { type: Boolean, label: 'Can access Keystone', index: true },
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
  return this.isAdmin;
});


/**
 * Registration
 */
User.defaultColumns = 'name, email, isAdmin';
User.register();
