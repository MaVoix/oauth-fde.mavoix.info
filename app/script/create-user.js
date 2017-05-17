#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var keystone = require('keystone');
var argv = require('minimist')(process.argv.slice(2));
var mongoUri = 'mongodb://127.0.0.1/oauth-fde-mavoix-info'

keystone.init({mongo: mongoUri, headless: true});
keystone.mongoose.connect(mongoUri);
keystone.import('../dist/models');

var User = keystone.list('User');

function addUser(email, password, isAdmin, firstname, lastname, birthdate, done) {
  User.model.findOne({email:email})
    .exec((err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        var newAdmin = new User.model({
          email: email,
          name: {firstname: firstname, lastname: lastname},
          password: password,
          isAdmin: isAdmin,
          birthdate: birthdate,
        });

        return newAdmin.save((saveErr) => {
          if (saveErr) {
            return done(saveErr);
          }

          console.log('User created.');
          return done(null, newAdmin);
        });
      } else {
        console.log('User already exists.');
        return done(null, user);
      }
    });
};

addUser(
  argv.email, argv.password, argv.isAdmin === 'true', argv.firstname, argv.lastname, argv.birthdate,
  (err, user) => {
    if (!!err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  }
);
