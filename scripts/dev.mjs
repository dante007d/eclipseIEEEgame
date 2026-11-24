import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function launch(label, cwd, args) {
  const proc = spawn(npmCmd, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
  });
  proc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });
  return proc;
}

console.log('Starting Project Eclipse (Server on :3001 + Client on :5173)...');
const serverProc = launch('SERVER', path.join(rootDir, 'server'), ['run', 'dev']);
const clientProc = launch('CLIENT', path.join(rootDir, 'client'), ['run', 'dev']);

function shutdown() {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
