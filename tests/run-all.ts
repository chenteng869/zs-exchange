/**
 * 全量测试运行器
 *
 * 一键运行所有模块测试，输出汇总
 *
 * 用法：
 *   npx tsx tests/run-all.ts
 */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const TESTS_DIR = new URL('.', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');

const testFiles = readdirSync(TESTS_DIR)
  .filter((f) => f.endsWith('.test.ts'))
  .sort();

console.log(`\n🧪 全量测试运行器 (${testFiles.length} 个测试文件)\n`);
console.log('━'.repeat(60));

let totalPass = 0;
let totalFail = 0;
const results: Array<{ name: string; pass: number; fail: number; duration: number }> = [];

for (const file of testFiles) {
  const start = Date.now();
  const res = spawnSync('npx', ['tsx', '--test', file], {
    cwd: process.cwd(),
    encoding: 'utf-8',
  });
  const duration = Date.now() - start;
  const out = res.stdout + res.stderr;

  // 解析测试结果
  const passMatch = out.match(/ℹ pass (\d+)/);
  const failMatch = out.match(/ℹ fail (\d+)/);
  const pass = passMatch ? parseInt(passMatch[1], 10) : 0;
  const fail = failMatch ? parseInt(failMatch[1], 10) : 0;

  totalPass += pass;
  totalFail += fail;

  const status = fail > 0 ? '❌' : '✅';
  const name = file.replace('.test.ts', '');
  console.log(`${status} ${name.padEnd(20)} pass=${pass.toString().padStart(3)} fail=${fail.toString().padStart(2)} (${duration}ms)`);
  results.push({ name, pass, fail, duration });
}

console.log('━'.repeat(60));
console.log(`\n📊 汇总: ${totalPass + totalFail} 测试 / ${totalPass} 通过 / ${totalFail} 失败\n`);

if (totalFail === 0) {
  console.log('🎉 全部通过！\n');
  process.exit(0);
} else {
  console.log('⚠️  有失败用例，请检查。\n');
  process.exit(1);
}
