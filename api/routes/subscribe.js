/**
 * 订阅接口
 * POST /api/subscribe - 创建订阅
 * DELETE /api/subscribe/:id - 取消订阅
 */
import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

/**
 * POST /api/subscribe
 * Body: { keyword, province, price_max, contact（手机号或邮箱）}
 */
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { keyword, province, price_max, contact } = req.body;

    if (!contact) {
      return res.status(400).json({
        code: 400,
        message: '联系方式不能为空',
        data: null,
      });
    }

    // 简单验证联系方式格式
    const phoneValid = /^1\d{10}$/.test(contact);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!phoneValid && !emailValid) {
      return res.status(400).json({
        code: 400,
        message: '联系方式格式不正确',
        data: null,
      });
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    db.run(`
      INSERT INTO subscriptions (id, keyword, province, price_max, contact, created_at, status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
    `, [id, keyword || '', province || '', price_max || null, contact]);

    saveDb();

    res.json({
      code: 200,
      message: '订阅创建成功',
      data: { subscription_id: id },
    });
  } catch (error) {
    console.error('创建订阅失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

/**
 * DELETE /api/subscribe/:id
 * 取消订阅
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const result = db.exec(`SELECT id FROM subscriptions WHERE id = ?`, [id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '订阅不存在',
        data: null,
      });
    }

    db.run(`UPDATE subscriptions SET status = 'inactive' WHERE id = ?`, [id]);
    saveDb();

    res.json({
      code: 200,
      message: '订阅已取消',
      data: null,
    });
  } catch (error) {
    console.error('取消订阅失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

export default router;