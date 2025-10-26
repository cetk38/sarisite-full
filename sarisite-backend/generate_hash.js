// generate_hash.js
const bcrypt = require('bcryptjs');

// 1. Adımda belirlediğin yeni şifreyi buraya yaz
const yeniSifre = 'adminSifresi55';

bcrypt.hash(yeniSifre, 10, (err, hash) => {
    if (err) throw err;
    console.log('Yeni şifrenizin HASH değeri aşağıdadır. Kopyalayıp SQL komutunda kullanın:');
    console.log(hash);
});