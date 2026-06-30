import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const r = spawnSync('npx', ['tsx', '--test', 'tests/algo-engine.test.ts'], {
  encoding: 'utf-8',
  cwd: 'D:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01',
  shell: true,
});
writeFileSync('D:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01/algo-test-out.log',
  '=== STDOUT ===\n' + r.stdout + '\n=== STDERR ===\n' + r.stderr,
  'utf-8');
console.log('written, status', r.status);
