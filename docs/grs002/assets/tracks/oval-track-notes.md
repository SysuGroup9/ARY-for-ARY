# oval-track 赛道校准说明

## 底图

SVG 自绘，标准椭圆田径场。2560×1263，Morandi 暖调配色。后续可用 AI 生成真实施工赛道图替换。

## 校准参数

| 参数 | 值 |
|------|-----|
| 画布 | 2560×1263 |
| 椭圆中心 | (1280, 631) |
| rx / ry | 1030 / 510 |
| 控制点数 | 12，θ 从 -π/2 开始每隔 π/6 取一点 |
| 方向 | 顺时针 |
| 起点 s | 0（顶部正中） |
| 车道 | 3 条，偏移 -55 / 0 / +55 px |
| 检查点 | 3 个（s=0.25 / 0.5 / 0.75） |

## Calibrator 校准步骤

1. 打开 `/calibrator`，导入 `background.svg`
2. 预设 12 个控制点自动对齐椭圆中心线
3. 拖拽微调控制点使路径贴合底图赛道视觉线
4. 底部 Preview Bar 拖动进度条验证 0%→100% 单马运行
5. 多马预览（8 匹）验证车道偏移不交叉
6. 点 Validate 确认 schema + geometry 通过
7. Export → 替换此 `track.profile.json`

## 验证

- [x] Schema validation
- [x] Geometry validation  
- [x] 0%→100% 单马预览
- [x] 8 马多马预览
- [x] Jumbotron 直接加载
