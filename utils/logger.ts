import { addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDev = __DEV__;

  private addLog(level: LogLevel, message: string, data?: any, source?: string) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
    };

    // Store in memory
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Add to Sentry breadcrumbs
    addBreadcrumb({
      message,
      category: source || 'app',
      level: this.mapToSentryLevel(level),
      data,
    });

    // Console output in dev
    if (this.isDev) {
      const prefix = `[${level.toUpperCase()}]${source ? ` [${source}]` : ''}`;
      const consoleMethod = this.getConsoleMethod(level);
      
      if (data) {
        consoleMethod(prefix, message, data);
      } else {
        consoleMethod(prefix, message);
      }
    }
  }

  private mapToSentryLevel(level: LogLevel): 'debug' | 'info' | 'warning' | 'error' {
    switch (level) {
      case 'warn':
        return 'warning';
      default:
        return level;
    }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }

  debug(message: string, data?: any, source?: string) {
    this.addLog('debug', message, data, source);
  }

  info(message: string, data?: any, source?: string) {
    this.addLog('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.addLog('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.addLog('error', message, data, source);
  }

  // Network request logging
  logRequest(method: string, url: string, data?: any) {
    this.info(`API Request: ${method} ${url}`, data, 'network');
  }

  logResponse(method: string, url: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : 'info';
    this.addLog(level, `API Response: ${method} ${url} - ${status}`, data, 'network');
  }

  // Navigation logging
  logNavigation(from: string, to: string, params?: any) {
    this.info(`Navigation: ${from} → ${to}`, params, 'navigation');
  }

  // Authentication logging
  logAuth(action: string, success: boolean, details?: any) {
    const level = success ? 'info' : 'warn';
    this.addLog(level, `Auth: ${action} - ${success ? 'Success' : 'Failed'}`, details, 'auth');
  }

  // Database logging
  logDatabase(operation: string, table: string, success: boolean, details?: any) {
    const level = success ? 'debug' : 'error';
    this.addLog(level, `DB: ${operation} on ${table} - ${success ? 'Success' : 'Failed'}`, details, 'database');
  }

  // Get recent logs for debugging
  getLogs(level?: LogLevel, source?: string): LogEntry[] {
    let filtered = [...this.logs];
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (source) {
      filtered = filtered.filter(log => log.source === source);
    }
    
    return filtered;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
const logger = new Logger();

export default logger;