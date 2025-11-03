type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private debugMode = import.meta.env.VITE_DEBUG === 'true';

  info(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data !== undefined ? data : '');
    }
  }

  warn(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data !== undefined ? data : '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    // Toujours logger les erreurs, même en production
    console.error(`❌ [ERROR] ${message}`, error || '', context || '');
    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
  }

  debug(message: string, data?: unknown) {
    if (this.isDevelopment && this.debugMode) {
      console.log(`🐛 [DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  // Méthode pour logs de succès
  success(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, data !== undefined ? data : '');
    }
  }
}

export const logger = new Logger();
