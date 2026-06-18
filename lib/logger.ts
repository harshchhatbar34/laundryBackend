import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const combinedLogPath = path.join(LOGS_DIR, 'combined.log');
const errorLogPath = path.join(LOGS_DIR, 'error.log');

function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function writeToFile(filePath: string, level: string, message: string, meta?: unknown) {
  try {
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    const logLine = `${getTimestamp()} [${level.toUpperCase()}]: ${message}${metaStr}\n`;
    fs.appendFileSync(filePath, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export const logger = {
  info(message: string, meta?: unknown) {
    const ts = getTimestamp();
    console.log(`\x1b[32m${ts} [INFO]:\x1b[0m ${message}`, meta ? meta : '');
    writeToFile(combinedLogPath, 'info', message, meta);
  },

  warn(message: string, meta?: unknown) {
    const ts = getTimestamp();
    console.warn(`\x1b[33m${ts} [WARN]:\x1b[0m ${message}`, meta ? meta : '');
    writeToFile(combinedLogPath, 'warn', message, meta);
  },

  error(message: string, error?: unknown, meta?: unknown) {
    const ts = getTimestamp();
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : '';
    const fullMessage = `${message} | Error: ${errMessage} ${errStack ? `| Stack: ${errStack}` : ''}`;
    
    console.error(`\x1b[31m${ts} [ERROR]:\x1b[0m ${message}`, error ? error : '', meta ? meta : '');
    
    writeToFile(combinedLogPath, 'error', fullMessage, meta);
    writeToFile(errorLogPath, 'error', fullMessage, meta);
  }
};
