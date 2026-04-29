# MW Ideaboard Open

[English](README.md)

项目参考：[idea.mollycall.cn](https://idea.mollycall.cn/)

## 项目介绍

MW Ideaboard Open 是一个轻量级图片 / 视频灵感板项目。

它适合用来搭建个人创意库、素材收藏夹、内容策划板和视觉参考库，帮助你把日常看到的好内容、好画面、好想法沉淀下来。

它不是一个复杂的后台系统，而是一个更轻、更快、更适合个人使用的创意收纳空间。

## 项目适合谁？

如果你经常需要收集：

- 小红书 / 抖音 / 视频号上的内容灵感
- 广告案例、视觉参考、拍摄风格
- 品牌传播素材、文案方向、创意片段
- 图片、视频、链接、标签和自己的想法

那么这个项目可以帮你把这些碎片变成一个可浏览、可检索、可复盘的灵感库。

## 功能特点

- 图片 / 视频上传
- 图片与视频瀑布流展示
- 标签管理
- 来源链接记录
- 创意思路 / Notes 记录
- 按月份浏览内容
- 月度总结入口
- 主理人模式
- 上传、编辑、删除权限保护
- 支持编辑时替换已上传素材
- 视频 hover 预览
- 图片懒加载
- 视频 metadata 预加载优化
- 后端接口基础缓存控制

## 技术栈

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express
- Multer
- PostgreSQL
- Drizzle ORM

## 项目结构

```txt
.
├── backend
│   ├── db
│   │   └── schema.js
│   ├── uploads
│   │   └── .gitkeep
│   ├── index.js
│   ├── drizzle.config.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── package-lock.json
│
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── README.zh-CN.md
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/mw-ideaboard-open.git
cd mw-ideaboard-open
```

### 2. 配置后端环境变量

复制环境变量示例文件：

```bash
cp .env.example backend/.env
```

然后根据你的本地环境填写占位值。

### 3. 安装并启动后端

```bash
cd backend
npm install
node index.js
```

默认后端运行在：

```txt
http://localhost:3000
```

### 4. 安装并启动前端

新开一个终端：

```bash
cd frontend
npm install
npm run dev
```

前端通常会运行在：

```txt
http://localhost:5173
```

如果 5173 被占用，Vite 可能会自动切换到其他端口，请以终端显示为准。

## 环境变量说明

请从 `.env.example` 创建 `backend/.env`。

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ideaboard
MW_ADMIN_KEY=change-me
MIMO_API_KEY=your-ai-api-key
MIMO_BASE_URL=https://example.com/v1
MIMO_MODEL=your-model-name
```

- `DATABASE_URL`：PostgreSQL 数据库连接地址
- `MW_ADMIN_KEY`：主理人管理暗号，用于上传、编辑、删除
- `MIMO_API_KEY`：可选，AI 标签识别接口 Key
- `MIMO_BASE_URL`：可选，AI 接口地址
- `MIMO_MODEL`：可选，AI 模型名称

如果暂时不接 AI，也可以先保留占位值，后续自行调整相关逻辑。

## 数据库说明

本项目使用 PostgreSQL 存储灵感记录，例如：

- 图片 / 视频路径
- 标签
- 来源链接
- 创意思路
- 创建时间
- 装饰样式
- 排序相关信息

真实图片和视频文件不会存进数据库，而是保存在：

```txt
backend/uploads
```

数据库中只保存类似这样的访问路径：

```txt
/uploads/example.jpg
```

## 上传目录说明

`backend/uploads` 用来存放实际上传的图片和视频文件。

开源仓库中只保留：

```txt
backend/uploads/.gitkeep
```

不会提交真实媒体文件。

你自己的上传内容会保存在本地或部署环境的 `backend/uploads` 目录中，请注意备份。

## 主理人模式

项目内置一个轻量级管理保护机制。

游客可以浏览内容，但上传、编辑、删除需要通过主理人验证。

默认逻辑：

1. 页面底部版权区域双击
2. 输入管理暗号
3. 进入主理人模式
4. 上传 / 编辑 / 删除请求会自动携带管理 Key
5. 后端通过 `MW_ADMIN_KEY` 校验权限

需要在 `backend/.env` 中配置：

```env
MW_ADMIN_KEY=change-me
```

## 常用命令

启动后端：

```bash
cd backend
node index.js
```

启动前端：

```bash
cd frontend
npm run dev
```

构建前端：

```bash
cd frontend
npm run build
```

预览前端构建结果：

```bash
cd frontend
npm run preview
```

## 部署建议

这个项目可以部署到任意支持 Node.js 和 PostgreSQL 的环境。

常见部署方式：

- 前端：构建后部署 `frontend/dist`
- 后端：使用 Node.js 运行 `backend/index.js`
- 数据库：使用 PostgreSQL
- 上传文件：保留并备份 `backend/uploads`
- 如有需要，可使用反向代理统一访问入口

如果用于公开访问，建议：

- 定期备份数据库和上传目录
- 不要提交 `.env`
- 不要提交真实上传媒体文件

## 安全提醒

请不要把以下内容提交到公开仓库：

- `.env`
- `backend/.env`
- 数据库地址
- API Key
- 密码
- 真实上传的图片 / 视频
- 私有品牌素材
- 未授权字体文件

本项目已提供 `.env.example`，请用它作为环境变量模板。

## Roadmap

后续可以扩展：

- 后端分页与加载更多
- 视频封面图支持
- AI 自动标签优化
- 标签筛选
- 搜索功能
- 多用户账号系统
- 对象存储支持
- 更完善的后台管理界面

## License

MIT License

你可以自由学习、使用和改造本项目代码。

但请注意：开源版本不包含任何生产环境中的私有品牌资产、字体文件或真实上传素材。
