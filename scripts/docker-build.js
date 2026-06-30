const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.dirname(__dirname);

function runCommand(cmd, options = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...options });
}

function checkPackageLockSync() {
  console.log('Checking package-lock.json sync status...');
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageLockPath = path.join(rootDir, 'package-lock.json');
  
  if (!fs.existsSync(packageLockPath)) {
    console.log('package-lock.json not found, generating...');
    runCommand('npm install', { cwd: rootDir });
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
  
  if (packageJson.version !== packageLock.version) {
    console.log('package.json version mismatch, regenerating lockfile...');
    runCommand('npm install', { cwd: rootDir });
    return;
  }
  
  const pkgDeps = Object.keys(packageJson.dependencies || {});
  const lockDeps = Object.keys(packageLock.dependencies || {});
  
  const missingInLock = pkgDeps.filter(dep => !lockDeps.includes(dep));
  if (missingInLock.length > 0) {
    console.log(`Missing dependencies in lockfile: ${missingInLock.join(', ')}`);
    runCommand('npm install', { cwd: rootDir });
    return;
  }
  
  console.log('package-lock.json is synchronized.');
}

function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'build';
  
  console.log('=== Docker Build Script ===\n');
  
  checkPackageLockSync();
  
  if (target === 'build') {
    console.log('\nBuilding Docker image...');
    runCommand('docker build -t stock-exchange-dapp .', { cwd: rootDir });
    console.log('\nBuild completed successfully!');
  } else if (target === 'dev') {
    console.log('\nStarting development environment...');
    runCommand('docker compose -f docker-compose.yml up -d', { cwd: rootDir });
    console.log('\nDevelopment environment started!');
  } else if (target === 'prod') {
    console.log('\nStarting production environment...');
    runCommand('docker compose -f docker-compose.yml up -d', { cwd: rootDir });
    console.log('\nProduction environment started!');
  } else if (target === 'clean') {
    console.log('\nCleaning Docker resources...');
    runCommand('docker compose down', { cwd: rootDir });
    runCommand('docker image prune -f', { cwd: rootDir });
    console.log('\nCleanup completed!');
  } else {
    console.log(`Unknown target: ${target}`);
    console.log('Usage: node scripts/docker-build.js [build|dev|prod|clean]');
  }
}

main();