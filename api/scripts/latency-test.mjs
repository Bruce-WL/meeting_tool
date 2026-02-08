import fs from 'fs';
import path from 'path';

const [filePath, apiBase = 'http://localhost:3001'] = process.argv.slice(2);

if (!filePath) {
  console.log('用法: node api/scripts/latency-test.mjs /path/to/audio [http://localhost:3001]');
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  console.log(`文件不存在: ${resolvedPath}`);
  process.exit(1);
}

const audioBuffer = fs.readFileSync(resolvedPath);
const fileName = path.basename(resolvedPath);

const formData = new FormData();
formData.append('audio', new Blob([audioBuffer]), fileName);

const analyzeResponse = await fetch(`${apiBase}/api/meeting/analyze`, {
  method: 'POST',
  body: formData,
});

if (!analyzeResponse.ok) {
  const errorText = await analyzeResponse.text();
  console.log(`启动失败: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
  console.log(errorText);
  process.exit(1);
}

const analyzeResult = await analyzeResponse.json();
const taskId = analyzeResult.taskId;

console.log(`任务已创建: ${taskId}`);

const pollIntervalMs = 5000;
const startedAt = Date.now();

while (true) {
  const taskResponse = await fetch(`${apiBase}/api/meeting/tasks/${taskId}`);
  if (!taskResponse.ok) {
    const errorText = await taskResponse.text();
    console.log(`查询失败: ${taskResponse.status} ${taskResponse.statusText}`);
    console.log(errorText);
    process.exit(1);
  }

  const task = await taskResponse.json();
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[${elapsed}s] ${task.status} ${task.stage || ''} ${task.progress ?? 0}%`);

  if (task.status === 'completed' || task.status === 'failed') {
    console.log('任务结束');
    if (task.metrics) {
      console.log('时延数据:');
      console.log(JSON.stringify(task.metrics, null, 2));
    }
    if (task.result && task.result.summaryOverview) {
      console.log('--- 摘要预览 (验证中文) ---');
      console.log(task.result.summaryOverview);
      console.log('---------------------------');
    }
    if (task.logs) {
      console.log('日志条数:', task.logs.length);
    }
    break;
  }

  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}
