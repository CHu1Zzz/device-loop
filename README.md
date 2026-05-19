# 二手餐饮设备情报平台

高意向收货情报工具，自动从闲鱼、小红书、百度贴吧等平台采集二手餐饮设备转让信息，支持信号评分、标签分类、看板跟进。

---

## 快速开始

### 环境要求

- **Node.js 18+**（推荐 20 LTS）
- **npm**

### 安装运行

```bash
git clone https://github.com/CHu1Zzz/device-loop.git
cd device-loop
npm install

# 初始化数据库
npm run init:db

# 启动后端 API（端口 3456）
npm start

# 新终端：启动前端（端口 3001）
cd web && npm run dev
```

访问 http://localhost:3001

---

## 核心功能

### 数据采集
```bash
npm run collect        # 全量采集（闲鱼+小红书+贴吧）
npm run collect:xianyu # 只采集闲鱼
npm run collect:xiaohongshu # 只采集小红书
npm run collect:tieba # 只采集贴吧
```

### 数据处理
```bash
npm run process        # 处理今日采集的数据
node processor/index.js -- --date 2026-05-18  # 处理指定日期
```

### 信号评分与标签
- 自动识别高意向信号（整店清仓、倒闭急转、同城自提等）
- 负向信号过滤（教程、维修、回收广告、同行等）
- 标签生成：整店清仓、单品急转、同行广告、服务维修等

### 看板跟进
- 列表视图 / 看板视图切换
- 状态流转：待联系 → 已联系 → 看货中 → 谈价中 → 已成交/无效
- 无效原因反馈

---

## 配置说明

### 环境变量 (.env)
```env
PORT=3456
DB_PATH=./data/app.db
DATA_RETENTION_DAYS=90
OPENCLI_CHROME_DATA_DIR=
```

### OpenCLI 采集配置（可选）
1. 安装：`npm install -g @jackwener/opencli`
2. 安装 Chrome 扩展：https://github.com/jackwener/opencli/releases
3. 打开 `chrome://extensions/`，开启 Developer Mode，加载扩展
4. 启动 Chrome 并登录各平台

### 信号规则配置
编辑 `config/signal_rules.json` 调整信号权重和组合规则。

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动后端 API（端口 3456） |
| `npm run dev` | 后端开发模式 |
| `npm run init:db` | 初始化数据库 |
| `npm run collect` | 全量采集 |
| `npm run process` | 处理数据 |
| `npm run filter:report` | 查看过滤报告 |
| `npm run scheduler` | 启动定时任务 |

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/items` | GET | 获取列表，支持筛选分页 |
| `GET /api/items/:id` | GET | 获取详情 |
| `PUT /api/items/:id` | PUT | 更新状态 |
| `GET /api/stats` | GET | 获取统计 |
| `POST /api/subscribe` | POST | 创建订阅 |
| `POST /api/feedback` | POST | 无效反馈 |
| `GET /api/health` | GET | 健康检查 |

**筛选参数**：
```
/api/items?category=制冷设备&source=xianyu&price_min=500&price_max=5000&keyword=冰箱&sort=time_desc&page=1
```

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (sql.js) |
| 前端 | React + Vite + TailwindCSS |
| 采集 | OpenCLI |
| 调度 | node-cron |

---

## 项目结构

```
device-loop/
├── api/                  # 后端 API
│   ├── routes/          # API 路由
│   │   ├── items.js      # 数据项接口
│   │   └── feedback.js    # 反馈接口
│   ├── db/               # 数据库
│   │   └── schema.sql.js # 表结构
│   └── server.js         # 服务入口
├── web/                  # 前端
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   │   ├── ItemCard.jsx    # 设备卡片
│   │   │   ├── KanbanBoard.jsx # 看板视图
│   │   │   ├── FilterBar.jsx   # 筛选栏
│   │   │   └── Pagination.jsx  # 分页
│   │   ├── pages/       # 页面
│   │   └── api/         # API 调用
├── collector/           # 数据采集
│   ├── platforms/       # 平台适配器
│   └── keywords.js      # 关键词配置
├── processor/          # 数据处理
│   ├── scorer.js       # 评分算法
│   ├── tagger.js       # 标签生成
│   ├── classifier.js   # 分类器
│   └── filters/        # 过滤器
├── config/
│   └── signal_rules.json # 信号规则配置
├── scheduler/         # 定时任务
└── data/              # 数据库文件
```

---

## 数据流程

```
采集 → 原始数据(raw/) → 处理(过滤/去重/评分) → 数据库 → API → 前端展示
```

---

## License

ISC