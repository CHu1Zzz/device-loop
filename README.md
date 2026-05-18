# 二手餐饮设备信息聚合平台

自动从闲鱼、小红书、百度贴吧等平台采集二手餐饮设备的转让信息，为二手设备收购商提供信息聚合看板。

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端 | Node.js + Express | JavaScript 全栈，生态丰富 |
| 数据库 | SQLite (sql.js) | WASM 版本，开发轻量，生产可用 PostgreSQL |
| 任务调度 | node-cron | 轻量级定时任务 |
| 前端 | React + Vite | 快速数据驱动看板 |
| 采集工具 | OpenCLI | 支持闲鱼/小红书/贴吧等平台 |

## 目录结构

```
second-hand-device/
├── collector/           # 数据采集模块
│   ├── index.js         # 采集入口
│   ├── keywords.js      # 采集关键词
│   └── platforms/      # 各平台适配器
│       ├── xianyu.js
│       ├── xiaohongshu.js
│       └── tieba.js
├── processor/          # 数据处理模块
│   ├── index.js        # 处理入口
│   ├── classifier.js   # 设备分类
│   ├── deduplicate.js   # 去重逻辑
│   ├── priceParser.js   # 价格提取
│   └── locationNormalizer.js  # 地区标准化
├── api/                # 后端接口
│   ├── server.js       # Express 入口
│   ├── routes/         # 路由
│   │   ├── items.js
│   │   ├── stats.js
│   │   └── subscribe.js
│   ├── db/             # 数据库
│   │   ├── schema.sql.js
│   │   └── connection.js
│   └── middleware/     # 中间件
│       └── rateLimit.js
├── web/                # 前端看板（待创建）
├── scheduler/          # 定时任务
├── scripts/            # 工具脚本
├── data/               # 数据目录
│   ├── raw/            # 原始采集数据
│   └── errors/         # 错误记录
├── logs/               # 日志目录
├── .env.example        # 环境变量模板
├── docker-compose.yml  # 容器化配置
├── Dockerfile
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run init:db
```

### 3. 配置 OpenCLI（重要）

本项目依赖 [OpenCLI](https://github.com/jackwener/opencli) 进行数据采集。

**安装步骤：**
```bash
npm install -g @jackwener/opencli
```

**Chrome 扩展配置：**
1. 下载扩展：https://github.com/jackwener/opencli/releases
2. 打开 `chrome://extensions/`
3. 开启 **Developer Mode**
4. 点击 **Load unpacked**，选择扩展文件夹

**启动 Chrome 并保持登录状态**

### 4. 手动触发采集

```bash
# 全量采集
npm run collect

# 只采集闲鱼
npm run collect -- --source xianyu

# 只采集小红书
npm run collect -- --source xiaohongshu
```

### 5. 数据处理

```bash
# 处理今日数据
npm run process

# 处理指定日期数据
npm run process -- --date 2025-01-01
```

### 6. 启动 API 服务

```bash
npm start
# 或开发模式（监听文件变化）
npm run dev
```

### 7. 启动定时调度

```bash
npm run scheduler
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/items` | GET | 获取列表，支持筛选和分页 |
| `/api/items/:id` | GET | 获取单条详情 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/subscribe` | POST | 创建订阅 |
| `/api/subscribe/:id` | DELETE | 取消订阅 |
| `/api/health` | GET | 健康检查 |

### 筛选参数

| 参数 | 说明 |
|------|------|
| `category` | 设备类型（制冷设备/烹饪设备/清洗设备/储存设备/其他设备/未分类）|
| `source` | 平台来源（xianyu/xiaohongshu/tieba）|
| `province` | 省份 |
| `price_min` | 最低价格 |
| `price_max` | 最高价格 |
| `keyword` | 关键词搜索 |
| `page` | 页码（默认1）|
| `page_size` | 每页条数（默认20）|
| `sort` | 排序（price_asc/price_desc/time_desc）|

## 环境变量

复制 `.env.example` 为 `.env` 并修改：

```env
OPENCLI_CHROME_DATA_DIR=   # Chrome 数据目录，留空使用默认
PORT=3000                   # 服务端口
DB_PATH=./data/app.db       # 数据库路径
```

## Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

## 采集关键词

当前默认关键词：

```
商用冰箱 二手
二手烤箱 餐饮
商用洗碗机 转让
厨房设备低价处理
餐厅倒闭设备
冷柜 二手 餐饮
商用灶台 转让
二手制冰机
餐饮设备 整套转让
```

如需添加新关键词，修改 `collector/keywords.js` 中的 `KEYWORDS` 数组。

## 设备分类规则

| 类型 | 关键词 |
|------|--------|
| 制冷设备 | 冰箱、冰柜、冷柜、制冰机、冷藏、冷冻 |
| 烹饪设备 | 烤箱、炸炉、蒸箱、灶台、炒锅、烤炉 |
| 清洗设备 | 洗碗机、消毒柜、洗菜机 |
| 储存设备 | 货架、储物柜、工作台 |
| 其他设备 | 收银机、点餐机、排烟罩 |
| 未分类 | 以上均不匹配 |

## 定时任务

| 任务 | 时间 | 说明 |
|------|------|------|
| 采集任务 | 08:00, 14:00, 20:00 | 多平台数据采集 |
| 处理任务 | 采集完成后自动触发 | 数据清洗入库 |
| 清理任务 | 每周日 02:00 | 清理30天前原始数据 |

## 常见问题

**Q: OpenCLI 命令报错 "Browser Bridge extension not connected"**

A: 需要确保 Chrome 浏览器已打开，并且 OpenCLI 扩展已正确安装并启用。

**Q: 采集到的数据为空**

A: 检查 Chrome 是否已登录闲鱼/小红书等平台，登录态过期会导致数据为空。

**Q: 数据库文件不存在**

A: 运行 `npm run init:db` 初始化数据库。

## License

ISC