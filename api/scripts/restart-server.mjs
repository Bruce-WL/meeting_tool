#!/usr/bin/env node
/**
 * 重启后端：先结束占用 3001 端口的进程，再启动 server:dev。
 * 用法：node api/scripts/restart-server.mjs
 * 或：npm run server:restart
 */
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const PORT = process.env.PORT || 3001;

function killPort(port) {
  try {
    // macOS/Linux: 结束占用端口的进程
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
      stdio: 'ignore',
      shell: true
    });
    console.log(`[restart] 已释放端口 ${port}`);
  } catch {
    // 无进程占用或命令不可用
  }
}

killPort(PORT);

// 稍等再启动，避免端口未释放
setTimeout(() => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const child = spawn('npm', ['run', 'server:dev'], {
    cwd: root,
    stdio: 'inherit',
    shell: true
  });
  child.on('error', (err) => {
    console.error('[restart] 启动失败', err);
    process.exit(1);
  });
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}, 800);
