const fs = require('fs');
let c = fs.readFileSync('test-bundle.cjs', 'utf-8');
// 替换 import 路径
c = c.replace(/require\("\.\.\/src\/lib\/wallet\/address"\)/, "require('./address-bundle.cjs')");
fs.writeFileSync('test-bundle-fixed.cjs', c);
console.log('Written test-bundle-fixed.cjs');
console.log('Size:', c.length);
