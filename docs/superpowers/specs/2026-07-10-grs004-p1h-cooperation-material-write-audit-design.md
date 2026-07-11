# GRS004 / P1-H 合作办赛材料写入审计 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§10 企业题目防篡改`
    - 缺少文件修改的审计日志
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`

`P1-A` 已经在合作办赛上传时补上：

- `taskPackageFileHash`
- `proposalFileHash`

`P1-D` 已经在 `approveCooperationRequest()` 前补上读取校验与拒绝审计。但 `§10` 里“缺少文件修改的审计日志”仍有一个很真实的剩余口子：

- `submitCooperationRequest()` 会把 `task package / proposal` 写进 `public/uploads`
- 这条 sanctioned 文件写路径当前还没有统一审计事实

本轮目标是：**为合作办赛材料上传这条 sanctioned 写路径补上最小 `SecurityAudit` 记录。**

## 范围

### 本轮纳入

- 只收口合作办赛材料的 sanctioned 写路径：
  - `submitCooperationRequest()`
- 只为成功创建的 `CooperationRequest` 写统一审计
- 审计覆盖：
  - `taskPackageFileHash`
  - `taskPackageFilePath`
  - `proposalFileHash`
  - `proposalFilePath`
  - `submitterId`

### 本轮不纳入

- 不新增 schema
- 不引入文件系统 watcher
- 不做 OS 级真实“谁改了文件”的外部篡改取证
- 不新增下载页 / 预览页
- 不修改 `approveCooperationRequest()` 的读校验逻辑

## 约束

### 当前代码现实

- `src/lib/services/cooperation.ts`
  - `saveFile()` 会把上传文件写入 `public/uploads/cooperation/...`
  - `submitCooperationRequest()` 会把文件 hash/path 写进 `CooperationRequest`
- `P1-D` 已证明 `approveCooperationRequest()` 是当前最真实的读校验入口
- `SecurityAudit`
  - 已可承载 `targetType / targetId / detailsJson`

因此本轮应遵循：**不发明“全量文件修改历史”，只给当前真实存在的上传写入口补统一审计。**

## 方案选择

### 方案 A：审计 `submitCooperationRequest()` 成功写入

做法：

- 上传文件保存完成
- `CooperationRequest` create 成功后写：
  - `action = cooperation_request.materials_create`
- `detailsJson` 记录：
  - task package / proposal 的 hash、path、name

优点：

- 直接命中第 10 节“缺少文件修改审计日志”的最小真实入口
- 改动小
- 与 `P1-F submission_artifact.create` 风格一致

缺点：

- 不能覆盖文件被外部进程篡改时的完整 OS 级修改历史

### 方案 B：只依赖 `approveCooperationRequest()` 的拒绝审计

优点：

- 不新增任何动作审计

缺点：

- 只能看到“读时发现问题”
- 看不到“最初文件是什么时候由谁上传写入的”

### 推荐方案

采用 **方案 A：审计 `submitCooperationRequest()` 成功写入**。

原因：

- 这是当前第 10 节最真实的文件写入口
- 比发明新的文件历史模型更贴近当前代码

## 审计策略

使用现有 `SecurityAudit`：

- `action = cooperation_request.materials_create`
- `targetType = CooperationRequest`
- `targetId = request.id`
- `actorKind = USER`
- `result = accepted`

`detailsJson` 至少包含：

- `companyName`
- `raceTitle`
- `taskPackageFileHash`
- `taskPackageFilePath`
- `taskPackageFileName`
- `proposalFileHash`
- `proposalFilePath`
- `proposalFileName`

## 测试对齐

需要扩展：

- `src/lib/services/material-integrity-cooperation.test.ts`

覆盖：

- `submitCooperationRequest()` 成功后会写 `cooperation_request.materials_create`
- details 中带上上传材料 hash/path

## 验收对齐

本轮完成后，需要能证明：

1. 合作办赛材料的 sanctioned 写路径会写统一审计
2. 审计与 `CooperationRequest` 一一对应
3. 审计 details 中能带出材料 hash/path
4. 本轮没有新增 schema 或文件下载页

## 一句话结论

`P1-H` 的目标是：*把合作办赛材料上传这条 sanctioned 文件写路径接入统一 `SecurityAudit`，为第 10 节“缺少文件修改的审计日志”补上最小真实入口。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/cooperation.ts`
  - `submitCooperationRequest()` 现在会在 `CooperationRequest` create 成功后写入：
    - `SecurityAudit(action=cooperation_request.materials_create, result=accepted)`
  - `detailsJson` 当前已包含：
    - `companyName`
    - `raceTitle`
    - `taskPackageFileHash / taskPackageFilePath / taskPackageFileName`
    - `proposalFileHash / proposalFilePath / proposalFileName`
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 已覆盖 create 路径写审计
  - 同时保留上一轮 `approveCooperationRequest()` 的读取校验覆盖

### 本轮明确没有做的事

- 没有新增文件系统 watcher
- 没有新增下载或预览页面
- 没有新增 OS 级修改历史
- 没有引入数字签名

### 新鲜验证证据

- `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
- `npm run build`
