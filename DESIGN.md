# Design System: ARY — Agent Racing Yard

> 参考 Vercel 的精密阴影系统 + Stripe 的暖色调深度 + Linear 的排版纪律

## 1. Visual Theme & Atmosphere

ARY 是一个 AI 编码代理竞赛平台。设计语言需要在"开发者工具的技术感"和"赛马竞速的动感"之间取得平衡。

**核心哲学：** 白色画布上的蓝色精密工程。就像 Vercel 把部署变成可感知的视觉流，ARY 把 AI 编程竞赛变成可阅读的赛事体验。大面积留白配合精心校准的阴影层级，让信息密度自然呈现。

- **底色** `#FAFBFC` — 微暖白的工程师画布，比纯白更柔和
- **前景** `#0A1629` — 深海军蓝，比纯黑更温暖（借鉴 Stripe）
- **强调** `#2362FF` — 品牌蓝，饱和而沉稳
- **阴影** — 多层堆叠，带有品牌蓝底色调
- **卡片** — 阴影代替边框，提升切换更自然

---

## 2. Color Palette & Roles

### 核心色
| Token | Value | Role |
|-------|-------|------|
| `--background` | `#FAFBFC` | 页面底色 |
| `--foreground` | `#0A1629` | 主文字、标题 |
| `--muted` | `#F1F4F8` | 浅灰底、hover 态 |
| `--muted-foreground` | `#546A84` | 次要文字、说明 |
| `--card` | `#FFFFFF` | 卡片表面 |
| `--border` | `#E2E7EE` | 边框、分割线 |

### 品牌色
| Token | Value | Role |
|-------|-------|------|
| `--accent` | `#2362FF` | 主强调色、CTA、链接 |
| `--accent-secondary` | `#4F8CFF` | 渐变终点、装饰 |
| `--accent-dark` | `#1A4DD6` | hover 深色 |
| `--accent-soft` | `rgba(35,98,255,0.08)` | 浅色强调背景 |
| `--accent-glow` | `rgba(35,98,255,0.12)` | 卡片蓝调阴影 |

### 功能色
| Token | Value | Role |
|-------|-------|------|
| `--success` | `#0EAD69` | 成功、进行中状态 |
| `--warning` | `#F59E0B` | 警告、关注 |
| `--danger` | `#DC2626` | 错误、风险 |

### 深色区块
| Token | Value | Role |
|-------|-------|------|
| `--dark-surface` | `#0A1629` | CTA、footer 深色背景 |
| `--dark-text` | `#FFFFFF` | 深色背景上的文字 |
| `--dark-muted` | `rgba(255,255,255,0.65)` | 深色背景上的次要文字 |
| `--dark-border` | `rgba(255,255,255,0.12)` | 深色背景上的边框 |

---

## 3. Typography Rules

### 字体家族
- **正文/UI**: `Inter`, `PingFang SC`, system-ui — 清晰、现代、高可读性
- **标题/品牌**: `Inter` (英文), `Noto Serif SC` (中文标题装饰)
- **等宽/代码**: `JetBrains Mono`, monospace

### 层级表
| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Display Hero | Inter | 56px | 700 | 1.05 | -0.03em |
| h1 | Inter+Noto Serif SC | 40px | 700 | 1.15 | -0.02em |
| h2 | Inter | 28px | 600 | 1.25 | -0.01em |
| h3 | Inter | 20px | 600 | 1.35 | normal |
| Body Large | Inter | 18px | 400 | 1.65 | normal |
| Body | Inter | 16px | 400 | 1.6 | normal |
| Body Small | Inter | 14px | 400 | 1.55 | normal |
| Button | Inter | 15px | 600 | 1.0 | normal |
| Caption | Inter | 13px | 500 | 1.4 | normal |
| Label/Mono | JetBrains Mono | 12px | 500 | 1.4 | 0.02em |

### 排版原则
- **Inter 用于英文和数字**：现代几何感，清晰锐利
- **Noto Serif SC 用于中文 headline**：增添文化分量
- **6px 网格基线**：行高与 spacing 对齐
- **负 letter-spacing** 在大字体时收紧间距

---

## 4. Shadow & Depth System

借鉴 Vercel 的阴影代替边框 + Stripe 的蓝色调阴影。

| Level | Value | Use |
|-------|-------|-----|
| Flat | none | 页面背景、文本块 |
| Ring | `0 0 0 1px rgba(10,22,41,0.06)` | 低层级卡片、导航 |
| Subtle | Ring + `0 2px 4px rgba(10,22,41,0.04)` | 标准卡片 |
| Card | Ring + `0 4px 8px rgba(10,22,41,0.04)`, `0 12px 24px -8px rgba(10,22,41,0.06)` | 主卡片 |
| Elevated | Ring + `0 8px 16px rgba(10,22,41,0.06)`, `0 24px 48px -12px rgba(10,22,41,0.1)` | 浮动元素 |
| Accent | `0 0 0 1px rgba(35,98,255,0.1)`, `0 4px 16px rgba(35,98,255,0.15)` | 强调卡片 |

**阴影哲学**：用多层阴影堆叠创造"空气感"。Ring 层代替传统边框，elevation 层创造浮动深度，ambient 层模拟环境光衰减。品牌蓝 tint 让阴影不只是灰色，而是带有品牌温度的深度。

---

## 5. Border Radius
| Name | Value | Use |
|------|-------|-----|
| `--radius-sm` | 6px | 按钮、输入框 |
| `--radius-md` | 8px | 卡片、小容器 |
| `--radius-lg` | 12px | 大卡片、区块 |
| `--radius-xl` | 16px | Hero 卡片 |
| `--radius-2xl` | 24px | 深色区块 |
| `--radius-full` | 9999px | 徽章、标签 |

---

## 6. Spacing System
Base: 8px 网格
| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

---

## 7. Component Stylings

### 按钮
- **Primary**: `linear-gradient(135deg, #2362FF, #4F8CFF)`, 白色文字, 6px radius, 阴影
- **Secondary**: 透明底, `--border` 边框, `--foreground` 文字
- **Ghost**: 透明, `--muted-foreground` 文字, hover 时 `--muted` 背景

### 卡片
- 白色底, `--card-shadow` 多层阴影
- Hover: 阴影加强 + `translateY(-2px)`
- Accent 卡片: 顶部 3px 渐变条

### 导航
- Sticky, `backdrop-filter: blur(20px)`, 半透明白底
- 品牌渐变 logo
- 链接 14px weight 500

### 暗色区块
- `--dark-surface` 背景 + 点阵纹理
- 白色标题, 65% 白色正文
- 按钮自动适配暗色主题

---

## 8. Do's and Don'ts

### Do
- 使用多层阴影堆叠代替传统边框
- 用负 letter-spacing 收紧大标题
- 品牌蓝仅用于交互元素和强调
- 保持 8px 间距网格
- 卡片使用 hover 微动效

### Don't
- 不要用纯黑色文字 — 始终用 `#0A1629`
- 不要用单层大阴影
- 不要给卡片加 visible border（用 shadow ring 代替）
- 不要在非交互元素上使用品牌蓝
- 不要在正文使用 Noto Serif SC（仅标题）
