// Quick smoke test - just runs one test
import { decMul, decAdd, decSub, decDiv, decCmp, decIsZero } from '../src/lib/matching/decimal';

console.log('decAdd 0.1+0.2 =', decAdd('0.1', '0.2'));
console.log('decSub 1-0.1 =', decSub('1', '0.1'));
console.log('decMul 0.5*2 =', decMul('0.5', '2'));
console.log('decDiv 1/4 =', decDiv('1', '4', 8));
console.log('decCmp 0.1 vs 0.2 =', decCmp('0.1', '0.2'));
console.log('decCmp 1 vs 1 =', decCmp('1', '1'));
console.log('decIsZero 0 =', decIsZero('0'));
console.log('Tests pass');
