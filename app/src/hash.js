import SHA3 from 'sha3';

export default function(str) {
  var d = new SHA3.SHA3Hash();

  d.update(str);

  return d.digest('hex');
}
