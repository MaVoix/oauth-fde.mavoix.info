import keystone from 'keystone';
import child_process from 'child_process';

const Types = keystone.Field.Types;

const OAuthClient = new keystone.List('OAuthClient', {
  noedit: true,
  track: { createdAt: true, createdBy: true }
});

OAuthClient.add({
  name: { type: Types.Text, required: true, index: true },
  clientId: { type: String, required: false, initial: false },
  clientSecret: { type: Types.Password, required: false, initial: false },
  callbackURLs: { type: Types.TextArray, required: true, initial: true },
  allowedScopes: { type: Types.TextArray, required: true, initial: true },
});

OAuthClient.schema.pre('save', function(next) {
  if (this.isNew) {
    child_process.exec(
      'hydra clients create'
      + ' --allowed-scopes ' +  this.allowedScopes.join(',')
      + ' --callbacks ' + this.callbackURLs.join(','),
      {
      },
      (err, stdout, stderr) => {
        const lines = stdout.split('\n');

        this.clientId = /^Client ID: (.*)$/gm.exec(lines[0])[1];
        this.clientSecret = /^Client Secret: (.*)$/gm.exec(lines[1])[1];

        next(err);
      }
    );
  }
});

OAuthClient.register();
