/**
 * Express 服务入口
 * 端口：3000
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from './middleware/rateLimit.js';
import itemsRouter from './routes/items.js';
import statsRouter from './routes/stats.js';
import subscribeRouter from './routes/subscribe.js';
import feedbackRouter from './routes/feedback.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(rateLimit);

// 路由
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/feedback', feedbackRouter);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`[服务已启动] 端口: ${PORT}`);
  console.log(`[健康检查] http://localhost:${PORT}/api/health`);
});