/**
 * Console logger implementation
 */

import { ILogger } from './interfaces';

export class ConsoleLogger implements ILogger {
  constructor(private readonly minLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {}

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️  ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️  ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, error?.message || '', meta ? JSON.stringify(meta, null, 2) : '');
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`🔍 ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }
}
