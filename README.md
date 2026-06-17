# 音乐练习打卡平台

一个全栈音乐练习打卡平台，帮助音乐学习者记录练习、追踪进度、与社区分享心得。

## 技术栈

- **前端**: Vite + React 18 + TypeScript
- **后端**: Express + TypeScript + better-sqlite3
- **认证**: JWT + bcryptjs
- **数据库**: SQLite (通过 better-sqlite3)
- **开发工具**: concurrently 同时启动前后端

## 功能特性

- 用户注册/登录，选择学习乐器（钢琴、吉他、小提琴、架子鼓等）
- 设置每日练习目标时长
- 练习计时器，支持填写曲目和练习心得
- 本周练习日历（绿色完成/红色未完成），连续打卡火焰图标
- 月度排行榜（按总练习时长排名）
- 社区广场（分享心得和曲目推荐）
- 个人练习统计（折线图、饼图、连续打卡记录）
- 管理员后台（活跃用户、人均时长、乐器分布）

## 运行方式

```bash
# 安装依赖
npm run install:all

# 初始化测试数据
npm run seed

# 启动开发服务器
npm run dev
```

前端运行在 http://localhost:5173
后端运行在 http://localhost:3000

## 测试账号

| 用户名 | 密码 | 角色 | 乐器 |
|--------|------|------|------|
| admin  | admin123 | 管理员 | 钢琴 |
| xiaoming | 123456 | 普通用户 | 吉他 |
| xiaohong | 123456 | 普通用户 | 小提琴 |
| xiaogang | 123456 | 普通用户 | 架子鼓 |
| xiaoli | 123456 | 普通用户 | 钢琴 |

## 项目结构

```
├── server/                 # 后端
│   ├── index.ts           # 入口
│   ├── db.ts              # 数据库初始化
│   ├── seed.ts            # 测试数据
│   ├── middleware/         # 中间件
│   │   └── auth.ts
│   └── routes/            # 路由
│       ├── auth.ts
│       ├── practice.ts
│       ├── community.ts
│       ├── leaderboard.ts
│       └── admin.ts
├── client/                 # 前端
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── pages/
│       ├── components/
│       └── utils/
└── package.json
```
