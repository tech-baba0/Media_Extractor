const fs = require('fs');
const jsonCookies = JSON.parse(fs.readFileSync('./cookies.txt.json', 'utf8'));
let netscapeStr = '# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n';
for (const cookie of jsonCookies) {
  const domain = cookie.domain || '';
  const includeSubDomain = domain.startsWith('.') ? 'TRUE' : 'FALSE';
  const path = cookie.path || '/';
  const secure = cookie.secure ? 'TRUE' : 'FALSE';
  const expiration = cookie.expirationDate ? Math.floor(cookie.expirationDate) : 0;
  const name = cookie.name;
  const value = cookie.value;
  netscapeStr += `${domain}\t${includeSubDomain}\t${path}\t${secure}\t${expiration}\t${name}\t${value}\n`;
}
fs.writeFileSync('./cookies.txt', netscapeStr);
console.log('Successfully converted JSON cookies to Netscape format (cookies.txt)');
