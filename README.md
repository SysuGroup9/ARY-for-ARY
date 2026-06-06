# ARY for ARY

ARY GRS 001 的全栈演示实现。当前版本使用 `Next.js + Prisma + SQLite`，提供真实注册登录、赛事创建、报名、提交、反馈、Runner 拉取任务与回传评分。

## 当前实现

- Organizer / Rider 真实账号体系，使用 cookie session
- Organizer 创建赛事并配置赛后披露边界
- Rider 报名、提交代码和 Riding Record
- Organizer 维护题面、回复反馈、同步榜单、发布赛后展示
- Runner API:
  - `GET /api/runner/tasks/pull?raceId=<id>`
  - `POST /api/runner/tasks/result`
- Audience 无需登录可查看公开赛事、榜单和赛后展示

## 技术栈

- Next.js 16 App Router
- TypeScript
- Prisma 7
- SQLite
- Zod
- bcryptjs
- jose

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2.  数据库配置（复制示例文件或手动创建）
cp .env.example .env
# 或
echo DATABASE_URL="file:./dev.db" > .env

# 3. 初始化数据库
npx prisma migrate dev --name init

# 4. 生成 TypeScript 客户端代码
npx prisma generate

# 5. 种子数据
npm run db:seed

# 6. 启动项目
npm run dev
```

## 验证

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## 演示账号

项目启动后，请先注册账号。推荐使用以下用户名注册：

| 角色 | 推荐用户名 | 推荐密码 |
|------|-----------|----------|
| Organizer | organizer_demo | organizer123 |
| Rider | rider_demo | rider123 |

注册并登录后即可开始使用。

## 临时部署说明

- 预览环境仍然使用 SQLite。
- 生产运行时会把构建期种子数据库复制到可写的 `/tmp` 数据库。
- 因此临时域名上的注册、报名、提交是“真实写数据库”的，但数据不保证长期持久。

## 数据边界

ARY 保存：

- 赛事公开信息
- 队伍、反馈、通知
- 提交状态与公开榜单投影
- 最佳归档与赛后展示内容

ARY 不保存：

- Organizer 私有评测代码
- Organizer 内网 Runner 实现
- 完整私有评测环境

## 参考文档

- [PRD.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PRD.md)
- [ROADMAP.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/ROADMAP.md)
