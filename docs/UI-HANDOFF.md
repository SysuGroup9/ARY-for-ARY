# ARY UI 交接文档

> 目标：让新 Agent 在 2 分钟内理解当前 UI 架构，继续优化视觉设计。

## 1. 技术栈

- **框架**: Next.js 16 App Router + TypeScript
- **样式**: CSS Custom Properties（无 Tailwind）
- **字体**: Google Fonts — Inter (body) + Noto Serif SC (display) + JetBrains Mono (mono)
- **路由结构**: `/` 公开首页，`/races/[slug]` 赛事页，`/console/*` 控制台，`/jumbotron/[raceId]` 大屏

## 2. 设计令牌位置

**主令牌**: `src/app/globals.css` (行 1-30)

```css
--background: #FAFAFA;       /* 底色 */
--foreground: #0F172A;       /* 主文字 */
--muted: #F1F5F9;            /* 浅灰底 */
--muted-foreground: #475569; /* 次要文字 */
--accent: #0052FF;           /* 主强调色 */
--accent-secondary: #4D7CFF; /* 渐变终点 */
--accent-soft: rgba(0,82,255,0.08);
--border: #E2E8F0;
--card: #FFFFFF;
--font-display: "Noto Serif SC", "PingFang SC", serif;
--font-body: "Inter", "PingFang SC", sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

**共享工具类**: `src/app/_components/ary-shared.tsx` 中的 `aryStyles` 字符串（~700 行 CSS）。定义了 `.panel`、`.card`、`.public-card`、`.public-link-card`、`.eyebrow`、`.section-label`、`.detail-grid`、`.grid`、`.stack`、`.hero`、`.hero-split`、`.button`、`.button-secondary`、`.file-chip`、`.comment-card`、`.table`、`.public-header` 等。

## 3. 公开页面文件清单

所有在 `src/app/_components/public/`：

| 文件 | 组件 | 布局状态 |
|------|------|---------|
| `public-header.tsx` | 导航栏 | ✅ sticky + gradient brand |
| `public-home-hero.tsx` | 首页 Hero | ✅ gradient 标题 + 指标 + CTA |
| `home-gallery.tsx` | 首页 Gallery | ✅ section-label + card grid + section-dark |
| `cooperation-page.tsx` | 合作页 | ✅ 三列卡片 + section-dark（从纯文字重设计） |
| `race-page.tsx` | 赛事详情 | ✅ card + 指标条 + 骑手 grid |
| `races-index-page.tsx` | 赛事列表 | ✅ badge + section-label 分组 |
| `race-register-page.tsx` | 报名页 | ⚠️ 仍用旧 Panel 组件 |
| `live-hall.tsx` | 实况大厅 | ⚠️ 仍用旧 panel 类 |
| `results-page.tsx` | 赛果 | ⚠️ 仍用旧 panel 类 |
| `review-page.tsx` | 评审复盘 | ⚠️ 仍用旧 panel 类 |
| `works-page.tsx` | 作品列表 | ⚠️ 仍用旧 panel 类 |
| `work-page.tsx` | 作品详情 | ⚠️ 仍用旧 panel 类 |
| `rider-profile-page.tsx` | 骑手档案 | ⚠️ 仍用旧 panel 类 |

## 4. 已完成修复

- Hero CSS 冲突：`.hero`（单列居中）与 `.hero-split`（登录页双列）已拆分
- Calistoga→Noto Serif SC（中文可读）
- muted 色 `#64748B`→`#475569`（对比度提升）
- `.card` 加 `height:100%`（grid 等高）
- 合作入口卡片 flex `space-between` 撑满
- `.stack` gap 统一 20px
- 暗色区域文字 13px/50%→14px/65%
- 按钮字号 13→14px
- body `line-height: 1.6`
- 重复 CSS 块删除

## 5. 待修复（按优先级）

| # | 问题 | 位置 |
|---|------|------|
| 1 | ⚠️ 标记页面仍用旧 `.panel` 类，视觉与首页不统一 | results/review/works/work/rider-profile/live-hall/register |
| 2 | live-hall + results 各 3 个 panel 塞进双列 grid，第三 panel 孤悬 | live-hall.tsx 行 247, results.tsx 行 74 |
| 3 | work-page 单 panel 占双列 grid 浪费半宽 | work-page.tsx |
| 4 | 登录页 HeroSection 蓝色背景与文字对齐微调 | ary-shared.tsx HeroSection 组件 |
| 5 | 首页优秀骑手列表过长 vs 合作入口过短，视觉不平衡 | home-gallery.tsx 行 64 |
| 6 | 暗色 section 按钮文字对比度仍偏低 | home-gallery.tsx 行 102+ |
| 7 | section-label margin-bottom 有 12px/16px 两处冲突 | globals.css vs ary-shared.tsx |

## 6. 控制台/管理端

`src/app/_components/console/` 下各视图（admin-console-page, organizer-console-page, rider-console-page, judge views, console-shell）功能完整，使用 `Panel` 组件。视觉风格偏后台系统，未纳入本轮 UI 改造范围。

## 7. Jumbotron 大屏

独立视觉体系，暖调 Morandi 配色，SVG 赛道渲染。文件在 `src/app/jumbotron/` 和 `src/lib/jumbotron/`。**未在本轮 UI 改造范围内。**

## 8. 用户偏好

- 喜欢现代 SaaS 排版（参考 designprompts.dev/saas），不喜欢 generic 模板感
- 已拒绝蓝色冷调和暖调 Morandi 两次，对配色敏感
- 对文字对比度、行间距、卡片等高、左重右轻非常在意
- 全程中文界面，字体必须支持中文

## 9. 启动命令

```bash
npm run db:seed && npm run dev
# 打开 http://localhost:3000
```

测试账号：`organizer_demo / organizer123`，`rider_alice / rider123`
