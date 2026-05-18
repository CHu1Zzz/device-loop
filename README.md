# 二手餐饮设备信息聚合平台

自动从闲鱼、小红书、百度贴吧等平台采集二手餐饮设备的转让信息，为二手设备收购商提供信息聚合看板。

---

## 快速开始（5分钟上手）

### 第一步：安装 Node.js

确保本地已安装 **Node.js 18+**（推荐 20 LTS）

```bash
node --version  # 检查版本
```

### 第二步：克隆项目并安装依赖

```bash
git clone https://github.com/CHu1Zzz/device-loop.git
cd device-loop
npm install
```

### 第三步：初始化数据库

```bash
npm run init:db
```

### 第四步：启动服务

```bash
# 终端1：启动后端 API
npm start

# 终端2：启动前端开发服务器
cd web && npm run dev
```

访问 http://localhost:5173 查看看板。

---

## 配置说明

### 环境变量

复制 `.env.example` 为 `.env`：

```env
OPENCLI_CHROME_DATA_DIR=
PORT=3000
DB_PATH=./data/app.db
DATA_RETENTION_DAYS=90
```

### OpenCLI 采集配置（可选）

如需使用数据采集功能：

1. 安装 OpenCLI：
   ```bash
   npm install -g @jackwener/opencli
   ```

2. 安装 Chrome 扩展：
   - 下载 https://github.com/jackwener/opencli/releases
   - 打开 `chrome://extensions/`
   - 开启 **Developer Mode**
   - 点击 **Load unpacked**，选择扩展文件夹

3. 启动 Chrome 并登录闲鱼/小红书

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动后端 API（端口 3000） |
| `npm run dev` | 后端开发模式（监听文件变化） |
| `npm run init:db` | 初始化数据库 |
| `npm run collect` | 全量采集（闲鱼+小红书+贴吧） |
| `npm run collect:xianyu` | 只采集闲鱼 |
| `npm run process` | 处理今日采集的数据 |
| `npm run filter:report` | 查看内容过滤报告 |
| `npm run filter:content` | 执行内容过滤（标记教程类） |
| `npm run scheduler` | 启动定时任务调度 |

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/items` | GET | 获取列表，支持筛选分页 |
| `/api/stats` | GET | 获取统计 |
| `/api/subscribe` | POST | 创建订阅 |
| `/api/health` | GET | 健康检查 |

**筛选参数示例：**
```
/api/items?category=制冷设备&source=xianyu&price_min=500&price_max=5000&page=1
```

---

## Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost:3000

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
├── api/              # 后端 API
│   ├── routes/       # API 路由
│   ├── db/           # 数据库
│   └── server.js     # 服务入口
├── web/              # 前端看板
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── pages/       # 页面
│   │   └── api/         # API 调用
│   └── dist/        # 构建产物
├── collector/       # 数据采集
│   └── platforms/   # 平台适配器
├── processor/       # 数据处理
│   └── filters/     # 过滤器
├── scheduler/       # 定时任务
└── data/            # 数据库文件
```

---

## 常见问题

**Q: 启动报错 "Cannot find module"**
- 运行 `npm install` 重新安装依赖

**Q: 数据库为空**
- 运行 `npm run init:db` 初始化
- 运行 `npm run collect` 采集数据
- 运行 `npm run process` 处理数据

**Q: 前端页面空白**
- 确保后端 `npm start` 正在运行
- 检查浏览器控制台是否有跨域错误

---

## License

ISC