/** Chuyển lỗi kỹ thuật từ Supabase / network thành thông báo dễ hiểu hơn cho người dùng */
export function friendlyRequestError(message: string): string {
  const m = message.trim().toLowerCase();

  if (!m) {
    return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Email hoặc mật khẩu không đúng.';
  }

  if (m.includes('email not confirmed')) {
    return 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư rồi thử lại.';
  }

  if (m.includes('invalid email')) {
    return 'Email không hợp lệ.';
  }

  if (m.includes('too many requests')) {
    return 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.';
  }

  if (m.includes('user already registered')) {
    return 'Email này đã được đăng ký.';
  }

  if (m.includes('refresh token not found') || m.includes('invalid refresh token')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

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
    return 'Không có mạng hoặc không kết nối được máy chủ. Kiểm tra Wi-Fi rồi thử lại.';
  }

  return message;
}
