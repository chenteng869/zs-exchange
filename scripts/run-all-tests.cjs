const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const testFilePattern = /\.(test|spec)\.(ts|tsx)$/;
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'output', 'www', 'android', 'ios', 'coverage']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), files);
      }
      continue;
    }

    if (testFilePattern.test(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function isNodeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return /node:test/.test(content);
}

function toRelativeArgs(filePaths) {
  return filePaths.map((filePath) => path.relative(repoRoot, filePath));
}

function runCommand(command, args) {
  const useCmdWrapper = process.platform === 'win32' && /\.cmd$/i.test(command);
  const result = useCmdWrapper
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command, ...args], {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: false,
      })
    : spawnSync(command, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: false,
      });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const explicitArgs = process.argv.slice(2)
  .map((fileArg) => path.resolve(repoRoot, fileArg))
  .filter((filePath) => fs.existsSync(filePath));

const discoveredFiles = explicitArgs.length > 0
  ? explicitArgs
  : walk(repoRoot).sort();

const nodeTestFiles = discoveredFiles.filter(isNodeTestFile);
const vitestFiles = discoveredFiles.filter((filePath) => !isNodeTestFile(filePath));

let exitCode = 0;

if (vitestFiles.length > 0) {
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  exitCode = runCommand(npxCommand, ['vitest', 'run', ...toRelativeArgs(vitestFiles)]);
}

if (exitCode === 0 && nodeTestFiles.length > 0) {
  exitCode = runCommand(process.execPath, ['--import', 'tsx', '--test', ...toRelativeArgs(nodeTestFiles)]);
}

process.exit(exitCode);