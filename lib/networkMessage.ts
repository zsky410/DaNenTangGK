/** Gợi ý thân thiện khi lỗi do mạng / không kết nối được server */
export function friendlyRequestError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('network') ||
    m.includes('internet') ||
    m.includes('fetch') ||
    m.includes('failed to fetch') ||
    m.includes('host lookup') ||
    m.includes('timeout') ||
    m.includes('econnrefused') ||
    m.includes('enotfound') ||
    m.includes('aborted') ||
    m.includes('offline') ||
    m.includes('could not connect')
  ) {
    return 'Không có mạng hoặc không kết nối được máy chủ. Kiểm tra Wi‑Fi rồi thử lại.';
  }
  return message;
}
