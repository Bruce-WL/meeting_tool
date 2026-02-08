import winston from 'winston';
import path from 'path';
import fs from 'fs';

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export class TaskLogger {
  private taskId: string;
  private logger: winston.Logger;

  constructor(taskId: string) {
    this.taskId = taskId;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(LOG_DIR, `task_${taskId}.log`),
          options: { flags: 'a' } // Append mode
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.printf(({ message, stage }) => {
              return `[Task ${this.taskId}] [${stage || 'INFO'}] ${message}`;
            })
          )
        })
      ]
    });

    this.log('INIT', 'Task logger initialized', { taskId });
  }

  log(stage: string, message: string, data?: unknown) {
    this.logger.info(message, { stage, data });
  }

  warn(stage: string, message: string, data?: unknown) {
    this.logger.warn(message, { stage, data });
  }

  error(stage: string, message: string, error?: unknown) {
    const errData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;

    this.logger.error(message, { stage, error: errData });
  }
}
