/**
 * 数据项查询接口
 * GET /api/items - 获取列表
 * GET /api/items/:id - 获取单条详情
 */
import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { getProvinces } from '../../processor/locationNormalizer.js';
import { CATEGORIES } from '../../processor/classifier.js';

const router = Router();

/**
 * GET /api/items
 * 参数：
 *   - category（设备类型，可多选）
 *   - source（平台来源，可多选）
 *   - province（省份）
 *   - price_min / price_max（价格区间）
 *   - keyword（关键词搜索）
 *   - page / page_size（分页，默认每页20条）
 *   - sort（排序：price_asc / price_desc / time_desc）
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const {
      category,
      source,
      province,
      price_min,
      price_max,
      keyword,
      page = 1,
      page_size = 20,
      sort = 'time_desc',
    } = req.query;

    let where = "WHERE status = 'active'";
    const params = [];

    // 设备类型筛选
    if (category) {
      const categories = category.split(',').filter(c => CATEGORIES[c] || c === '未分类');
      if (categories.length > 0) {
        where += ` AND category IN (${categories.map(() => '?').join(',')})`;
        params.push(...categories);
      }
    }

    // 平台来源筛选
    if (source) {
      const sources = source.split(',').filter(s => ['xianyu', 'xiaohongshu', 'tieba'].includes(s));
      if (sources.length > 0) {
        where += ` AND source IN (${sources.map(() => '?').join(',')})`;
        params.push(...sources);
      }
    }

    // 省份筛选
    if (province) {
      where += ' AND location LIKE ?';
      params.push(`%${province}%`);
    }

    // 价格区间筛选
    if (price_min) {
      where += ' AND price >= ?';
      params.push(parseFloat(price_min));
    }
    if (price_max) {
      where += ' AND price <= ?';
      params.push(parseFloat(price_max));
    }

    // 关键词搜索
    if (keyword) {
      where += ' AND (title LIKE ? OR raw_text LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 排序
    let orderBy = 'ORDER BY collected_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY price ASC';
    if (sort === 'price_desc') orderBy = 'ORDER BY price DESC';

    // 分页
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(page_size)));
    const offset = (pageNum - 1) * pageSize;

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM items ${where}`;
    const countResult = db.exec(countSql, params);
    const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;

    // 查询列表
    const listSql = `
      SELECT id, source, title, price, location, contact, url, images,
             category, keyword, collected_at, status
      FROM items
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const listResult = db.exec(listSql, [...params, pageSize, offset]);

    const items = listResult.length > 0
      ? listResult[0].values.map(row => ({
          id: row[0],
          source: row[1],
          title: row[2],
          price: row[3],
          location: row[4],
          contact: row[5],
          url: row[6],
          images: row[7] ? JSON.parse(row[7]) : [],
          category: row[8],
          keyword: row[9],
          collected_at: row[10],
          status: row[11],
        }))
      : [];

    res.json({
      code: 200,
      message: 'success',
      data: {
        total,
        page: pageNum,
        page_size: pageSize,
        items,
      },
    });
  } catch (error) {
    console.error('查询数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

/**
 * GET /api/items/:id
 * 返回单条详情
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const sql = `
      SELECT id, source, title, price, location, contact, url, images,
             raw_text, category, keyword, collected_at, status
      FROM items
      WHERE id = ?
    `;
    const result = db.exec(sql, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '数据不存在',
        data: null,
      });
    }

    const row = result[0].values[0];
    const item = {
      id: row[0],
      source: row[1],
      title: row[2],
      price: row[3],
      location: row[4],
      contact: row[5],
      url: row[6],
      images: row[7] ? JSON.parse(row[7]) : [],
      raw_text: row[8],
      category: row[9],
      keyword: row[10],
      collected_at: row[11],
      status: row[12],
    };

    res.json({
      code: 200,
      message: 'success',
      data: item,
    });
  } catch (error) {
    console.error('查询详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  }
});

export default router;