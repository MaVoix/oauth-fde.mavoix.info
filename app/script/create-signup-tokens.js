#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var keystone = require('keystone');
var argv = require('minimist')(process.argv.slice(2));
var srs = require('secure-random-string');
var async = require('async');
var mongoUri = 'mongodb://127.0.0.1/oauth-fde-mavoix-info';

keystone.init({mongo: mongoUri, headless: true});
keystone.mongoose.connect(mongoUri);
keystone.import('../dist/models');

var SignUpToken = keystone.list('SignUpToken');

function createTokens(count, done) {
  var tokens = [];
  for (var i = 0; i < count; ++i) {
    var token = srs(32);
    console.log(token);
    tokens.push({token: token});
  }

  SignUpToken.model.create(tokens, done);
};

createTokens(
  parseInt(argv.count),
  (err, user) => {
    if (!!err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  }
);
