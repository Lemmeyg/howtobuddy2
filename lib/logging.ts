export function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data ? data : '');
}

export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error ? error : '');
} 