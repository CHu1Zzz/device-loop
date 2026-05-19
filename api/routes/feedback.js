/**
 * 反馈接口
 * POST /api/feedback - 提交无效原因反馈
 */
import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

/**
 * 无效原因列表
 */
export const INVALID_REASONS = [
  '旧帖',
  '不是卖货',
  '已转完',
  '价格太高',
  '太远',
  '非餐饮设备',
  '同行',
  '家用',
  '其他',
];

/**
 * POST /api/feedback
 * 提交无效原因反馈
 * Body: { item_id, reason, note? }
 */
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { item_id, reason, note } = req.body;

    // 验证必填字段
    if (!item_id || !reason) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：item_id 和 reason',
        data: null,
      });
    }

    // 验证原因有效性
    if (!INVALID_REASONS.includes(reason)) {
      return res.status(400).json({
        code: 400,
        message: `无效的原因，有效值：${INVALID_REASONS.join(', ')}`,
        data: null,
      });
    }

    // 检查线索是否存在
    const checkSql = 'SELECT id FROM items WHERE id = ?';
    const checkResult = db.exec(checkSql, [item_id]);

    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '线索不存在',
        data: null,
      });
    }

    // 更新线索状态为无效
    const updateSql = `UPDATE items SET status = 'invalid', invalid_reason = ? WHERE id = ?`;
    db.exec(updateSql, [reason, item_id]);

    // 如果有备注，记录到反馈日志（可选）
    if (note) {
      console.log(`[Feedback] Item ${item_id} marked invalid: ${reason}. Note: ${note}`);
    } else {
      console.log(`[Feedback] Item ${item_id} marked invalid: ${reason}`);
    }

    res.json({
      code: 200,
      message: 'success',
      data: { item_id, reason },
    });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

export default router;