# Oval Track AI 生成 Prompt

## 设计目标

生成一张 16:9 赛马场赛道俯视图底图，用于 ARY Jumbotron 赛事大屏可视化。

## 推荐 Prompt

```
A top-down bird's eye view of a horse racing track, oval shape,
surrounded by green grass field.
The track surface is light sandy beige, with 3 lanes marked by white dashed lines.
A red start/finish line at the top center.
Clean minimalist vector art style, soft natural lighting,
16:9 aspect ratio, suitable for large screen display.
No horses, no text overlays, no UI elements.
Resolution 2560x1263.
```

## 生成过程

1. 使用 AI 图像生成工具（Midjourney / DALL-E / Stable Diffusion）生成候选底图
2. 在 Calibrator 中导入底图
3. 人工编辑 centerline 控制点，使赛道几何与底图视觉对齐
4. 配置车道偏移、检查点
5. Validate → Export

## 底图来源说明

当前 `background.png` 为 AI 生成替代底图。
MVVP 阶段使用手绘 SVG 保证精确的几何对齐。
