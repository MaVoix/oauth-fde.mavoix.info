import keystone from 'keystone';

export default async (req, res) => new keystone.View(req, res).render('update-password');
