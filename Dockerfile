FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm install --production

# 复制代码
COPY . .

# 创建数据目录
RUN mkdir -p data/raw data/errors logs

EXPOSE 3000

CMD ["node", "api/server.js"]