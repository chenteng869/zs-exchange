# =============================================================================
# ZS Exchange Next.js 应用 - 轻量 Dockerfile
# 用于本地虚拟部署
# =============================================================================

FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm install --no-audit --no-fund

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 开发模式启动（支持热重载）
CMD ["npm", "run", "dev"]
