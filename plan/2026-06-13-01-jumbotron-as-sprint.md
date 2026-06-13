# Jumbotron A/S Sprint Plan

## 目标

把当前 Jumbotron MVP 从“可运行工程骨架”提升为符合 ARY GRS 002 A/S 评分口径的完整交付。

核心策略：

- 用评分矩阵明确每个评分项的证据文件；
- 用动态 demo snapshot 证明大屏不是静态贴图；
- 用 `track-runtime` 证明位置、方向、lane offset、debug 信息由可信几何驱动；
- 用 Calibrator 证明视觉底图可以校准为可运行 `track.profile.json`；
- 用 Riding Record 与视频脚本补齐硬性门槛。

## 评分矩阵

| 评分项 | 分值 | 当前风险 | 冲刺目标 | 证据文件 / 入口 |
|---|---:|---|---|---|
| 问题理解与系统边界 | 10 | 文档有，但评分对齐不够直接 | 增加 GRS-002 对齐说明，明确 Runtime / Calibrator / DCR 边界 | `docs/jumbotron-mvp.md`, `ROADMAP.md` |
| Race Live View 运行体验 | 20 | 静态感较强，缺少现场叙事和 drill-down | 增加动态 progress、lead gap、drill-down 入口、risk panel、现场感文案 | `/jumbotron?debug=1` |
| Calibrator 与资产生产 | 20 | MVP 能编辑点和 lane，但 zone / diff / debug export 不足 | 增加 message zone / no bubble zone / risk zone、JSON diff、debug preview export | `/jumbotron/calibrator` |
| Runtime 与数据契约 | 20 | 有采样与 pose，但补间、collision box、异常 debug 不足 | 增加 s 轴补间、collision box、lane fallback warning、RaceSnapshot contract | `src/lib/jumbotron/*` |
| Demo 与短视频表达 | 10 | 缺短视频材料 | 产出 3-5 分钟分镜脚本与录制 checklist | `docs/jumbotron-demo-video-script.md` |
| Agent Riding Skill | 15 | 只有 ROADMAP，不够完整 | 产出 Riding Record：计划、干预、错误、验收、复盘 | `riding_record/agent_riding_jumbotron_grs002.md` |
| 文档与交付性 | 5 | 基础文档有，但不够参赛化 | 补运行入口、mock/真实边界、资产说明、未实现部分 | `README.md`, `docs/jumbotron-mvp.md` |

## 执行步骤

1. 增强 `track-runtime`：s 轴补间、collision box、runtime warnings。
2. 增强 mock data：当前时间可运行、多个赛事状态、风险/消息数据故事。
3. 增强 Race Live View：动态演示、debug collision boxes、drill-down 信息、风险面板。
4. 增强 Calibrator：zone 编辑、JSON diff、debug preview export。
5. 补资产说明：两条 track profile 的校准说明和切换路径。
6. 补 Riding Record 与视频脚本。
7. 补测试，运行 `node --import tsx --test src/lib/jumbotron/*.test.ts`、`npm run lint`、`npm run build`。

## 验收口径

- `/jumbotron?debug=1` 能展示动态 Race Live View、TOP3、KPI、消息、风险、debug 几何。
- `/jumbotron?track=city-hairpin&debug=1` 能切换第二条赛道。
- `/jumbotron/calibrator` 能完成导入 / 编辑 / zone / Validate / Export / Debug Preview 流程。
- 文档能直接支持录制 GRS-002 短视频。
