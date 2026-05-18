/**
 * 数据统计接口
 * GET /api/stats - 获取统计数据
 */
import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

/**
 * GET /api/stats
 * 返回：{ total_items, today_new, by_category, by_source, by_province }
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const todayStart = today + 'T00:00:00.000Z';

    // 总条数
    const totalResult = db.exec(`SELECT COUNT(*) as total FROM items WHERE status = 'active'`);
    const total_items = totalResult.length > 0 ? totalResult[0].values[0][0] : 0;

    // 今日新增
    const todayResult = db.exec(`
      SELECT COUNT(*) as today_new FROM items
      WHERE status = 'active' AND collected_at >= '${todayStart}'
    `);
    const today_new = todayResult.length > 0 ? todayResult[0].values[0][0] : 0;

    // 按设备类型统计
    const byCategoryResult = db.exec(`
      SELECT category, COUNT(*) as count FROM items
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `);
    const by_category = {};
    if (byCategoryResult.length > 0) {
      for (const row of byCategoryResult[0].values) {
        by_category[row[0]] = row[1];
      }
    }

    // 按平台来源统计
    const bySourceResult = db.exec(`
      SELECT source, COUNT(*) as count FROM items
      WHERE status = 'active'
      GROUP BY source
      ORDER BY count DESC
    `);
    const by_source = {};
    if (bySourceResult.length > 0) {
      for (const row of bySourceResult[0].values) {
        by_source[row[0]] = row[1];
      }
    }

    // 按省份统计（前10）
    const byProvinceResult = db.exec(`
      SELECT location, COUNT(*) as count FROM items
      WHERE status = 'active' AND location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `);
    const by_province = {};
    if (byProvinceResult.length > 0) {
      for (const row of byProvinceResult[0].values) {
        by_province[row[0]] = row[1];
      }
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        total_items,
        today_new,
        by_category,
        by_source,
        by_province,
      },
    });
  } catch (error) {
    console.error('查询统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

export default router;