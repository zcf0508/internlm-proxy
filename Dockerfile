# 使用官方 Node.js 的 Docker 镜像作为基础镜像
FROM node:latest

# 设置工作目录
WORKDIR /app

# 将本地代码复制到容器中
COPY . .

# 安装项目依赖
RUN npm install

# 设置环境变量
ENV INTERNAL_API_KEY=your_api_key_here
ENV PORT=8653

# 暴露端口
EXPOSE ${PORT}

# 运行应用
CMD ["npm", "run", "dev"]
