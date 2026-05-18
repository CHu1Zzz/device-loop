/**
 * 限流中间件
 * 基于内存的简单限流实现
 */
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1分钟窗口
const MAX_REQUESTS = 100; // 最大请求数

/**
 * 限流中间件
 */
export function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  // 获取或初始化该IP的请求记录
  let record = requestCounts.get(ip);
  if (!record || now - record.windowStart > WINDOW_MS) {
    record = { windowStart: now, count: 0 };
    requestCounts.set(ip, record);
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      data: null,
    });
  }

  next();
}

/**
 * 清理过期的限流记录（定期调用）
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.windowStart > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}