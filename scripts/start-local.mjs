#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stateDirectory = join(projectDirectory, '.nexora');
const stampPath = join(stateDirectory, 'dependencies.json');
const lockPath = join(stateDirectory, 'startup.lock');
const recoveryLockPath = join(stateDirectory, 'startup-recovery.lock');
const nodeDirectory = dirname(process.execPath);
const nodeMajor = Number(process.versions.node.split('.')[0]);
let activeChild;
let previewServer;
let ownsStartupLock = false;
let stopping = false;

function log(message) {
  console.log(`[Nexora] ${message}`);
}

function releaseStartupLock() {
  if (ownsStartupLock) {
    rmSync(lockPath, { force: true });
    ownsStartupLock = false;
  }
}

function claimStartupLock() {
  writeFileSync(lockPath, JSON.stringify({ pid: process.pid }), { flag: 'wx' });
  ownsStartupLock = true;
}

function recoverStaleStartupLock(waitedTooLong) {
  // Serialize stale-lock recovery too: two launchers must never both delete a
  // dead process's lock and accidentally remove the winner's replacement lock.
  try {
    writeFileSync(recoveryLockPath, JSON.stringify({ pid: process.pid }), { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    try {
      const { pid } = JSON.parse(readFileSync(recoveryLockPath, 'utf8'));
      if (!Number.isInteger(pid) || pid < 1) {
        throw new Error('The recovery lock is invalid. Close other launchers, remove .nexora/startup-recovery.lock, and try again.');
      }
      process.kill(pid, 0);
    } catch (recoveryError) {
      if (recoveryError.code === 'ESRCH') {
        throw new Error('An earlier launcher stopped while recovering startup. Close other launchers, remove .nexora/startup-recovery.lock, and try again.');
      }
      if (waitedTooLong && recoveryError instanceof SyntaxError) {
        throw new Error('The recovery lock is incomplete. Close other launchers, remove .nexora/startup-recovery.lock, and try again.');
      }
      if (recoveryError.code !== 'ENOENT' && !(recoveryError instanceof SyntaxError)) throw recoveryError;
    }
    return;
  }
  try {
    const { pid } = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (!Number.isInteger(pid) || pid < 1) throw new Error('The startup lock has an invalid process ID. Remove .nexora/startup.lock and try again.');
    try {
      process.kill(pid, 0);
      return;
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    rmSync(lockPath, { force: true });
    try {
      claimStartupLock();
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  } finally {
    rmSync(recoveryLockPath, { force: true });
  }
}

async function acquireStartupLock() {
  const startedAt = Date.now();
  let announcedWait = false;
  while (!stopping) {
    try {
      claimStartupLock();
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    try {
      recoverStaleStartupLock(Date.now() - startedAt > 10000);
      if (ownsStartupLock) return;
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      // A different launcher can be in the middle of writing its lock file.
      if (Date.now() - startedAt > 10000 && error instanceof SyntaxError) {
        throw new Error('A startup lock is incomplete. Close other launcher windows, delete .nexora/startup.lock, and try again.');
      }
      if (!(error instanceof SyntaxError)) throw error;
    }
    if (!announcedWait) {
      log('Another launcher is preparing the project. Waiting for it to finish...');
      announcedWait = true;
    }
    if (Date.now() - startedAt > 600000) {
      throw new Error('Another launcher is still preparing the project. Wait for that window to finish, then try again.');
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error('Startup cancelled.');
}

function findNpmCli() {
  const candidates = [
    process.env.NEXORA_NPM_CLI,
    process.env.npm_execpath,
    join(nodeDirectory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    resolve(nodeDirectory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    resolve(nodeDirectory, '..', 'share', 'nodejs', 'npm', 'bin', 'npm-cli.js'),
  ];
  for (const directory of (process.env.PATH || '').split(delimiter)) {
    try {
      candidates.push(realpathSync(join(directory, 'npm')));
    } catch { /* This PATH entry does not contain a Unix npm executable. */ }
    candidates.push(join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js'));
  }
  const npmCli = candidates.find((candidate) => candidate && /npm-cli\.js$/i.test(candidate) && existsSync(candidate));
  if (!npmCli) {
    throw new Error('npm was not found alongside Node.js. Install Node.js with npm from https://nodejs.org/en/download, or on Windows use START-WEBSITE.cmd.');
  }
  return npmCli;
}

function runNpm(npmCli, arguments_, { quiet = false } = {}) {
  return new Promise((resolveResult, reject) => {
    // Execute npm's JS entry point directly: no shell quoting or .cmd issues on Windows.
    const child = spawn(process.execPath, [npmCli, ...arguments_], {
      cwd: projectDirectory,
      env: { ...process.env, PATH: `${nodeDirectory}${delimiter}${process.env.PATH || ''}` },
      stdio: ['inherit', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
      windowsHide: true,
    });
    activeChild = child;
    let output = '';
    for (const [stream, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.on('data', (chunk) => {
        output = (output + chunk.toString()).slice(-65536);
        if (!quiet) destination.write(chunk);
      });
    }
    child.once('error', (error) => {
      if (activeChild === child) activeChild = undefined;
      reject(error);
    });
    child.once('close', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      resolveResult({ code, signal, output });
    });
  });
}

function dependencyFingerprint() {
  const hash = createHash('sha256');
  hash.update(`${process.platform}:${process.arch}:node-${nodeMajor}\n`);
  for (const filename of ['package.json', 'package-lock.json']) {
    const path = join(projectDirectory, filename);
    hash.update(filename);
    hash.update(existsSync(path) ? readFileSync(path) : '<absent>');
  }
  return hash.digest('hex');
}

async function installDependencies(npmCli) {
  rmSync(stampPath, { force: true });
  const command = existsSync(join(projectDirectory, 'package-lock.json')) ? 'ci' : 'install';
  log(`Installing the project's packages (npm ${command}). The first start may take a few minutes...`);
  const result = await runNpm(npmCli, [command, '--include=dev', '--no-audit', '--no-fund']);
  if (result.code !== 0) {
    throw new Error('Package installation failed. Check the error above and your internet connection, then start again.');
  }
  writeFileSync(stampPath, `${JSON.stringify({ fingerprint: dependencyFingerprint() }, null, 2)}\n`);
}

async function prepareProject(npmCli) {
  await acquireStartupLock();
  try {
    let storedFingerprint;
    try {
      storedFingerprint = JSON.parse(readFileSync(stampPath, 'utf8')).fingerprint;
    } catch { /* A new or interrupted installation must be prepared again. */ }
    let reuse = storedFingerprint === dependencyFingerprint();
    if (reuse) {
      log('Checking the installed packages...');
      reuse = (await runNpm(npmCli, ['ls', '--all', '--include=dev', '--parseable'], { quiet: true })).code === 0;
    }
    if (stopping) return;
    if (reuse) log('Packages are ready; reusing the existing installation.');
    else await installDependencies(npmCli);
    if (stopping) return;

    log('Building the website...');
    let result = await runNpm(npmCli, ['run', 'build']);
    if (stopping) return;
    // npm ls checks dependency metadata. This also repairs missing package files.
    if (reuse && result.code !== 0 && /cannot find module|cannot find package|module_not_found|enoent[^\n]*node_modules|vite[^\n]*(not found|not recognized)/i.test(result.output)) {
      log('Some installed package files are missing. Refreshing packages and trying the build once more...');
      await installDependencies(npmCli);
      if (stopping) return;
      result = await runNpm(npmCli, ['run', 'build']);
    }
    if (result.code !== 0) throw new Error('The website build failed. The compiler error is shown above.');
  } finally {
    releaseStartupLock();
  }
}

function openBrowser(url) {
  let executable;
  let arguments_;
  if (process.platform === 'win32') {
    executable = process.env.ComSpec || 'cmd.exe';
    // The URL is generated by our loopback server; it contains no user input.
    arguments_ = ['/d', '/s', '/c', `start "" "${url}"`];
  } else if (process.platform === 'darwin') {
    executable = '/usr/bin/open';
    arguments_ = [url];
  } else {
    executable = 'xdg-open';
    arguments_ = [url];
  }
  const opener = spawn(executable, arguments_, {
    stdio: 'ignore',
    detached: true,
    windowsHide: true,
    windowsVerbatimArguments: process.platform === 'win32',
  });
  const reportFailure = () => log(`Your browser could not open automatically. Open this address: ${url}`);
  opener.once('error', reportFailure);
  opener.once('exit', (code) => { if (code !== 0) reportFailure(); });
  opener.unref();
}

async function closePreview() {
  if (!previewServer) return;
  const server = previewServer.httpServer;
  previewServer = undefined;
  await new Promise((done) => {
    const timeout = setTimeout(() => {
      server.closeAllConnections?.();
      done();
    }, 3000);
    timeout.unref();
    server.close(() => { clearTimeout(timeout); done(); });
    server.closeIdleConnections?.();
  });
}

function signalChild(child, signal) {
  try {
    if (process.platform === 'win32') {
      // npm run starts a cmd.exe child on Windows. Stop only this launcher's
      // process tree so an interrupted build cannot keep running in the background.
      const taskkill = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      taskkill.once('error', () => child.kill(signal));
      taskkill.once('exit', (code) => { if (code !== 0) child.kill(signal); });
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') log(`Could not stop a build process: ${error.message}`);
  }
}

async function stop() {
  if (stopping) return;
  stopping = true;
  log('Stopping the local website...');
  const child = activeChild;
  if (child) {
    signalChild(child, 'SIGTERM');
    await new Promise((done) => {
      const timeout = setTimeout(() => { signalChild(child, 'SIGKILL'); done(); }, 3000);
      child.once('close', () => { clearTimeout(timeout); done(); });
    });
  }
  await closePreview();
  releaseStartupLock();
  process.exit(0);
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.includes('--help') || arguments_.includes('-h')) {
    console.log('Start Nexora locally: node scripts/start-local.mjs [--no-open]\n\nInstalls packages when needed, builds the website, starts a local server, and opens your browser.\nNEXORA_NO_OPEN=1 disables automatic browser opening.\nNEXORA_PORT sets the preferred port (default: 4173); occupied ports are skipped.\nOn Windows, START-WEBSITE.cmd also prepares Node.js automatically.\nUse Ctrl+C to stop.');
    return;
  }
  if (arguments_.some((argument) => argument !== '--no-open')) {
    throw new Error('Unknown launcher argument. Run with --help for usage.');
  }
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!(major > 22 || (major === 22 && minor >= 12))) {
    throw new Error('Node.js 22.12 or newer is required. On Windows, double-click START-WEBSITE.cmd to prepare a compatible version.');
  }
  const portText = process.env.NEXORA_PORT || '4173';
  if (!/^\d+$/.test(portText) || Number(portText) < 1024 || Number(portText) > 65535) {
    throw new Error('NEXORA_PORT must be an integer from 1024 to 65535.');
  }
  process.chdir(projectDirectory);
  if (!existsSync(join(projectDirectory, 'package.json'))) {
    throw new Error('package.json is missing. Extract the complete project folder before using the launcher.');
  }
  mkdirSync(stateDirectory, { recursive: true });
  log(`Starting Nexora with Node.js ${process.versions.node}.`);
  const npmCli = findNpmCli();
  await prepareProject(npmCli);
  if (stopping) return;
  if (!existsSync(join(projectDirectory, 'dist', 'index.html'))) {
    throw new Error('The build did not produce dist/index.html. Check the project build configuration.');
  }

  const { preview } = await import('vite');
  previewServer = await preview({
    root: projectDirectory,
    preview: { host: '127.0.0.1', port: Number(portText), strictPort: false, open: false },
  });
  if (stopping) { await closePreview(); return; }
  const address = previewServer.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('The local server did not return its listening address.');
  const url = `http://127.0.0.1:${address.port}/`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`The local server returned HTTP ${response.status}.`);
  await response.arrayBuffer();
  console.log(`\nNEXORA_READY ${url}\n`);
  log('The website is ready. Keep this window open while using it; press Ctrl+C to stop.');
  if (process.env.NEXORA_NO_OPEN !== '1' && !arguments_.includes('--no-open')) openBrowser(url);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', releaseStartupLock);
main().catch(async (error) => {
  if (stopping) return;
  console.error(`\n[Nexora] ${error.message}\n`);
  await closePreview();
  releaseStartupLock();
  process.exitCode = 1;
});
